const { Pool, types } = require('pg');

// Devolve colunas DATE como texto ("2024-05-10") em vez de objeto Date,
// para evitar problemas de fuso horário.
types.setTypeParser(1082, (valor) => valor);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // vem do .env (local) ou da Vercel (produção)
  max: 5,
});

const query = (texto, params) => pool.query(texto, params);

module.exports = { query };
