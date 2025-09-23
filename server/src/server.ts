import app from "./app";
import { clearAllTemp } from "./utils/file";

const PORT = process.env.PORT || 5000;


app.get("/", (_req, res) => {
  res.send("server ok");
});

async function startServer() {
  await clearAllTemp();

  const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });


  const shutdown = async () => {
    console.log("Stopping server, start cleaning");
    await clearAllTemp();
    server.close(() => process.exit(0));
  };

  

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch((err) => {
  console.error("Server startup error", err);
  process.exit(1);
});
