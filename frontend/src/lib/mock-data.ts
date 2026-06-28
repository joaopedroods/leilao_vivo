export type Auction = {
  id: string;
  title: string;
  currentBid: number;
  endsAt: number; // ms timestamp
  status: "ativo" | "encerrado";
  seller: string;
  description: string;
};

const now = Date.now();

export const auctions: Auction[] = [
  {
    id: "1",
    title: "Tênis Air Jordan 1 Retro",
    currentBid: 580,
    endsAt: now + 8 * 60 * 1000 + 47 * 1000,
    status: "ativo",
    seller: "Marina Costa",
    description:
      "Tênis Air Jordan 1 Retro High em ótimo estado de conservação, tamanho 42. Original, com caixa e nota fiscal. Usado poucas vezes, sem marcas visíveis.",
  },
  {
    id: "2",
    title: "PlayStation 5 + 2 Controles",
    currentBid: 1200,
    endsAt: now + 3 * 60 * 1000,
    status: "ativo",
    seller: "Lucas Almeida",
    description: "PS5 versão com leitor, 2 controles DualSense e 3 jogos.",
  },
  {
    id: "3",
    title: "MacBook Pro 14\" M2",
    currentBid: 8400,
    endsAt: now + 4 * 60 * 60 * 1000,
    status: "ativo",
    seller: "Rafael Mendes",
    description: "MacBook Pro 14 polegadas, chip M2, 16GB RAM, 512GB SSD.",
  },
  {
    id: "4",
    title: "iPhone 15 Pro 256GB",
    currentBid: 3100,
    endsAt: now + 2 * 60 * 1000 + 15 * 1000,
    status: "ativo",
    seller: "Camila Souza",
    description: "iPhone 15 Pro titânio natural, 256GB, lacrado.",
  },
  {
    id: "5",
    title: "Câmera Canon EOS R6",
    currentBid: 340,
    endsAt: now + 22 * 60 * 60 * 1000,
    status: "ativo",
    seller: "Pedro Henrique",
    description: "Câmera mirrorless full-frame, com lente kit 24-105mm.",
  },
  {
    id: "6",
    title: "Bicicleta Caloi Elite",
    currentBid: 920,
    endsAt: now - 60 * 60 * 1000,
    status: "encerrado",
    seller: "Juliana Ribeiro",
    description: "Mountain bike aro 29, quadro alumínio.",
  },
];

export const bidHistory = [
  { user: "Carlos M.", value: 580, ago: "há 23 segundos", latest: true },
  { user: "Beatriz L.", value: 560, ago: "há 1 minuto", outbid: true },
  { user: "Diego R.", value: 540, ago: "há 2 minutos" },
  { user: "Fernanda S.", value: 520, ago: "há 4 minutos" },
  { user: "Gabriel T.", value: 500, ago: "há 6 minutos" },
];

export const extrato = [
  { data: "08/06 14:32", desc: "Depósito via PIX", tipo: "Depósito", valor: 500 },
  { data: "08/06 12:10", desc: "Lance bloqueado — Tênis Air Jordan", tipo: "Bloqueio", valor: -350 },
  { data: "07/06 21:48", desc: "Lance superado — Estorno", tipo: "Estorno", valor: 350 },
  { data: "07/06 18:02", desc: "Leilão vencido — Débito final PlayStation 5", tipo: "Débito", valor: -580 },
  { data: "06/06 09:15", desc: "Depósito via PIX", tipo: "Depósito", valor: 1000 },
  { data: "05/06 16:40", desc: "Lance bloqueado — MacBook Pro", tipo: "Bloqueio", valor: -580 },
];

export const myAuctions = [
  { id: "1", title: "Tênis Air Jordan 1 Retro", status: "Ativo", bid: 580, remaining: "08:47" },
  { id: "6", title: "Bicicleta Caloi Elite", status: "Encerrado", bid: 920, remaining: "—" },
  { id: "5", title: "Câmera Canon EOS R6", status: "Ativo", bid: 340, remaining: "22:14:00" },
];

export const notifications = [
  { id: 1, icon: "trophy", text: "Você venceu o leilão de Tênis Air Jordan por R$ 580,00", time: "2h atrás", read: false },
  { id: 2, icon: "outbid", text: "Você foi superado no leilão de PlayStation 5 — lance atual R$ 1.200,00", time: "3h atrás", read: false },
  { id: 3, icon: "bell", text: "O leilão de MacBook Pro que você favoritou começou", time: "5h atrás", read: true },
  { id: 4, icon: "trophy", text: "Você venceu o leilão de Câmera Canon por R$ 340,00", time: "ontem", read: true },
  { id: 5, icon: "outbid", text: "Você foi superado no leilão de iPhone 15 — lance atual R$ 3.100,00", time: "ontem", read: true },
];

export const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
