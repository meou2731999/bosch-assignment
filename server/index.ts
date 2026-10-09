import { createApp } from "./app";
const port = Number(process.env.PORT ?? 3001);
createApp({
  production: process.argv.includes("--production"),
  dataDir: process.env.DATA_DIR,
  secureCookies: process.env.SECURE_COOKIES === "true",
}).listen(port, "127.0.0.1", () => {
  console.log(`API: http://127.0.0.1:${port}`);
});
