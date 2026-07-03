import { Link, NavLink as RouterNavLink, useNavigate } from "react-router-dom";
import { Bell, Wallet, Gavel, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { getExtrato } from "@/lib/api/contas";

export function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [saldo, setSaldo] = useState<number>(0);
  const navigate = useNavigate();

  const carregarSaldo = () => {
    getExtrato()
      .then((data) => {
        const lista = data.transacoes || (Array.isArray(data) ? data : []);
        
        // Lendo diretamente o campo saldoDisponivel enviado pela API
        let calcDisponivel = Number(data.saldoDisponivel || 0);
        
        // Fallback de segurança se o Node.js não enviar o campo
        if (calcDisponivel === 0 && lista.length > 0) {
          lista.forEach((t: any) => {
            const valor = Number(t.valor || t.amount || 0);
            const tipo = String(t.tipo || '').toUpperCase();
            if (tipo === 'DEPOSITO' || tipo === 'ESTORNO') calcDisponivel += valor;
            else if (tipo === 'BLOQUEIO' || tipo === 'DEBITO' || tipo === 'SAQUE') calcDisponivel -= valor;
          });
        }
        setSaldo(calcDisponivel);
      })
      .catch((err) => console.error("Erro ao buscar saldo", err));
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("leilaovivo_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      carregarSaldo();
    }

    // Ouve o evento disparado pela página de Carteira para atualizar o saldo instantaneamente
    window.addEventListener("atualizarCarteira", carregarSaldo);
    
    // Limpa o listener ao desmontar o componente para evitar vazamento de memória
    return () => window.removeEventListener("atualizarCarteira", carregarSaldo);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("leilaovivo_token");
    localStorage.removeItem("leilaovivo_user");
    setUser(null);
    navigate("/login");
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Gavel className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-semibold tracking-tight text-foreground">
            Leilão<span className="text-primary">Vivo</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/">Leilões</NavLink>
          <NavLink to="/vender">Vender</NavLink>
          <NavLink to="/carteira">Carteira</NavLink>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/carteira"
                className="hidden items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent sm:flex"
              >
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Minha Carteira</span>
                <span className="font-semibold text-foreground">{formatBRL(saldo)}</span>
              </Link>
              
              <Link
                to="/notificacoes"
                className="relative flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-accent"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-danger-foreground">
                  0
                </span>
              </Link>
              
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary"
                title={user.nome}
              >
                {getInitials(user.nome)}
              </div>

              <button 
                onClick={handleLogout}
                className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-red-500 transition-colors"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link 
              to="/login"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Fazer Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <RouterNavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        isActive
          ? "rounded-md px-3 py-2 text-sm font-medium text-primary bg-primary-soft"
          : "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      }
    >
      {children}
    </RouterNavLink>
  );
}