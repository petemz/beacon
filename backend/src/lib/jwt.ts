import { ValidationError } from "@/utils/error";
import crypto from "crypto";

const SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";

const EXPIRES_IN_MS = 2 * 60 * 60 * 1000; //expires in 2 hours


interface TrackingPayload {
    childId: string;
    childName: string;
    iat: number;
    exp: number;
}


function base64url(input: string): string{
    return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function signTrackingToken(childId: string, childName: string): string{
    const header = base64url(JSON.stringify({alg: "H2S256", typ: "JWT"}));
    const now = Date.now();

    const payload = base64url(JSON.stringify({
        childId,
        childName,
        iat: Math.floor(now / 1000),
        exp: Math.floor(now + EXPIRES_IN_MS / 1000)
    }));

    const signature = crypto.createHmac("sha256", SECRET).update(`${header}.${payload}`).digest("base64url");

    return `${header}.${payload}.${signature}`;
}

export function verifyTrackingToken(token: string): TrackingPayload {
    const parts = token.split(".");

    if (parts.length !== 3) {
        throw new ValidationError("Invalid token format")
    }

    const [header, payload, signature] = parts;

    const expected = crypto.createHmac("sha256", SECRET).update(`${header}.${payload}`).digest("base64url");

    if (signature !== expected) {
        throw new ValidationError("Invalid token signature")
    }

    const data: TrackingPayload = JSON.parse(Buffer.from(payload, "base64url").toString());

    if(data.exp < Math.floor(Date.now() / 1000)) {
        throw new ValidationError("Tracking token has expired")
    }

    return data
}

export function buildTrackingUrl(childId: string, childName: string): string{
    const token = signTrackingToken(childId, childName);
    return `${process.env.BASEURL ?? "http://localhost:3000"}`
}