"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";

import { authClient } from "@/lib/auth-client";
import { api } from "@meditag/backend/convex/_generated/api";

export default function LoginPage() {
  const router = useRouter();
  const upsertCurrentUserProfile = useMutation(api.users.upsertCurrentUserProfile);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "signUp") {
        const result = await authClient.signUp.email({
          email,
          password,
          name: displayName || email,
        });

        if (result.error) {
          setMessage(result.error.message ?? "Sign up failed");
          setLoading(false);
          return;
        }
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
        });

        if (result.error) {
          setMessage(result.error.message ?? "Login failed");
          setLoading(false);
          return;
        }
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-full grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2">MediTag</h1>
        <p className="text-sm text-gray-600 mb-6">
          {mode === "signIn" ? "Sign in to continue" : "Create your account"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signUp" && (
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                className="w-full rounded-lg border px-3 py-2 outline-none"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Jane Nurse"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              className="w-full rounded-lg border px-3 py-2 outline-none"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nurse@meditag.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              className="w-full rounded-lg border px-3 py-2 outline-none"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {message && (
            <p className="text-sm text-red-600">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black text-white py-2.5 disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : mode === "signIn"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signIn" ? "signUp" : "signIn");
            setMessage("");
          }}
          className="mt-4 text-sm underline"
        >
          {mode === "signIn"
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}