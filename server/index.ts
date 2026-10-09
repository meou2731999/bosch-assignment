import { createApp } from "./app";
const port = Number(process.env.PORT ?? 3001);
createApp({ production: process.argv.includes("--production") }).listen(
  port,
  "127.0.0.1",
  () => {
    console.log(
      `Demo API: http://127.0.0.1:${port} (mock identity; local use only)`,
    );
  },
);
