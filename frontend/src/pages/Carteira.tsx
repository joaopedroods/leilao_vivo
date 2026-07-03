import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { formatBRL } from "@/lib/mock-data";
import { ArrowDownToLine, ArrowUpFromLine, Info, X } from "lucide-react";
import { getExtrato, efetuarDeposito, efetuarSaque } from "@/lib/api/contas";

export default function CarteiraPage() {
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [saldos, setSaldos] = useState({ disponivel: 0, bloqueado: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  // Estados para controlar o Modal de Depósito
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositValue, setDepositValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const carregarCarteira = async () => {
    try {
      const data = await getExtrato();
      
      // Pega a lista de transações com a chave exata que a API enviou
      const lista = data.transacoes || (Array.isArray(data) ? data : []);
      setTransacoes(lista);
      
      // Lê diretamente os saldos exatos calculados pelo Node.js
      let calcDisponivel = Number(data.saldoDisponivel || 0);
      let calcBloqueado = Number(data.saldoBloqueado || 0);
      
      // Fallback de segurança: Se o backend falhar em enviar o saldo, calculamos lendo o extrato
      if (calcDisponivel === 0 && lista.length > 0) {
        lista.forEach((t: any) => {
          const valor = Number(t.valor || t.amount || 0);
          const tipo = String(t.tipo || '').toUpperCase();
          
          if (tipo === 'DEPOSITO' || tipo === 'ESTORNO') {
            calcDisponivel += valor;
          } else if (tipo === 'BLOQUEIO') {
            calcDisponivel -= valor;
            calcBloqueado += valor;
          } else if (tipo === 'DEBITO' || tipo === 'SAQUE') {
            calcDisponivel -= valor;
          }
        });
      }
      
      setSaldos({
        disponivel: calcDisponivel,
        bloqueado: calcBloqueado,
        total: calcDisponivel + calcBloqueado
      });
    } catch (error) {
      console.error("Erro ao carregar carteira:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarCarteira();
  }, []);

  const handleDepositar = async (e: React.FormEvent) => {
    e.preventDefault();
    const valorNum = Number(depositValue);
    if (!valorNum || valorNum <= 0) return alert("Digite um valor válido.");

    setIsProcessing(true);
    try {
      await efetuarDeposito(valorNum);
      alert(`Depósito de ${formatBRL(valorNum)} realizado com sucesso!`);
      setIsDepositModalOpen(false);
      setDepositValue("");
      
      // Recarrega a tela para atualizar o saldo na página
      carregarCarteira(); 
      
      // Dispara o evento global para a Navbar atualizar o saldo lá em cima também!
      window.dispatchEvent(new Event("atualizarCarteira"));
    } catch (error: any) {
      alert(error.message || "Falha ao depositar");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatarData = (dataStr: string) => {
    if (!dataStr) return "--/-- --:--";
    const d = new Date(dataStr);
    if (isNaN(d.getTime())) return "--/-- --:--"; 
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Contas & Carteira</h1>
        <p className="mt-1 text-sm text-muted-foreground">Acompanhe seu saldo e movimentações.</p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCard label="Saldo disponível" value={formatBRL(saldos.disponivel)} tone="success" />
          <MetricCard
            label="Saldo bloqueado"
            value={formatBRL(saldos.bloqueado)}
            tone="warning"
            tooltip="Valor reservado em leilões ativos"
          />
          <MetricCard label="Total na carteira" value={formatBRL(saldos.total)} tone="primary" />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button 
            onClick={() => setIsDepositModalOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-primary bg-card px-5 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft"
          >
            <ArrowDownToLine className="h-4 w-4" />
            Depositar
          </button>
          <button 
            onClick={async () => {
              const valor = Number(window.prompt("Digite o valor para sacar (Tente quebrar o sistema!):"));
              if (!valor || valor <= 0) return;
              
              try {
                await efetuarSaque(valor);
                alert("Saque realizado com sucesso!");
                carregarCarteira();
                window.dispatchEvent(new Event("atualizarCarteira"));
              } catch (error: any) {
                // Captura e exibe o erro retornado pela trava do Postgres
                alert("Operação bloqueada: " + error.message);
              }
            }}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-border bg-card px-5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
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
                {loading ? (
                  <tr><td colSpan={4} className="p-5 text-center text-muted-foreground">Carregando carteira...</td></tr>
                ) : transacoes.length === 0 ? (
                  <tr><td colSpan={4} className="p-5 text-center text-muted-foreground">Nenhuma movimentação encontrada.</td></tr>
                ) : (
                  transacoes.map((e, i) => {
                    const valorNum = Number(e.valor || 0);
                    const tipoUpper = String(e.tipo || '').toUpperCase();
                    
                    // Identifica se a operação remove dinheiro da carteira
                    const isNegativo = ['SAQUE', 'DEBITO', 'BLOQUEIO', 'LANCE'].includes(tipoUpper);
                    
                    return (
                      <tr key={i}>
                        <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                          {formatarData(e.criadoEm || e.data)}
                        </td>
                        <td className="px-5 py-4 text-foreground">{e.descricao || "Movimentação"}</td>
                        <td className="px-5 py-4">
                          <TipoBadge tipo={e.tipo} />
                        </td>
                        <td
                          className={`px-5 py-4 text-right font-semibold tabular-nums ${
                            isNegativo ? "text-danger" : "text-success"
                          }`}
                        >
                          {isNegativo ? "−" : "+"}
                          {formatBRL(Math.abs(valorNum)).replace("R$\u00a0", "R$ ")}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* MODAL DE DEPÓSITO */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Depositar fundos</h3>
              <button 
                onClick={() => setIsDepositModalOpen(false)}
                className="rounded-md p-1 hover:bg-muted text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleDepositar}>
              <label className="block mb-4">
                <span className="mb-1 block text-sm font-medium text-foreground">Valor (R$)</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={depositValue}
                  onChange={(e) => setDepositValue(e.target.value)}
                  placeholder="Ex: 500.00"
                  className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={isProcessing}
                className="h-11 w-full rounded-md bg-primary font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isProcessing ? "Processando..." : "Confirmar Depósito"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, tone, tooltip }: { label: string; value: string; tone: "success" | "warning" | "primary"; tooltip?: string; }) {
  const toneClasses = { success: "text-success", warning: "text-warning-foreground", primary: "text-primary" }[tone];
  const dotClasses = { success: "bg-success", warning: "bg-warning", primary: "bg-primary" }[tone];

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dotClasses}`} />
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
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
  const upperTipo = String(tipo || '').toUpperCase();
  const map: Record<string, string> = {
    "DEPOSITO": "bg-success-soft text-success",
    "SAQUE": "bg-danger-soft text-danger",
    "DEBITO": "bg-danger-soft text-danger",
    "LANCE": "bg-danger-soft text-danger",
    "BLOQUEIO": "bg-warning-soft text-warning-foreground",
    "ESTORNO": "bg-teal-soft text-teal",
  };
  
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${map[upperTipo] ?? "bg-muted text-muted-foreground"}`}>
      {tipo || 'Transação'}
    </span>
  );
}