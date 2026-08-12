import cors from "cors";
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import { contactRouter } from "./routes/contact.js";
import { chatRouter } from "./routes/chat.js";
import { musicRouter } from "./routes/music.js";
import { browserRouter } from "./routes/browser.js";
import { proxyRouter } from "./routes/proxy.js";
import { canEmbedRouter } from "./routes/can-embed.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

export function createApp({ serveStatic = false } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/contact", contactRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/music", musicRouter);
  app.use("/api/browser/session", browserRouter);
  app.use("/api/proxy", proxyRouter);
  app.use("/api/can-embed", canEmbedRouter);

  if (serveStatic) {
    app.use(express.static(join(root, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(join(root, "dist", "index.html"));
    });
  }

  return app;
}
