import { eq, and, ilike, desc, sql } from "drizzle-orm";
import { db } from "../../config/db.js";
import { tickets, users, notifications, pointsTransactions } from "../../db/schema.js";
import type {
  CreateTicketInput,
  UpdateTicketStatusInput,
  GetTicketsQuery,
} from "./ticket.validation.js";
import type { JwtUserPayload } from "../auth/auth.types.js";

export interface TicketServiceResult<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── 1. Create Ticket Service ───────────────────────────────────────────────

export const createTicketService = async (
  userId: number,
  data: CreateTicketInput
): Promise<TicketServiceResult> => {
  // 1. Verify user exists and check approval status
  const [creator] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!creator) {
    return {
      success: false,
      statusCode: 404,
      message: "User account not found.",
    };
  }

  // 2. Reject pending or rejected regular users
  if (creator.role !== "admin" && creator.status !== "approved") {
    return {
      success: false,
      statusCode: 403,
      message: "Access denied. Only approved user accounts can raise support tickets.",
    };
  }

  const isRegularUser = creator.role === "user";
  const pointsToAward = isRegularUser ? 50 : 0;

  // 3. Insert new ticket and award 50 points atomically in a database transaction
  const result = await db.transaction(async (tx) => {
    const [newTicket] = await tx
      .insert(tickets)
      .values({
        userId,
        subject: data.subject,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: "open",
      })
      .returning();

    if (!newTicket) {
      throw new Error("Failed to create ticket.");
    }

    if (isRegularUser) {
      // Award 50 loyalty points to user
      await tx
        .update(users)
        .set({
          pointsBalance: sql`${users.pointsBalance} + ${pointsToAward}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Record points transaction with reference to ticket
      await tx.insert(pointsTransactions).values({
        userId,
        points: pointsToAward,
        activity: "TICKET_CREATED",
        description: `50 bonus points for creating ticket #${newTicket.id}`,
        referenceId: newTicket.id,
        createdBy: userId,
      });

      // Send automatic Ticket Created notification with points info
      await tx.insert(notifications).values({
        userId,
        title: "Ticket Created",
        message: "Congratulations! You earned 50 loyalty points for creating your ticket.",
        type: "ticket",
        isRead: false,
        metadata: {
          ticketId: newTicket.id,
          points: pointsToAward,
          activity: "TICKET_CREATED",
        },
      });
    } else {
      // Non-user (e.g. admin testing) creates ticket without loyalty points
      await tx.insert(notifications).values({
        userId,
        title: "Ticket Created",
        message: `Your support ticket #${newTicket.id} has been successfully created. Our team will review it shortly.`,
        type: "ticket",
        isRead: false,
        metadata: { ticketId: newTicket.id },
      });
    }

    return {
      ...newTicket,
      pointsAwarded: pointsToAward,
    };
  });

  return {
    success: true,
    statusCode: 201,
    message: "Ticket created successfully.",
    data: result,
  };
};

// ─── 2. Get All Tickets Service ─────────────────────────────────────────────

export const getAllTicketsService = async (
  user: JwtUserPayload,
  query: GetTicketsQuery
): Promise<TicketServiceResult> => {
  // If user is a regular member and not approved, reject access
  if (user.role !== "admin" && user.status !== "approved") {
    return {
      success: false,
      statusCode: 403,
      message: "Access denied. Only approved accounts can view support tickets.",
    };
  }

  const { page, limit, status, priority, category, search } = query;
  const offset = (page - 1) * limit;

  const conditions = [];

  // Role-based scoping: regular users can ONLY view their own tickets
  if (user.role !== "admin") {
    conditions.push(eq(tickets.userId, user.id));
  }

  // Filter by status if specified and not 'all'
  if (status && status !== "all") {
    conditions.push(eq(tickets.status, status));
  }

  // Filter by priority if specified and not 'all'
  if (priority && priority !== "all") {
    conditions.push(eq(tickets.priority, priority));
  }

  // Filter by category if specified
  if (category && category.length > 0) {
    conditions.push(ilike(tickets.category, `%${category}%`));
  }

  // Search by subject if specified
  if (search && search.length > 0) {
    conditions.push(ilike(tickets.subject, `%${search}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Count total matching tickets
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tickets)
    .where(whereClause);

  const total = Number(countResult?.count ?? 0);
  const totalPages = Math.ceil(total / limit) || 1;

  // Fetch tickets with creator details (never exposing password hash)
  const ticketList = await db
    .select({
      id: tickets.id,
      userId: tickets.userId,
      subject: tickets.subject,
      description: tickets.description,
      category: tickets.category,
      priority: tickets.priority,
      status: tickets.status,
      assignedTo: tickets.assignedTo,
      adminResponse: tickets.adminResponse,
      resolvedAt: tickets.resolvedAt,
      openedAt: tickets.openedAt,
      openedBy: tickets.openedBy,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
      creator: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      },
    })
    .from(tickets)
    .leftJoin(users, eq(tickets.userId, users.id))
    .where(whereClause)
    .orderBy(desc(tickets.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    success: true,
    statusCode: 200,
    message: "Tickets retrieved successfully.",
    data: ticketList,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
};

// ─── 3. Get Ticket By ID Service ────────────────────────────────────────────

export const getTicketByIdService = async (
  ticketId: number,
  user: JwtUserPayload
): Promise<TicketServiceResult> => {
  // Fetch ticket with creator details
  const [ticket] = await db
    .select({
      id: tickets.id,
      userId: tickets.userId,
      subject: tickets.subject,
      description: tickets.description,
      category: tickets.category,
      priority: tickets.priority,
      status: tickets.status,
      assignedTo: tickets.assignedTo,
      adminResponse: tickets.adminResponse,
      resolvedAt: tickets.resolvedAt,
      openedAt: tickets.openedAt,
      openedBy: tickets.openedBy,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
      creator: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      },
    })
    .from(tickets)
    .leftJoin(users, eq(tickets.userId, users.id))
    .where(eq(tickets.id, ticketId))
    .limit(1);

  if (!ticket) {
    return {
      success: false,
      statusCode: 404,
      message: "Ticket not found.",
    };
  }

  // Authorization check: regular users cannot view other users' tickets
  if (user.role !== "admin" && ticket.userId !== user.id) {
    return {
      success: false,
      statusCode: 403,
      message: "Access denied. You can only view your own support tickets.",
    };
  }

  return {
    success: true,
    statusCode: 200,
    message: "Ticket retrieved successfully.",
    data: ticket,
  };
};

// ─── 4. Admin Opens Ticket Service (Awards 20 points once to ticket owner) ──

export const openTicketService = async (
  ticketId: number,
  adminId: number
): Promise<TicketServiceResult> => {
  return await db.transaction(async (tx) => {
    // 1. Fetch ticket and lock row
    const [ticket] = await tx
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .for("update");

    if (!ticket) {
      return {
        success: false,
        statusCode: 404,
        message: "Ticket not found.",
      };
    }

    // 2. Fetch ticket creator (owner)
    const [ticketOwner] = await tx
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, ticket.userId))
      .limit(1);

    // 3. Check whether ticket has already been opened or points already awarded
    const [existingOpenedTx] = await tx
      .select({ id: pointsTransactions.id })
      .from(pointsTransactions)
      .where(
        and(
          eq(pointsTransactions.activity, "TICKET_OPENED"),
          eq(pointsTransactions.referenceId, ticketId)
        )
      )
      .limit(1);

    const alreadyOpened = !!existingOpenedTx || ticket.openedAt !== null;

    // 4. Update ticket opened timestamp & openedBy if first open
    if (!ticket.openedAt) {
      await tx
        .update(tickets)
        .set({
          openedAt: new Date(),
          openedBy: adminId,
          updatedAt: new Date(),
        })
        .where(eq(tickets.id, ticketId));
    }

    // If already opened previously, do not award points again (Idempotency)
    if (alreadyOpened) {
      return {
        success: true,
        statusCode: 200,
        message: "Ticket already opened previously. No additional points awarded.",
        data: {
          ticket: {
            ...ticket,
            openedAt: ticket.openedAt || new Date(),
            openedBy: ticket.openedBy || adminId,
          },
          pointsAwarded: 0,
        },
      };
    }

    // Only regular users receive loyalty points; never award points to admin
    if (!ticketOwner || ticketOwner.role !== "user") {
      return {
        success: true,
        statusCode: 200,
        message: "Ticket opened. Ticket creator is an administrator (no points eligible).",
        data: {
          ticket: {
            ...ticket,
            openedAt: new Date(),
            openedBy: adminId,
          },
          pointsAwarded: 0,
        },
      };
    }

    // Check cumulative ticket points limit (max 120 pts per ticket)
    const [sumRes] = await tx
      .select({ total: sql<number>`coalesce(sum(${pointsTransactions.points}), 0)::int` })
      .from(pointsTransactions)
      .where(
        and(
          eq(pointsTransactions.referenceId, ticketId),
          sql`${pointsTransactions.activity} IN ('TICKET_CREATED', 'TICKET_OPENED', 'TICKET_RESOLVED')`
        )
      );

    const currentTotal = Number(sumRes?.total ?? 0);
    const pointsToAward = Math.min(20, Math.max(0, 120 - currentTotal));

    if (pointsToAward > 0) {
      // Award 20 points to ticket owner
      await tx
        .update(users)
        .set({
          pointsBalance: sql`${users.pointsBalance} + ${pointsToAward}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ticketOwner.id));

      // Record TICKET_OPENED transaction
      await tx.insert(pointsTransactions).values({
        userId: ticketOwner.id,
        points: pointsToAward,
        activity: "TICKET_OPENED",
        description: `20 bonus points for admin review on ticket #${ticketId}`,
        referenceId: ticketId,
        createdBy: adminId,
      });

      // Send notification to ticket owner
      await tx.insert(notifications).values({
        userId: ticketOwner.id,
        title: "Ticket Opened",
        message: "Your ticket has been opened by our admin team. You earned 20 loyalty points.",
        type: "ticket",
        isRead: false,
        metadata: {
          ticketId,
          points: pointsToAward,
          activity: "TICKET_OPENED",
        },
      });
    }

    return {
      success: true,
      statusCode: 200,
      message: `Ticket opened successfully. ${pointsToAward} loyalty points awarded to ticket owner.`,
      data: {
        ticket: {
          ...ticket,
          openedAt: new Date(),
          openedBy: adminId,
        },
        pointsAwarded: pointsToAward,
        ticketOwner: {
          id: ticketOwner.id,
          name: ticketOwner.name,
          email: ticketOwner.email,
        },
      },
    };
  });
};

// ─── 5. Update Ticket Status Service (Admin Only - Awards 50 points on resolve) ─

export const updateTicketStatusService = async (
  ticketId: number,
  adminId: number,
  data: UpdateTicketStatusInput
): Promise<TicketServiceResult> => {
  return await db.transaction(async (tx) => {
    // 1. Fetch existing ticket with row lock
    const [existingTicket] = await tx
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .for("update");

    if (!existingTicket) {
      return {
        success: false,
        statusCode: 404,
        message: "Ticket not found.",
      };
    }

    const isResolving = data.status === "resolved";
    const wasAlreadyResolved = existingTicket.status === "resolved";
    let pointsAwarded = 0;

    // 2. Award 50 points if resolving for the first time
    if (isResolving && !wasAlreadyResolved) {
      // Check if TICKET_RESOLVED transaction already exists (Idempotency)
      const [existingResolvedTx] = await tx
        .select({ id: pointsTransactions.id })
        .from(pointsTransactions)
        .where(
          and(
            eq(pointsTransactions.activity, "TICKET_RESOLVED"),
            eq(pointsTransactions.referenceId, ticketId)
          )
        )
        .limit(1);

      if (!existingResolvedTx) {
        // Fetch ticket owner
        const [ticketOwner] = await tx
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
          })
          .from(users)
          .where(eq(users.id, existingTicket.userId))
          .limit(1);

        // Only award points to regular users, never to admins
        if (ticketOwner && ticketOwner.role === "user") {
          // Check cumulative points limit (max 120 pts per ticket)
          const [sumRes] = await tx
            .select({ total: sql<number>`coalesce(sum(${pointsTransactions.points}), 0)::int` })
            .from(pointsTransactions)
            .where(
              and(
                eq(pointsTransactions.referenceId, ticketId),
                sql`${pointsTransactions.activity} IN ('TICKET_CREATED', 'TICKET_OPENED', 'TICKET_RESOLVED')`
              )
            );

          const currentTotal = Number(sumRes?.total ?? 0);
          pointsAwarded = Math.min(50, Math.max(0, 120 - currentTotal));

          if (pointsAwarded > 0) {
            // Update owner balance
            await tx
              .update(users)
              .set({
                pointsBalance: sql`${users.pointsBalance} + ${pointsAwarded}`,
                updatedAt: new Date(),
              })
              .where(eq(users.id, ticketOwner.id));

            // Record points transaction
            await tx.insert(pointsTransactions).values({
              userId: ticketOwner.id,
              points: pointsAwarded,
              activity: "TICKET_RESOLVED",
              description: `50 bonus points for resolving ticket #${ticketId}`,
              referenceId: ticketId,
              createdBy: adminId,
            });

            // Send notification for ticket resolution and bonus points
            await tx.insert(notifications).values({
              userId: ticketOwner.id,
              title: "Ticket Resolved",
              message: "Your ticket has been resolved successfully. You earned 50 loyalty points.",
              type: "ticket",
              isRead: false,
              metadata: {
                ticketId,
                points: pointsAwarded,
                activity: "TICKET_RESOLVED",
              },
            });
          }
        }
      }
    }

    // 3. Prepare update payload
    const updatePayload: {
      status: "open" | "in_progress" | "resolved" | "closed";
      updatedAt: Date;
      resolvedAt?: Date | null;
      adminResponse?: string;
      assignedTo?: number;
    } = {
      status: data.status,
      updatedAt: new Date(),
      assignedTo: adminId,
    };

    if (data.status === "resolved") {
      updatePayload.resolvedAt = existingTicket.resolvedAt || new Date();
    } else if (data.status === "open" || data.status === "in_progress") {
      updatePayload.resolvedAt = null;
    }

    if (data.adminResponse !== undefined) {
      updatePayload.adminResponse = data.adminResponse;
    }

    // 4. Update ticket in PostgreSQL
    const [updatedTicket] = await tx
      .update(tickets)
      .set(updatePayload)
      .where(eq(tickets.id, ticketId))
      .returning();

    // 5. Send status update notification if non-resolved status changed
    if (existingTicket.status !== data.status && data.status !== "resolved") {
      let title = "Ticket Status Updated";
      let message = `Your support ticket #${ticketId} status has been updated to ${data.status.replace("_", " ")}.`;

      if (data.status === "open") {
        title = "Ticket Status: Open";
        message = `Your support ticket #${ticketId} is now Open. Our support team is working on your request.`;
      } else if (data.status === "in_progress") {
        title = "Ticket In Progress";
        message = `Our support team has started working on your ticket #${ticketId}.`;
      }

      await tx.insert(notifications).values({
        userId: existingTicket.userId,
        title,
        message,
        type: "ticket",
        isRead: false,
        metadata: {
          ticketId,
          previousStatus: existingTicket.status,
          newStatus: data.status,
          adminResponse: data.adminResponse || null,
        },
      });
    }

    return {
      success: true,
      statusCode: 200,
      message: pointsAwarded > 0
        ? `Ticket resolved successfully. ${pointsAwarded} loyalty points awarded to ticket owner.`
        : "Ticket status updated successfully.",
      data: {
        ...updatedTicket,
        pointsAwarded,
      },
    };
  });
};

// ─── 5. Delete Ticket Service (Admin Only) ──────────────────────────────────

export const deleteTicketService = async (
  ticketId: number
): Promise<TicketServiceResult> => {
  // 1. Check whether ticket exists
  const [existingTicket] = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);

  if (!existingTicket) {
    return {
      success: false,
      statusCode: 404,
      message: "Ticket not found.",
    };
  }

  // 2. Delete ticket from PostgreSQL
  await db.delete(tickets).where(eq(tickets.id, ticketId));

  return {
    success: true,
    statusCode: 200,
    message: "Ticket deleted successfully.",
  };
};

// ─── 6. Get Recent Tickets Service (Admin) ──────────────────────────────────

export const getRecentTicketsService = async (limitCount = 10) => {
  return await db
    .select({
      id: tickets.id,
      userId: tickets.userId,
      subject: tickets.subject,
      description: tickets.description,
      category: tickets.category,
      priority: tickets.priority,
      status: tickets.status,
      assignedTo: tickets.assignedTo,
      adminResponse: tickets.adminResponse,
      resolvedAt: tickets.resolvedAt,
      openedAt: tickets.openedAt,
      openedBy: tickets.openedBy,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
      creator: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      },
    })
    .from(tickets)
    .leftJoin(users, eq(tickets.userId, users.id))
    .orderBy(desc(tickets.createdAt))
    .limit(limitCount);
};


