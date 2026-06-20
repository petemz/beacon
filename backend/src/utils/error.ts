export class APIError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends APIError {
    errors?: any;

    constructor(message: string, errors?: any) {
        super(message, 400);
        this.errors = errors;
    }
}

export class AuthenticationError extends APIError {
    constructor(message = "Authentication Required") {
        super(message, 401)
    }
}

export class ForbiddenError extends APIError {
    constructor(message = "Access Forbidden") {
        super(message, 403);
    }
}

export class NotFoundError extends APIError {
    constructor(message = "Resource Not Found") {
        super(message, 404);
    }
}

export class ConflictError extends APIError {
    constructor(message: string) {
        super(message, 409);
    }
}

export class RateLimitError extends APIError {
    constructor(message = "Too many request! Please try again later") {
        super(message, 429);
    }
}

export class InternalError extends APIError {
    constructor(message = "Internal Server Error") {
        super(message, 500, false);
    }
}

export class ServiceUnavailableError extends APIError {
    constructor(message = "Service temporarily unavailable") {
        super(message, 503);
    }
}