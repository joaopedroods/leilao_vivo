CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE leiloes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id     UUID NOT NULL,
  titulo          VARCHAR(200) NOT NULL,
  descricao       TEXT,
  lance_minimo    DECIMAL(10,2) NOT NULL,
  lance_atual     DECIMAL(10,2) NOT NULL,
  vencedor_id     UUID,
  status          VARCHAR(20) NOT NULL DEFAULT 'ativo',
  criado_em       TIMESTAMP NOT NULL DEFAULT NOW(),
  encerra_em      TIMESTAMP NOT NULL
);

CREATE TABLE lances (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leilao_id   UUID NOT NULL REFERENCES leiloes(id),
  usuario_id  UUID NOT NULL,
  valor       DECIMAL(10,2) NOT NULL,
  criado_em   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lances_leilao ON lances(leilao_id);
CREATE INDEX idx_leiloes_status ON leiloes(status);