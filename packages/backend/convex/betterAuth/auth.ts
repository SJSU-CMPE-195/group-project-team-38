import { createAuth } from "../auth";

// Static auth instance used only by Better Auth CLI schema generation.
export const auth = createAuth({} as any);