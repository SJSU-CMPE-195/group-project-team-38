import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { signToken } from "../lib/jwt";

const prisma = new PrismaClient();
const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success)  {
    return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  const user = await prisma.nurse.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken({ sub: user.id, role: user.role, email: user.email });

  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });

});

export default router;