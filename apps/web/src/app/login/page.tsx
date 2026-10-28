import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<div className="h-21" />}>
        <Header />
      </Suspense>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <Suspense fallback={<p>Carregando formulário...</p>}>
          <LoginForm />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}