import { ZodSchema, ZodError } from 'zod';
import { RequestHandler, NextFunction, Request, Response } from 'express';
import CustomError from '../helpers/CustomError';

export const validateRequest = (schema: ZodSchema): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // If body is empty
            if (!req.body || Object.keys(req.body).length === 0) {
                return next(
                    new CustomError(400, 'At least one field is required', [
                        { field: 'value', message: 'At least one field is required' },
                    ])
                );
            }

            // Validate using Zod
            await schema.parseAsync(req.body);

            next();
        } catch (err: any) {
            if (err instanceof ZodError) {
                const errors = err.issues.map((issue) => ({
                    field: issue.path[0] ?? 'unknown',
                    message: issue.message,
                }));
                return next(new CustomError(400, 'Validation failed', errors));
            }
            next(err);
        }
    };
};
