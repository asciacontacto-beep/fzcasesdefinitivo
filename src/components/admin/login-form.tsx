"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message === "Invalid login credentials" ? "El email o la contraseña no son correctos." : error.message);
      return;
    }
    router.replace("/admin");
  };

  return (
    <form onSubmit={submit} className="w-full max-w-sm">
      <div className="mb-10 flex items-center gap-3">
        <Image src="/assets/logo.png" alt="" width={40} height={40} className="rounded-full" />
        <span className="text-display text-[22px]">FZCASES</span>
      </div>
      <h1 className="text-display text-[32px]">Panel de administración</h1>
      <p className="mt-2 text-ink-soft">Ingresá con tu cuenta de Supabase.</p>

      <div className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </div>
        <div>
          <label htmlFor="password" className="label">Contraseña</label>
          <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
        </div>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
      <Button type="submit" size="lg" className="mt-8 w-full" disabled={loading}>
        {loading ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  );
}
