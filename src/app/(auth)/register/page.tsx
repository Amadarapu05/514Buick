import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="font-display mb-2 text-3xl font-semibold">Register</h1>
      <p className="mb-8 text-muted-foreground">
        Create an account to RSVP to events at 514 Buick.
      </p>
      <RegisterForm />
    </div>
  );
}
