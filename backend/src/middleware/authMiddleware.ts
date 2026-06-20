import { Request, Response, NextFunction } from "express";
import { prisma } from "@/lib/prisma";
import { AuthenticationError } from "@/utils/error";

export interface AuthedRequest extends Request {
    parentId: string
}


/**
 * Reads the magic link token from the Authorization header
 * (Bearer <token>) or from the ?token= query param.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;
    const token = (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null) ?? req.query.token as string | undefined;

    if(!token) {
        throw new AuthenticationError("Authentication required")
    }

    const parent = await prisma.parent.findUnique({
        where: {magicLinkToken: token},
        select: {id: true}
    });

    if (!parent) {
        throw new AuthenticationError("Invalid or expired session")
    }

    (req as AuthedRequest).parentId = parent.id;
    next();
}