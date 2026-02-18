import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import { requireAuth, AuthedRequest } from "./middleware/requireAuth";

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


const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
