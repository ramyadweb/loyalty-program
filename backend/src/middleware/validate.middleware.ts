import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny } from "zod";

export const validate = (schema: ZodTypeAny) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const data = {
            ...req.params,
            ...req.query,
            ...req.body,
        };

        const result = schema.safeParse(data);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors: result.error.flatten().fieldErrors,
            });
        }

        next();
    };
};

