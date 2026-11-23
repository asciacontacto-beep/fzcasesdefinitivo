import { LoginForm } from "@/components/admin/login-form";

export const metadata = { title: "Ingresar" };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <LoginForm />
    </main>
  );
}
