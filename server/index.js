import "dotenv/config";
import { createApp } from "./app.js";
import { isResendConfigured } from "./lib/resend-config.js";

const isProd = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT) || 5174;
const app = createApp({ serveStatic: isProd });

app.listen(port, () => {
  const llm = Boolean(process.env.LLM_API_KEY?.trim());
  const resend = isResendConfigured();
  console.log(`ZaidOS API → http://localhost:${port}`);
  console.log(`  LLM: ${llm ? "ready" : "offline (set LLM_API_KEY)"}`);
  console.log(`  Resend: ${resend ? "ready" : "offline (set RESEND_API_KEY + CONTACT_TO_EMAIL)"}`);
});
