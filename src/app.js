const path = require('path');
const express = require('express');
const crud = require('./crud');
const { query } = require('./db');

const app = express();
app.use(express.json());

// Front-end (usado no ambiente local; na Vercel a pasta public/ já é servida automaticamente)
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', async (req, res, next) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', banco: 'conectado' });
  } catch (e) { next(e); }
});

// Rota aninhada: pets de um tutor
app.get('/api/tutores/:id/pets', async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ erro: 'O id deve ser um número inteiro.' });
    const { rows } = await query('SELECT * FROM pets WHERE tutor_id = $1 ORDER BY nome', [req.params.id]);
    res.json(rows);
  } catch (e) { next(e); }
});

app.use('/api/tutores', crud({
  table: 'tutores',
  fields: ['nome', 'telefone', 'email'],
  required: ['nome'],
  orderBy: 't.nome',
}));

app.use('/api/pets', crud({
  table: 'pets',
  alias: 'p',
  fields: ['nome', 'especie', 'raca', 'data_nascimento', 'tutor_id'],
  required: ['nome', 'especie', 'tutor_id'],
  select: `SELECT p.*, tu.nome AS tutor_nome
           FROM pets p JOIN tutores tu ON tu.id = p.tutor_id`,
  orderBy: 'p.nome',
}));

app.use('/api/servicos', crud({
  table: 'servicos',
  fields: ['nome', 'descricao', 'preco', 'duracao_min'],
  required: ['nome', 'preco', 'duracao_min'],
  orderBy: 't.nome',
}));

app.use('/api/agendamentos', crud({
  table: 'agendamentos',
  alias: 'a',
  fields: ['pet_id', 'servico_id', 'data_hora', 'status', 'observacoes'],
  required: ['pet_id', 'servico_id', 'data_hora'],
  select: `SELECT a.*, p.nome AS pet_nome, tu.nome AS tutor_nome,
                  s.nome AS servico_nome, s.preco AS servico_preco
           FROM agendamentos a
           JOIN pets p      ON p.id  = a.pet_id
           JOIN tutores tu  ON tu.id = p.tutor_id
           JOIN servicos s  ON s.id  = a.servico_id`,
  orderBy: 'a.data_hora',
}));

app.use('/api', (req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

// Tratamento central de erros (converte erros do Postgres em respostas HTTP claras)
app.use((err, req, res, next) => {
  const mapa = {
    '23505': [409, 'Já existe um registro com esse valor único (ex.: e-mail repetido).'],
    '23503': [409, 'Operação bloqueada: há registros relacionados (ou o item relacionado não existe).'],
    '23502': [400, 'Há um campo obrigatório sem valor.'],
    '23514': [400, 'Um dos valores enviados não é válido.'],
    '22P02': [400, 'Formato de dado inválido.'],
    '22007': [400, 'Formato de data inválido.'],
  };
  const [status, erro] = mapa[err.code] || [500, 'Erro interno do servidor.'];
  if (status === 500) console.error(err);
  res.status(status).json({ erro });
});

module.exports = app;
