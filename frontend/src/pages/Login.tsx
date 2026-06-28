import { Link } from "react-router-dom";
import { useState } from "react";
import { Lock, Gavel } from "lucide-react";

export default function LoginPage() {
  const [tab, setTab] = useState<"login" | "cadastro">("login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
            <Gavel className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            Leilão<span className="text-primary">Vivo</span>
          </span>
        </Link>

        <div className="rounded-xl border border-border bg-card p-8">
          <div className="mb-6 grid grid-cols-2 rounded-md bg-muted p-1">
            <button
              onClick={() => setTab("login")}
              className={`rounded py-2 text-sm font-medium transition-colors ${
                tab === "login" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setTab("cadastro")}
              className={`rounded py-2 text-sm font-medium transition-colors ${
                tab === "cadastro" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              Cadastrar
            </button>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {tab === "cadastro" && (
              <Field label="Nome completo" type="text" placeholder="Carlos Mendes" />
            )}
            <Field label="E-mail" type="email" placeholder="voce@email.com" />
            <Field label="Senha" type="password" placeholder="••••••••" />
            {tab === "cadastro" && (
              <Field label="Confirmar senha" type="password" placeholder="••••••••" />
            )}

            <button
              type="submit"
              className="mt-2 h-11 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {tab === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <div className="mt-6 flex items-start gap-2 rounded-md border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>Sua carteira é criada automaticamente ao se cadastrar.</span>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ao continuar, você aceita os Termos de Uso e a Política de Privacidade.
        </p>
      </div>
    </div>
  );
}

function Field({ label, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      <input
        {...rest}
        className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}
