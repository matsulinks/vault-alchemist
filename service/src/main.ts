import express from "express";
import { createApiRouter } from "./api/router.js";

const PORT = parseInt(process.env.VA_PORT ?? "3000", 10);

async function main() {
  const app = express();
  app.use(express.json());

  const startedAt = Date.now();

  app.use("/", createApiRouter(startedAt));

  // 起動時に使用中ポートを自動で避ける
  const server = app.listen(PORT, "127.0.0.1", () => {
    console.log(`[vault-alchemist] service started on port ${PORT}`);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.log(`[vault-alchemist] port ${PORT} in use, trying ${PORT + 1}`);
      server.listen(PORT + 1, "127.0.0.1");
    } else {
      console.error("[vault-alchemist] server error:", err);
      process.exit(1);
    }
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("[vault-alchemist] shutting down");
    server.close(() => process.exit(0));
  });
  process.on("SIGINT", () => {
    server.close(() => process.exit(0));
  });
}

main().catch((err) => {
  console.error("[vault-alchemist] fatal error:", err);
  process.exit(1);
});
