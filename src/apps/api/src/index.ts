import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import { requireAuth, AuthedRequest } from "./middleware/requireAuth";
import { requireRole } from "./middleware/requireRole";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true, service: "meditag-api" }));

app.get("/", (_req, res) => {
  res.send("MediTag API is running. Try /health");
});

app.use("/auth", authRoutes);

app.get("/me", requireAuth, (req: AuthedRequest, res) => {
  res.json({ user: req.user });
});

app.get("/admin/ping", requireAuth, requireRole("admin"), (_req, res) => {
  res.json({ ok: true, admin: true});
})


const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
