import { Navbar } from "@/components/navbar";
import { notifications } from "@/lib/mock-data";
import { Bell, Trophy, ArrowUp } from "lucide-react";

export default function NotificacoesPage() {
  const hasUnread = notifications.some((n) => !n.read);

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
            <button className="text-sm font-medium text-primary hover:underline">
              Marcar todas como lidas
            </button>
          )}
        </div>

        <ul className="mt-8 space-y-3">
          {notifications.map((n) => (
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
