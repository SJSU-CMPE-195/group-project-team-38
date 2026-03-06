const TOKEN_KEY = "meditag_admin_token";
const USER_KEY = "meditag_admin_user";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export function saveAuth(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function loadAuth(): { token: string | null; user: AuthUser | null } {
  const token = localStorage.getItem(TOKEN_KEY);
  const userStr = localStorage.getItem(USER_KEY);
  return { token, user: userStr ? JSON.parse(userStr) : null };
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
