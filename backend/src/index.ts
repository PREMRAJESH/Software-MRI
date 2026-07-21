import express from "express";
import cors from "cors";
import router from "./router.js";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3001", 10);

app.use(cors({ origin: true }));
app.use(express.json());

app.use("/api", router);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", engine: "static-analysis", version: "1.0.0" });
});

app.listen(PORT, () => {
  console.log(`[MRI Backend] Running on http://localhost:${PORT}`);
});
