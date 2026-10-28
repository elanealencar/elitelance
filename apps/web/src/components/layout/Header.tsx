import Image from "next/image";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { LogoutButton } from "@/components/auth/LogoutButton";

export async function Header() {
  const user = await getSessionUser();
  return (
    <header className="border-b border-border bg-[#101116]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="EliteLance - Página inicial"
        >
          <Image
            src="/logo_icon.png"
            alt=""
            width={44}
            height={44}
            priority
            className="h-11 w-11 object-contain"
          />

          <span className="text-2xl font-bold tracking-tight">
            Elite<span className="text-primary">Lance</span>
          </span>
        </Link>

        <nav
          className="flex items-center gap-4 sm:gap-6"
          aria-label="Navegação principal"
        >
          <Link
            href="/#leiloes"
            className="text-sm text-white/75 transition hover:text-primary"
          >
            Leilões
          </Link>

          {user ? (
            <>
              <Link
                href={user.role === "AUCTIONEER" ? "/auctioneer" : "/bidder"}
                className="hidden text-sm text-white/75 transition hover:text-primary sm:block"
              >
                Minha área
              </Link>

              <LogoutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-white/50 px-5 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary"
            >
              Entrar
            </Link>
          )}
        </nav>

      </div>
    </header>
  );
}