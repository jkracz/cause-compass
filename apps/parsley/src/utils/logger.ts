import winston from "winston";
import path from "path";

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), "logs");
if (!require("fs").existsSync(logsDir)) {
    require("fs").mkdirSync(logsDir);
}

export const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ level, message, timestamp }) => {
            return `${timestamp} ${level}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: path.join(logsDir, "error.log"), level: "error" }),
        new winston.transports.File({ filename: path.join(logsDir, "combined.log") }),
        new winston.transports.File({ filename: path.join(logsDir, "debug.log"), level: "debug" }),
    ],
});
