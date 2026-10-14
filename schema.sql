-- Execute este script no SQL Editor do Neon

CREATE TABLE IF NOT EXISTS tutores (
  id          SERIAL PRIMARY KEY,
  nome        TEXT NOT NULL,
  telefone    TEXT,
  email       TEXT UNIQUE,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pets (
  id               SERIAL PRIMARY KEY,
  nome             TEXT NOT NULL,
  especie          TEXT NOT NULL,
  raca             TEXT,
  data_nascimento  DATE,
  tutor_id         INTEGER NOT NULL REFERENCES tutores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS servicos (
  id           SERIAL PRIMARY KEY,
  nome         TEXT NOT NULL,
  descricao    TEXT,
  preco        NUMERIC(10,2) NOT NULL CHECK (preco >= 0),
  duracao_min  INTEGER NOT NULL CHECK (duracao_min > 0)
);

CREATE TABLE IF NOT EXISTS agendamentos (
  id           SERIAL PRIMARY KEY,
  pet_id       INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  servico_id   INTEGER NOT NULL REFERENCES servicos(id) ON DELETE RESTRICT,
  data_hora    TIMESTAMPTZ NOT NULL,
  status       TEXT NOT NULL DEFAULT 'agendado'
               CHECK (status IN ('agendado', 'concluido', 'cancelado')),
  observacoes  TEXT
);

-- Dados de exemplo (opcional)
INSERT INTO servicos (nome, descricao, preco, duracao_min) VALUES
  ('Banho', 'Banho com shampoo neutro e secagem', 50.00, 45),
  ('Tosa higiênica', 'Tosa nas áreas de higiene', 40.00, 30),
  ('Banho e tosa completa', 'Banho, tosa na máquina e perfume', 90.00, 90),
  ('Consulta veterinária', 'Avaliação geral de saúde', 120.00, 30);
