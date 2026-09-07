import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="font-display mb-2 text-3xl font-semibold">Host sign in</h1>
      <p className="mb-8 text-muted-foreground">
        For apartment hosts only — manage events, confessions, and text blasts.
      </p>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
