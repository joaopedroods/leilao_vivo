import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Bell, Trophy, ArrowUp } from "lucide-react";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function NotificacoesPage() {
  const [notifs, setNotifs] = useState<any[]>([]); 

  useEffect(() => {
    const socket = io(API_URL, {
      path: "/api/notificacoes/socket.io", 
    });

    socket.on("connect", () => {
      console.log("[Notificações] WebSocket Conectado! ID:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("[Notificações] Erro de conexão detalhado:", err.message);
    });

    socket.on("nova_notificacao", (novaNotificacao) => {
      setNotifs((prevNotifs) => [
        {
          id: novaNotificacao.id || Date.now().toString(),
          icon: novaNotificacao.tipo || "bell",
          text: novaNotificacao.mensagem,
          time: "Agora",
          read: false,
        },
        ...prevNotifs,
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const hasUnread = notifs.some((n) => !n.read);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Notificações</h1>
            <p className="mt-1 text-sm text-muted-foreground">Acompanhe seus leilões e atividades.</p>
          </div>
          {hasUnread && (
            <button 
              className="text-sm font-medium text-primary hover:underline"
              onClick={() => setNotifs(notifs.map(n => ({ ...n, read: true })))}
            >
              Marcar todas como lidas
            </button>
          )}
        </div>

        <ul className="mt-8 space-y-3">
          {notifs.map((n) => (
            <li
              key={n.id}
              className={`flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4 ${
                !n.read ? "border-l-2 border-l-primary bg-primary-soft/30" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <NotifIcon icon={n.icon} />
                <p className="text-sm text-foreground">{n.text}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{n.time}</span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

function NotifIcon({ icon }: { icon: string }) {
  const map = {
    trophy: { Icon: Trophy, cls: "bg-success-soft text-success" },
    outbid: { Icon: ArrowUp, cls: "bg-danger-soft text-danger" },
    bell: { Icon: Bell, cls: "bg-primary-soft text-primary" },
  } as const;

  const { Icon, cls } = map[icon as keyof typeof map] ?? map.bell;
  
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${cls}`}>
      <Icon className="h-4 w-4" />
    </div>
  );
}