"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInAdmin } from "@/lib/supabase/adminAuth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInAdmin(email, password);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="max-w-sm w-full space-y-5">
        <h1 className="font-display text-bone text-3xl text-center mb-6">Admin Login</h1>

        {error && (
          <p role="alert" className="text-ember text-sm text-center">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="email" className="block font-body text-sm text-bone/70 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-smoke border border-bone/20 rounded-sm px-4 py-3 text-bone focus-visible:outline focus-visible:outline-3 focus-visible:outline-char"
          />
        </div>

        <div>
          <label htmlFor="password" className="block font-body text-sm text-bone/70 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-smoke border border-bone/20 rounded-sm px-4 py-3 text-bone focus-visible:outline focus-visible:outline-3 focus-visible:outline-char"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full font-body font-bold uppercase tracking-wide bg-flame text-bone px-6 py-3 rounded-sm hover:bg-ember transition-colors disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </main>
  );
}
