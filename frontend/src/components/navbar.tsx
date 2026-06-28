import { Link, NavLink as RouterNavLink } from "react-router-dom";
import { Bell, Wallet, Gavel } from "lucide-react";

export function Navbar() {
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

        <div className="flex items-center gap-2">
          <Link
            to="/carteira"
            className="hidden items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent sm:flex"
          >
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Minha Carteira</span>
            <span className="font-semibold text-foreground">R$ 1.240,00</span>
          </Link>
          <Link
            to="/notificacoes"
            className="relative flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-accent"
            aria-label="Notificações"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-danger-foreground">
              3
            </span>
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
            CM
          </div>
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
