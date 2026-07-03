const API_URL = import.meta.env.VITE_API_URL; // http://localhost:8080/api

// Função auxiliar para enviar cabeçalhos com o Token JWT do usuário logado
const getAuthHeaders = () => {
  const token = localStorage.getItem("leilaovivo_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const efetuarLogin = async (email: string, senha: string) => {
  // Bate no Gateway /api/contas/, que encaminha para a porta 3002 do microsserviço
  const response = await fetch(`${API_URL}/contas/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.mensagem || "Falha ao autenticar");
  }

  return response.json(); // Espera retornar { token: '...', usuario: {...} }
};

export const efetuarCadastro = async (nome: string, email: string, senha: string) => {
  const response = await fetch(`${API_URL}/contas/auth/cadastro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, email, senha }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.mensagem || "Falha ao criar conta");
  }

  return response.json();
};

export const getExtrato = async () => {
  const response = await fetch(`${API_URL}/contas/carteira/extrato`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) throw new Error("Erro ao carregar extrato");
  return response.json();
};

export const efetuarDeposito = async (valor: number) => {
  const response = await fetch(`${API_URL}/contas/carteira/depositar`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ valor }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.mensagem || "Erro ao processar o depósito");
  }

  return response.json();
};

export const efetuarSaque = async (valor: number) => {
  const response = await fetch(`${API_URL}/contas/carteira/sacar`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ valor }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.mensagem || "Erro ao processar o saque");
  }

  return response.json();
};