import type { Auction } from '../mock-data';

const API_URL = import.meta.env.VITE_API_URL;

export const getAuctions = async (): Promise<Auction[]> => {
  try {
    // Mantendo a rota original que o NGINX aceita
    const response = await fetch(`${API_URL}/leiloes/leiloes`);
    
    if (!response.ok) throw new Error(`Erro: ${response.status}`);
    
    const data = await response.json();
    return data.map((item: any): Auction => ({
      id: item.id,
      title: item.titulo,
      currentBid: Number(item.lance_atual) || Number(item.lance_minimo) || 0,
      endsAt: new Date(item.encerra_em).getTime(),
      status: item.status === 'ativo' ? 'ativo' : 'encerrado',
      seller: item.vendedor_id,
      description: item.descricao
    }));
  } catch (error) {
    console.error("Erro ao buscar leilões:", error);
    throw error;
  }
};

// Deixe a função criarLeilao aqui abaixo, mas com a rota compatível com a Home
export const criarLeilao = async (dados: { title: string; description: string; initialBid: number; duracaoMinutos: number; }) => {
  const response = await fetch(`${API_URL}/leiloes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("leilaovivo_token")}` },
    body: JSON.stringify({
      titulo: dados.title,
      descricao: dados.description,
      lance_minimo: dados.initialBid,
      duracao_minutos: dados.duracaoMinutos,
    }),
  });
  if (!response.ok) throw new Error("Erro ao criar leilão");
  return response.json();
};