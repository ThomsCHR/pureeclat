import express from "express";
import cors from "cors";
import serviceRoutes from "../routers/serviceRoutes";

const app = express();
app.use(cors());

const PORT = 3000;

app.use(express.json());

app.use("/api/services", serviceRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
