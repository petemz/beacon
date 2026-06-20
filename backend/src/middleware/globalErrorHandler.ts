import { Request, Response, NextFunction } from "express";
import { logger } from "@/utils/logger";
import { APIError } from "@/utils/error";

interface CustomError extends Error {
    statusCode?: number;
}

export const globalErrorHandler = (err: CustomError, _req: Request, _res: Response, _next: NextFunction) => {
    if(err instanceof APIError) {
        logger.warn(`Operational error [${err.statusCode}]: [${err.message}]`, {
            url: _req.url,
            method: _req.method
        });
        return _res.status(err.statusCode).json({
            success: false,
            message: err.message
        })
    }

    logger.error("CRITICAL SYSTEM ERROR", {
        message: err.message,
        stack: err.stack,
        url: _req.url,
        method: _req.method
    });

    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? "Internal Server Error" : err.message;

    _res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === "development" && {stack: err.stack}),
    });
};