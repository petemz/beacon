import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import http from "http";
import dotenv from "dotenv";
import { globalErrorHandler } from "@/middleware/globalErrorHandler";
import { logger } from "@/utils/logger";
import { createWsServer } from "@/lib/ws";

dotenv.config();


const app: Application = express();
const PORT: number = Number(process.env.PORT ?? 3000);

app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());


// error handler (after routes)
app.use(globalErrorHandler);

 export const startServer = async() => {
    try {
        const server = http.createServer(app);
        // attach websocket server
        createWsServer(server);
        server.keepAliveTimeout = 60000;
        server.headersTimeout = 65000;

        server.listen(PORT, () => {
            logger.info(`Server is now running on PORT ${PORT}`);
        });

        const shutdown = async(signal: string) => {
            logger.info(`${signal} received. Shutting down gracefully...`);
            server.close(async () => {
                logger.info(`Server shut down complete`);
                process.exit(0);
            });
        };

        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));

        process.on("uncaughtException", (error) => {
            logger.error("Uncaught exception", error);
            process.exit(1);
        });

        process.on("unhandledRejection", (reason) => {
            logger.error("Uncaught Rejection", reason);
            process.exit(1);
        });
    } catch (error) {
        logger.error(`Worker ${process.pid} failed to start:`, error);
        process.exit(1);
    }
};

export default app;