import { Link } from "react-router-dom";
import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { myAuctions, formatBRL } from "@/lib/mock-data";
import { Upload } from "lucide-react";

export default function VenderPage() {
  const [tab, setTab] = useState<"meus" | "criar">("meus");
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Painel do vendedor</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gerencie seus leilões e publique novos itens.</p>

        <div className="mt-8 inline-flex rounded-md border border-border bg-card p-1">
          <TabBtn active={tab === "meus"} onClick={() => setTab("meus")}>Meus Leilões</TabBtn>
          <TabBtn active={tab === "criar"} onClick={() => setTab("criar")}>Criar Leilão</TabBtn>
        </div>

        {tab === "meus" ? <MeusLeiloes /> : <CriarLeilao />}
      </main>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function MeusLeiloes() {
  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
      <ul className="divide-y divide-border">
        {myAuctions.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-md bg-muted" />
              <div>
                <div className="font-medium text-foreground">{a.title}</div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                      a.status === "Ativo" ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {a.status}
                  </span>
                  <span>Tempo restante: {a.remaining}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Lance atual</div>
                <div className="font-semibold text-primary">{formatBRL(a.bid)}</div>
              </div>
              <Link
                to={`/leilao/${a.id}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Ver detalhes
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CriarLeilao() {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="mt-6 grid grid-cols-1 gap-5 rounded-lg border border-border bg-card p-6"
    >
      <Field label="Nome do item" placeholder="Ex: iPhone 15 Pro 256GB" />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Descrição</label>
        <textarea
          rows={4}
          placeholder="Descreva o item, estado de conservação, acessórios..."
          className="w-full rounded-md border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Foto do item</label>
        <div className="flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/30 px-6 py-10 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Upload className="h-5 w-5" />
          </div>
          <div className="text-sm font-medium text-foreground">Arraste uma imagem ou clique para enviar</div>
          <div className="text-xs text-muted-foreground">PNG ou JPG até 5MB</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Lance mínimo (R$)" type="number" placeholder="100" />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Duração</label>
          <select className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option>15 minutos</option>
            <option>30 minutos</option>
            <option>1 hora</option>
            <option>6 horas</option>
            <option>24 horas</option>
          </select>
        </div>
      </div>

      <button className="mt-2 h-11 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto sm:self-start sm:px-8">
        Publicar Leilão
      </button>
    </form>
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
