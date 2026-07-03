import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Navbar } from "@/components/navbar";
// Importamos apenas o tipo Auction e o formatador de moeda do mock-data
import { formatBRL, type Auction } from "@/lib/mock-data"; 
// Importamos o nosso novo serviço que se comunica com o backend
import { getAuctions } from "@/lib/api/leiloes"; 

const TABS = ["Todos", "Ativos", "Encerrados"] as const;

export default function HomePage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Todos");
  const [q, setQ] = useState("");

  // 1. Novos estados para gerenciar os dados da API real
  const [realAuctions, setRealAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2. Efeito para buscar os dados no Node.js via API Gateway quando a página monta
  useEffect(() => {
    getAuctions()
      .then((data) => {
        setRealAuctions(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Não foi possível conectar ao serviço de leilões.");
        setIsLoading(false);
      });
  }, []);

  // 3. O filtro agora observa 'realAuctions' em vez da constante mockada
  const filtered = useMemo(() => {
    return realAuctions.filter((a) => {
      if (tab === "Ativos" && a.status !== "ativo") return false;
      if (tab === "Encerrados" && a.status !== "encerrado") return false;
      if (q && !a.title.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [tab, q, realAuctions]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Leilões</h1>
          <p className="text-sm text-muted-foreground">
            Descubra produtos exclusivos e dê lances em tempo real.
          </p>
        </div>

        <div className="mb-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-md border border-border bg-card p-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
                  tab === t
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar item..."
              className="h-10 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* 4. Tratamento visual de Carregamento e Erro */}
        {isLoading && (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Buscando leilões ao vivo no servidor...
          </div>
        )}

        {error && (
          <div className="flex h-40 items-center justify-center text-sm text-red-500">
            {error}
          </div>
        )}

        {/* 5. Renderização da lista real */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.length === 0 ? (
              <div className="col-span-full flex h-40 items-center justify-center text-sm text-muted-foreground">
                Nenhum leilão encontrado.
              </div>
            ) : (
              filtered.map((a) => (
                <AuctionCard key={a.id} auction={a} />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// 6. Atualizamos a tipagem do parâmetro auction para usar o type limpo
function AuctionCard({ auction }: { auction: Auction }) {
  const remaining = useCountdown(auction.endsAt);
  const isEnded = auction.status === "encerrado" || remaining.totalMs <= 0;
  const isUrgent = !isEnded && remaining.totalMs < 5 * 60 * 1000;

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-sm">
      <div className="relative aspect-[4/3] w-full bg-muted">
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          Imagem do item
        </div>
        {isEnded && (
          <span className="absolute right-3 top-3 rounded-md bg-muted-foreground/10 px-2 py-1 text-xs font-medium text-muted-foreground">
            Encerrado
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold text-foreground">{auction.title}</h3>
        <div className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">Lance atual</div>
        <div className="text-xl font-bold text-primary">{formatBRL(auction.currentBid)}</div>

        <div className="mt-3 text-sm font-medium">
          {isEnded ? (
            <span className="text-muted-foreground">Leilão finalizado</span>
          ) : (
            <span className={isUrgent ? "text-red-500" : "text-green-600"}>
              {remaining.label} restantes
            </span>
          )}
        </div>

        <Link
          to={`/leilao/${auction.id}`}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Ver leilão
        </Link>
      </div>
    </article>
  );
}

export function useCountdown(endsAt: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const totalMs = Math.max(0, endsAt - now);
  const s = Math.floor(totalMs / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const label = h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
  return { totalMs, label, h, m, s: sec };
}