import { Link, useParams } from "react-router-dom";
import { Navbar } from "@/components/navbar";
import { formatBRL } from "@/lib/mock-data";
import { getAuction } from "@/lib/api/leiloes";
import { useCountdown } from "./Home";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:3001";

export default function AuctionPage() {
  const { id } = useParams()
  const [auction, setAuction] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [bid, setBid] = useState<string>('0')
  const [lances, setLances] = useState<any[]>([])
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro', msg: string } | null>(null)
  const socketRef = useRef<Socket | null>(null)

  // Busca dados iniciais
  useEffect(() => {
    getAuction(id!)
      .then(data => {
        setAuction(data)
        setLances(data.lances || [])
        setBid(String(parseFloat(data.lance_atual) + 10))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  // Conecta WebSocket
  useEffect(() => {
    if (!id) return
    const token = localStorage.getItem('leilaovivo_token')
    if (!token) return

    const socket = io(WS_URL, { auth: { token } })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('entrar_leilao', id)
    })

    socket.on('estado_atual', (estado: any) => {
      setAuction((prev: any) => prev ? {
        ...prev,
        lance_atual: String(estado.lanceAtual),
        vencedor_id: estado.vencedorId,
        status: estado.status,
      } : prev)
    })

    socket.on('lance_aceito', (dados: any) => {
      setAuction((prev: any) => prev ? {
        ...prev,
        lance_atual: String(dados.valor),
        vencedor_id: dados.usuarioId,
      } : prev)
      setBid(String(dados.valor + 10))
      setLances(prev => [{
        usuario_id: dados.usuarioId,
        valor: String(dados.valor),
        criado_em: dados.timestamp,
      }, ...prev])
    })

    socket.on('lance_rejeitado', (dados: any) => {
      const msgs: Record<string, string> = {
        valor_insuficiente: 'Seu lance deve ser maior que o lance atual.',
        saldo_insuficiente: 'Saldo insuficiente na carteira.',
        leilao_encerrado: 'Este leilão já foi encerrado.',
        race_condition: 'Outro lance foi aceito antes. Tente novamente.',
      }
      setFeedback({ tipo: 'erro', msg: msgs[dados.motivo] || 'Lance rejeitado.' })
      setTimeout(() => setFeedback(null), 4000)
    })

    socket.on('leilao_encerrado', (dados: any) => {
      setAuction((prev: any) => prev ? { ...prev, status: 'encerrado' } : prev)
      setFeedback({ tipo: 'sucesso', msg: `Leilão encerrado! Vencedor com R$ ${dados.valorFinal}` })
    })

    socket.on('erro', (dados: any) => {
      setFeedback({ tipo: 'erro', msg: dados.mensagem || 'Erro desconhecido.' })
      setTimeout(() => setFeedback(null), 4000)
    })

    return () => { socket.disconnect() }
  }, [id])

  const darLance = () => {
    const valor = parseFloat(bid)
    if (!socketRef.current || isNaN(valor)) return
    socketRef.current.emit('dar_lance', { leilaoId: id, valor })
  }

  const endsAt = auction ? new Date(auction.encerra_em).getTime() : 0
  const remaining = useCountdown(endsAt)
  const totalDuration = 15 * 60 * 1000
  const progress = Math.min(100, Math.max(0, (remaining.totalMs / totalDuration) * 100))
  const isUrgent = remaining.totalMs < 5 * 60 * 1000 && remaining.totalMs > 0
  const encerrado = auction?.status !== 'ativo' || remaining.totalMs === 0

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <p className="p-8 text-muted-foreground">Carregando...</p>
    </div>
  )

  if (!auction) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <p className="p-8 text-muted-foreground">Leilão não encontrado.</p>
    </div>
  )

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

        {feedback && (
          <div className={`mb-4 rounded-md px-4 py-3 text-sm font-medium ${
            feedback.tipo === 'sucesso'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {feedback.msg}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="flex aspect-[4/3] items-center justify-center bg-muted text-sm text-muted-foreground">
                Imagem do item
              </div>
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground">
              {auction.titulo}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {auction.descricao}
            </p>
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Lance atual
                </div>
                <div className="mt-1 text-4xl font-bold text-primary">
                  {formatBRL(parseFloat(auction.lance_atual))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Seu lance deve ser maior que {formatBRL(parseFloat(auction.lance_atual))}
                </p>

                <div className="mt-6">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Tempo restante
                    </span>
                    <span className={`font-mono text-2xl font-bold tabular-nums ${isUrgent ? "text-red-500" : "text-foreground"}`}>
                      {encerrado ? 'Encerrado' : remaining.label}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full transition-all duration-1000 ${isUrgent ? "bg-red-500" : "bg-primary"}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {!encerrado && (
                  <>
                    <div className="mt-6">
                      <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Seu lance (R$)
                      </label>
                      <input
                        type="number"
                        value={bid}
                        onChange={(e) => setBid(e.target.value)}
                        className="h-11 w-full rounded-md border border-border bg-background px-3 text-base font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <button
                      onClick={darLance}
                      className="mt-3 h-12 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Dar lance
                    </button>
                  </>
                )}

                {encerrado && (
                  <div className="mt-6 rounded-md bg-muted px-4 py-3 text-center text-sm text-muted-foreground">
                    Este leilão foi encerrado.
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Histórico de lances</h2>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <ul className="divide-y divide-border">
              {lances.map((b: any, i: number) => (
                <li key={i} className={`flex items-center justify-between px-5 py-4 ${i === 0 ? 'border-l-2 border-l-primary' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {b.usuario_id.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(b.criado_em).toLocaleTimeString('pt-BR')}
                    </div>
                  </div>
                  <div className={`font-semibold ${i === 0 ? 'text-primary' : 'text-foreground'}`}>
                    {formatBRL(parseFloat(b.valor))}
                  </div>
                </li>
              ))}
              {lances.length === 0 && (
                <li className="px-5 py-6 text-center text-sm text-muted-foreground">
                  Nenhum lance ainda. Seja o primeiro!
                </li>
              )}
            </ul>
          </div>
        </section>
      </main>
    </div>
  )
}