import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export type AuthedRequest = Request & {
  user?: { sub: string; role: string; email?: string };
};

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction)  {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });

  const token = header.slice("Bearer ".length);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = { sub: decoded.sub, role: decoded.role, email: decoded.email };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}