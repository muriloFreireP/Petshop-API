const express = require('express');
const { query } = require('./db');

/**
 * Cria as 5 rotas REST de uma entidade:
 *   GET    /        -> lista
 *   GET    /:id     -> busca um
 *   POST   /        -> cria
 *   PUT    /:id     -> atualiza (campos enviados)
 *   DELETE /:id     -> remove
 *
 * cfg.table    nome da tabela
 * cfg.fields   colunas que podem ser gravadas (lista segura: evita SQL injection nos nomes)
 * cfg.required colunas obrigatórias na criação
 * cfg.select   SELECT base (use para fazer JOIN); o alias da tabela principal é cfg.alias
 */
function crud({ table, alias = 't', fields, required = [], select, orderBy }) {
  const router = express.Router();
  const base = select || `SELECT ${alias}.* FROM ${table} ${alias}`;
  const ordem = orderBy || `${alias}.id`;

  const filtrar = (body = {}) => {
    const dados = {};
    for (const campo of fields) {
      if (body[campo] !== undefined) dados[campo] = body[campo] === '' ? null : body[campo];
    }
    return dados;
  };

  const buscar = async (id) => {
    const { rows } = await query(`${base} WHERE ${alias}.id = $1`, [id]);
    return rows[0];
  };

  router.param('id', (req, res, next, id) => {
    if (!/^\d+$/.test(id)) return res.status(400).json({ erro: 'O id deve ser um número inteiro.' });
    next();
  });

  router.get('/', async (req, res, next) => {
    try {
      const { rows } = await query(`${base} ORDER BY ${ordem}`);
      res.json(rows);
    } catch (e) { next(e); }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const item = await buscar(req.params.id);
      if (!item) return res.status(404).json({ erro: 'Registro não encontrado.' });
      res.json(item);
    } catch (e) { next(e); }
  });

  router.post('/', async (req, res, next) => {
    try {
      const dados = filtrar(req.body);
      const faltando = required.filter((c) => dados[c] === undefined || dados[c] === null);
      if (faltando.length) {
        return res.status(400).json({ erro: `Campos obrigatórios: ${faltando.join(', ')}.` });
      }
      const colunas = Object.keys(dados);
      const marcadores = colunas.map((_, i) => `$${i + 1}`);
      const { rows } = await query(
        `INSERT INTO ${table} (${colunas.join(', ')}) VALUES (${marcadores.join(', ')}) RETURNING id`,
        Object.values(dados)
      );
      res.status(201).json(await buscar(rows[0].id));
    } catch (e) { next(e); }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const dados = filtrar(req.body);
      const colunas = Object.keys(dados);
      if (!colunas.length) return res.status(400).json({ erro: 'Nenhum campo válido enviado.' });
      const nulos = required.filter((c) => dados[c] === null);
      if (nulos.length) {
        return res.status(400).json({ erro: `Campos obrigatórios: ${nulos.join(', ')}.` });
      }
      const sets = colunas.map((c, i) => `${c} = $${i + 1}`);
      const { rows } = await query(
        `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${colunas.length + 1} RETURNING id`,
        [...Object.values(dados), req.params.id]
      );
      if (!rows.length) return res.status(404).json({ erro: 'Registro não encontrado.' });
      res.json(await buscar(rows[0].id));
    } catch (e) { next(e); }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const { rows } = await query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [req.params.id]);
      if (!rows.length) return res.status(404).json({ erro: 'Registro não encontrado.' });
      res.status(204).end();
    } catch (e) { next(e); }
  });

  return router;
}

module.exports = crud;
