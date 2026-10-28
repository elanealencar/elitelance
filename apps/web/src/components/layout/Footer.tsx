import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-[#101116]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-8 md:flex-row">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="EliteLance - Página inicial"
        >
          <Image
            src="/logo_icon.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
          />

          <span className="text-xl font-bold tracking-tight text-white">
            Elite<span className="text-primary">Lance</span>
          </span>
        </Link>

        <div className="flex flex-col items-center gap-2 text-center md:items-end md:text-right">
          <p className="text-xs text-muted">
            Projeto desenvolvido para o desafio técnico Elite Dev
          </p>

          <a
            href="https://linkedin.com/in/elanealencar"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 text-xs text-muted transition-colors hover:text-primary"
            aria-label="LinkedIn de Elane Alencar"
          >
            <span>
              Desenvolvido por{" "}
              <span className="font-semibold text-white transition-colors group-hover:text-primary">
                Elane Alencar
              </span>
            </span>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className="text-primary"
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.35V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124ZM7.119 20.452H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}