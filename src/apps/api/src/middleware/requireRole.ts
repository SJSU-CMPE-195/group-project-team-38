import { Response, NextFunction } from "express";
import { AuthedRequest} from "./requireAuth";

export function requireRole(role: "admin" | "nurse")  {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role != role) return res.status(403).json({ error: "Forbidden" });
    return next();
  };
}