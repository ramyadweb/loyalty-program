
import { z } from "zod";

// 1. Date Range Validation
export const reportDateRangeSchema = z.object({
    startDate: z.coerce
        .date({
            message: "Start date must be a valid date",
        })
        .optional(),

    endDate: z.coerce
        .date({
            message: "End date must be a valid date",
        })
        .optional(),
}).refine(
    (data) => {
        if (data.startDate && data.endDate) {
            return data.startDate <= data.endDate;
        }

        return true;
    },
    {
        message: "Start date cannot be later than end date",
        path: ["startDate"],
    }
);

// 2. Pagination Validation
export const reportPaginationSchema = z.object({
    page: z.coerce
        .number()
        .int("Page must be an integer")
        .positive("Page must be greater than zero")
        .default(1),

    limit: z.coerce
        .number()
        .int("Limit must be an integer")
        .positive("Limit must be greater than zero")
        .max(100, "Limit cannot exceed 100")
        .default(10),
});

// 3. Monthly Report Validation
export const monthlyReportSchema = z.object({
    year: z.coerce
        .number()
        .int("Year must be an integer")
        .min(2000, "Invalid year")
        .max(2100, "Invalid year"),

    month: z.coerce
        .number()
        .int("Month must be an integer")
        .min(1, "Month must be between 1 and 12")
        .max(12, "Month must be between 1 and 12"),
});

// 4. TypeScript Types
export type ReportDateRangeInput = z.infer<
    typeof reportDateRangeSchema
>;

export type ReportPaginationInput = z.infer<
    typeof reportPaginationSchema
>;

export type MonthlyReportInput = z.infer<
    typeof monthlyReportSchema
>;
