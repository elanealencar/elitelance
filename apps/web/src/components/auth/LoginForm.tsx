"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/services/auth";
import { useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const searchParams = useSearchParams();

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { user } = await login({ email, password });

      const requestedPath = searchParams.get("next");

      const safePath =
        requestedPath?.startsWith("/") &&
        !requestedPath.startsWith("//") &&
        !requestedPath.startsWith("/\\")
          ? requestedPath
          : null;

      const destination =
        user.role === "BIDDER" && safePath
          ? safePath
          : user.role === "AUCTIONEER"
            ? "/auctioneer"
            : "/bidder";

      router.replace(destination);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro inesperado."
      );
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-10 text-center">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Bem-vindo de volta
        </p>

        <h1 className="text-4xl font-semibold tracking-tight">
          Acesse sua <span className="text-secondary">conta.</span>
        </h1>

        <p className="mt-4 text-sm text-muted">
          Entre para participar dos leilões e acompanhar
          suas oportunidades.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-surface p-8"
      >
        <div className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium"
            >
              E-mail
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-white outline-none transition focus:border-primary"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              Senha
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite sua senha"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-white outline-none transition focus:border-primary"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-black transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "ENTRANDO..." : "ENTRAR NA PLATAFORMA ↗"}
          </button>
        </div>

        <p className="mt-7 text-center text-sm text-muted">
          Ainda não tem uma conta?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary hover:underline"
          >
            Cadastre-se
          </Link>
        </p>
      </form>
    </div>
  );
}