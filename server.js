// Servidor para rodar localmente: npm run dev
const app = require('./src/app');
const porta = process.env.PORT || 3000;
app.listen(porta, () => console.log(`Petshop rodando em http://localhost:${porta}`));
