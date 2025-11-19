import {type WebSocket, WebSocketServer} from "ws";

export function dev_websocket_logger(env: string = process.env.ENVIRONMENT || "development", server?: any) {
    if (env === "development") {
        const wss = new WebSocketServer({server});

        const logSubscribers = new Set<WebSocket>();
        const originalStdoutWrite = process.stdout.write.bind(process.stdout);
        const originalStderrWrite = process.stderr.write.bind(process.stderr);

        function sendToSubscribers(data: string) {
            for (const ws of logSubscribers) {
                if (ws.readyState === 1) {
                    ws.send(data);
                }
            }
        }

        process.stdout.write = (chunk: any, encoding?: any, cb?: any) => {
            sendToSubscribers(JSON.stringify({type: "stdout", data: chunk.toString()}));
            return originalStdoutWrite(chunk, encoding, cb);
        };

        process.stderr.write = (chunk: any, encoding?: any, cb?: any) => {
            sendToSubscribers(JSON.stringify({type: "stderr", data: chunk.toString()}));
            return originalStderrWrite(chunk, encoding, cb);
        };

        wss.on("connection", (ws, req) => {
            const url = req.url || "";
            if (url === "/logs") {
                logSubscribers.add(ws);
                ws.send(JSON.stringify({type: "info", data: "Connected to log stream"}));

                ws.on("close", () => {
                    logSubscribers.delete(ws);
                });
            }
        });
    }
}