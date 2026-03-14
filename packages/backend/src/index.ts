import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.js";
import { exportRouter } from "./routes/export.js";
import { importRouter } from "./routes/import.js";
import { errorHandler } from "./middleware/errorHandler.js";

const PORT = process.env["PORT"] ?? 3001;
const ALLOWED_ORIGIN = process.env["ALLOWED_ORIGIN"] ?? "http://localhost:5173";

export const app = express();

app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json());

app.use("/api/v1/health", healthRouter);
app.use("/api/v1/export", exportRouter);
app.use("/api/v1/import", importRouter);

app.use(errorHandler);

if (process.env["NODE_ENV"] !== "test") {
  app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
  });
}
