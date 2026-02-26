import { API_BASE_URL } from "../config/api";

export async function login(email: string, password: string)  {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {"Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok)  {
    throw new Error(data?.error || `Login failed ($res.status})`);
  }

  return data as  {
    token: string;
    user: { id: string; name: string; email: string; role: string };
  };
}