import { Navbar } from "@/components/navbar";
import { extrato, formatBRL } from "@/lib/mock-data";
import { ArrowDownToLine, ArrowUpFromLine, Info } from "lucide-react";

export default function CarteiraPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Contas & Carteira</h1>
        <p className="mt-1 text-sm text-muted-foreground">Acompanhe seu saldo e movimentações.</p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCard label="Saldo disponível" value="R$ 1.240,00" tone="success" />
          <MetricCard
            label="Saldo bloqueado"
            value="R$ 580,00"
            tone="warning"
            tooltip="Valor reservado em leilões ativos"
          />
          <MetricCard label="Total na carteira" value="R$ 1.820,00" tone="primary" />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button className="inline-flex h-11 items-center gap-2 rounded-md border border-primary bg-card px-5 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft">
            <ArrowDownToLine className="h-4 w-4" />
            Depositar
          </button>
          <button className="inline-flex h-11 items-center gap-2 rounded-md border border-border bg-card px-5 text-sm font-semibold text-foreground transition-colors hover:bg-accent">
            <ArrowUpFromLine className="h-4 w-4" />
            Sacar
          </button>
        </div>

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Extrato</h2>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-5 py-3 font-medium">Descrição</th>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {extrato.map((e, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{e.data}</td>
                    <td className="px-5 py-4 text-foreground">{e.desc}</td>
                    <td className="px-5 py-4">
                      <TipoBadge tipo={e.tipo} />
                    </td>
                    <td
                      className={`px-5 py-4 text-right font-semibold tabular-nums ${
                        e.valor >= 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {e.valor >= 0 ? "+" : "−"}
                      {formatBRL(Math.abs(e.valor)).replace("R$\u00a0", "R$ ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
  tooltip,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "primary";
  tooltip?: string;
}) {
  const toneClasses = {
    success: "text-success",
    warning: "text-warning-foreground",
    primary: "text-primary",
  }[tone];
  const dotClasses = {
    success: "bg-success",
    warning: "bg-warning",
    primary: "bg-primary",
  }[tone];

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dotClasses}`} />
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {tooltip && (
          <span title={tooltip} className="text-muted-foreground">
            <Info className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className={`mt-3 text-3xl font-bold ${toneClasses}`}>{value}</div>
    </div>
  );
}

function TipoBadge({ tipo }: { tipo: string }) {
  const map: Record<string, string> = {
    Depósito: "bg-success-soft text-success",
    Débito: "bg-danger-soft text-danger",
    Bloqueio: "bg-warning-soft text-warning-foreground",
    Estorno: "bg-teal-soft text-teal",
  };
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
        map[tipo] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {tipo}
    </span>
  );
}
