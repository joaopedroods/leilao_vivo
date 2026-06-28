import { Link, useLoaderData } from "react-router-dom";
import { Navbar } from "@/components/navbar";
import { bidHistory, formatBRL } from "@/lib/mock-data";
import { useCountdown } from "./Home";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";

export default function AuctionPage() {
  const { auction } = useLoaderData() as any;
  const remaining = useCountdown(auction.endsAt);
  const totalDuration = 15 * 60 * 1000;
  const progress = Math.min(100, Math.max(0, (remaining.totalMs / totalDuration) * 100));
  const isUrgent = remaining.totalMs < 5 * 60 * 1000;

  const minBid = auction.currentBid + 10;
  const [bid, setBid] = useState<string>(String(minBid));

  // sync placeholder when auction changes
  useEffect(() => setBid(String(minBid)), [minBid]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar para leilões
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left column */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="flex aspect-[4/3] items-center justify-center bg-muted text-sm text-muted-foreground">
                Imagem do item
              </div>
            </div>

            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground">
              {auction.title}
            </h1>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-soft text-xs font-semibold text-teal">
                {auction.seller
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <span className="text-sm text-muted-foreground">
                Vendido por <span className="font-medium text-foreground">{auction.seller}</span>
              </span>
            </div>

            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {auction.description}
            </p>
          </div>

          {/* Right column */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Lance atual
                </div>
                <div className="mt-1 text-4xl font-bold text-primary">
                  {formatBRL(auction.currentBid)}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Seu lance deve ser maior que {formatBRL(auction.currentBid)}
                </p>

                <div className="mt-6">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Tempo restante
                    </span>
                    <span
                      className={`font-mono text-2xl font-bold tabular-nums ${
                        isUrgent ? "text-danger" : "text-foreground"
                      }`}
                    >
                      {remaining.label}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        isUrgent ? "bg-danger" : "bg-primary"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Seu lance (R$)
                  </label>
                  <input
                    type="number"
                    value={bid}
                    onChange={(e) => setBid(e.target.value)}
                    placeholder={String(minBid)}
                    className="h-11 w-full rounded-md border border-border bg-background px-3 text-base font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <button className="mt-3 h-12 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                  Dar lance
                </button>

                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Saldo disponível: <span className="font-medium text-foreground">R$ 660,00</span> ·
                  Saldo bloqueado: <span className="font-medium text-foreground">R$ 0,00</span>
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* Bid history */}
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Histórico de lances</h2>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <ul className="divide-y divide-border">
              {bidHistory.map((b, i) => (
                <li
                  key={i}
                  className={`flex items-center justify-between px-5 py-4 ${
                    b.latest ? "border-l-2 border-l-primary bg-primary-soft/30" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {b.user
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{b.user}</span>
                        {b.outbid && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                            Superado
                          </span>
                        )}
                        {b.latest && (
                          <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                            Maior lance
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{b.ago}</div>
                    </div>
                  </div>
                  <div className={`font-semibold ${b.latest ? "text-primary" : "text-foreground"}`}>
                    {formatBRL(b.value)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
