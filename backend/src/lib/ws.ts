import {WebSocket, WebSocketServer} from "ws";
import http, {IncomingMessage} from "http";
import { verifyTrackingToken } from "./jwt";
import { logger } from "@/utils/logger";


interface ConnectedClient {
    ws: WebSocket;
    childId: string;
}

const clients = new Map<string, Set<ConnectedClient>>();

export function createWsServer(server: http.Server): WebSocketServer {
    const wss = new WebSocketServer({server, path: "/stream"});

    wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
        //token comes as ?token=<jwt> in the query string
        const url = new URL(req.url ?? "", "http://loalhost");
        const token = url.searchParams.get("token")

        if(!token) {
            ws.close(4001, "Missing tracking token");
            return
        }

        let payload: ReturnType<typeof verifyTrackingToken>;

        try {
            payload = verifyTrackingToken(token)
        } catch {
            ws.close(4003, "Invalid or expired token")
            return
        }

        const {childId} = payload; 

        //register client
        if (!clients.has(childId)) {
            clients.set(childId, new Set());
            
        }
        const client: ConnectedClient = {ws, childId}

        clients.get(childId)!.add(client);

        logger.info(`[WS] client connected for client ${childId}`);

        ws.on("close", () => {
            clients.get(childId)?.delete(client);
            if(clients.get(childId)?.size === 0) {
                clients.delete(childId)
            }
            logger.info(`[WS] Client disconnected for child ${childId}`)
        });

        ws.on("error", (error) => {
            logger.error(`[WS] Error for child ${childId}:`, error.message)
        });

        //send a heartbeat every 20s to keep connection alive on congested network
        const heartbeat = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({type: "ping"}))
            } else {
                clearInterval(heartbeat)
            }
        }, 20_000)
    });

    return wss;
}


export interface LocationBroadcastDTO{
    latitude: number;
    longitude: number;
    landmarkName: string | null;
    batteryLevel: number | null;
    recordedAt: Date;
}

export function broadcastLocation(childId: string, data: LocationBroadcastDTO): void {
    const connected = clients.get(childId);
    if(!connected || connected.size === 0) return;

    const message = JSON.stringify({type: "location", ...data});
    for (const client of connected) {
        if(client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(message);
        }
    }
}

export function connectedClientCount(childId: string) : number{
    return clients.get(childId)?.size ?? 0;
}