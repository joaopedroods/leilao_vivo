import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Lock, Gavel, AlertCircle } from "lucide-react";
import { efetuarLogin, efetuarCadastro } from "@/lib/api/contas";

export default function LoginPage() {
  const [tab, setTab] = useState<"login" | "cadastro">("login");
  const navigate = useNavigate();

  // Estados dos inputs do formulário
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  
  // Estados de controle da interface
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (tab === "login") {
        if (!email || !senha) throw new Error("Preencha todos os campos.");
        
        const data = await efetuarLogin(email, senha);
        
        // 1. Salva o Token JWT
        localStorage.setItem("leilaovivo_token", data.token);
        
        // 2. Agora lemos a chave exata que a sua parceira enviou (data.nome e data.userId)
        if (data.nome) {
          localStorage.setItem("leilaovivo_user", JSON.stringify({
            nome: data.nome,
            id: data.userId
          }));
        }
        
        navigate("/");
      } else {
        if (!nome || !email || !senha) throw new Error("Preencha todos os campos.");
        if (senha !== confirmarSenha) throw new Error("As senhas não coincidem.");
        
        await efetuarCadastro(nome, email, senha);
        
        // Cadastro feito com sucesso! Alerta o usuário ou faz login direto.
        alert("Conta criada com sucesso! Faça seu login.");
        setTab("login");
        setSenha("");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  };

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
              type="button"
              disabled={isLoading}
              onClick={() => { setTab("login"); setErrorMessage(null); }}
              className={`rounded py-2 text-sm font-medium transition-colors ${
                tab === "login" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => { setTab("cadastro"); setErrorMessage(null); }}
              className={`rounded py-2 text-sm font-medium transition-colors ${
                tab === "cadastro" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              Cadastrar
            </button>
          </div>

          {/* Banner de erro dinâmico */}
          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-red-500/10 p-3 text-sm text-red-500">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {tab === "cadastro" && (
              <Field 
                label="Nome completo" 
                type="text" 
                placeholder="Carlos Mendes" 
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            )}
            <Field 
              label="E-mail" 
              type="email" 
              placeholder="voce@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Field 
              label="Senha" 
              type="password" 
              placeholder="••••••••" 
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
            {tab === "cadastro" && (
              <Field 
                label="Confirmar senha" 
                type="password" 
                placeholder="••••••••" 
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
              />
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 h-11 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? "Processando..." : tab === "login" ? "Entrar" : "Criar conta"}
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