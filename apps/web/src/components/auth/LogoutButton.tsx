"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Não foi possível encerrar a sessão.");
      }

      router.replace("/login");
      router.refresh();
    } catch {
      alert("Não foi possível sair. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="cursor-pointer rounded-full border border-border px-5 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Saindo..." : "Sair"}
    </button>
  );
}