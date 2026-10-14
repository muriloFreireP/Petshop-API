/* Front-end do petshop: consome a API REST (/api/...) com fetch. */

const dinheiro = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataBR = (iso) => (iso ? iso.split('-').reverse().join('/') : '—');
const dataHoraBR = (iso) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

// Converte ISO (UTC) -> valor do <input type="datetime-local"> no fuso do navegador
const paraInputLocal = (iso) => {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const STATUS = [
  { valor: 'agendado', rotulo: 'Agendado' },
  { valor: 'concluido', rotulo: 'Concluído' },
  { valor: 'cancelado', rotulo: 'Cancelado' },
];

/* Descrição de cada tela: colunas da tabela e campos do formulário */
const entidades = {
  agendamentos: {
    titulo: 'Agendamentos',
    novo: 'Novo agendamento',
    vazio: ['Nenhum agendamento ainda', 'Cadastre um tutor, um pet e um serviço para agendar o primeiro horário.'],
    colunas: [
      { rotulo: 'Data e hora', valor: (r) => dataHoraBR(r.data_hora) },
      { rotulo: 'Pet', valor: (r) => `${r.pet_nome} (${r.tutor_nome})` },
      { rotulo: 'Serviço', valor: (r) => `${r.servico_nome} — ${dinheiro(r.servico_preco)}` },
      { rotulo: 'Situação', html: (r) => `<span class="etiqueta ${r.status}">${esc(STATUS.find((s) => s.valor === r.status)?.rotulo || r.status)}</span>` },
    ],
    campos: [
      { nome: 'pet_id', rotulo: 'Pet', tipo: 'select', origem: 'pets', numero: true, obrigatorio: true,
        opcao: (p) => `${p.nome} (${p.tutor_nome})` },
      { nome: 'servico_id', rotulo: 'Serviço', tipo: 'select', origem: 'servicos', numero: true, obrigatorio: true,
        opcao: (s) => `${s.nome} — ${dinheiro(s.preco)}` },
      { nome: 'data_hora', rotulo: 'Data e hora', tipo: 'datetime-local', obrigatorio: true },
      { nome: 'status', rotulo: 'Situação', tipo: 'select', fixas: STATUS },
      { nome: 'observacoes', rotulo: 'Observações', tipo: 'textarea' },
    ],
  },
  pets: {
    titulo: 'Pets',
    novo: 'Novo pet',
    vazio: ['Nenhum pet cadastrado', 'Cadastre primeiro o tutor e depois o pet dele.'],
    colunas: [
      { rotulo: 'Nome', valor: (r) => r.nome },
      { rotulo: 'Espécie', valor: (r) => r.especie },
      { rotulo: 'Raça', valor: (r) => r.raca || '—' },
      { rotulo: 'Nascimento', valor: (r) => dataBR(r.data_nascimento) },
      { rotulo: 'Tutor', valor: (r) => r.tutor_nome },
    ],
    campos: [
      { nome: 'nome', rotulo: 'Nome', tipo: 'text', obrigatorio: true },
      { nome: 'especie', rotulo: 'Espécie', tipo: 'select', obrigatorio: true,
        fixas: ['Cachorro', 'Gato', 'Ave', 'Coelho', 'Roedor', 'Outro'].map((e) => ({ valor: e, rotulo: e })) },
      { nome: 'raca', rotulo: 'Raça', tipo: 'text' },
      { nome: 'data_nascimento', rotulo: 'Data de nascimento', tipo: 'date' },
      { nome: 'tutor_id', rotulo: 'Tutor', tipo: 'select', origem: 'tutores', numero: true, obrigatorio: true,
        opcao: (t) => t.nome },
    ],
  },
  tutores: {
    titulo: 'Tutores',
    novo: 'Novo tutor',
    vazio: ['Nenhum tutor cadastrado', 'Comece cadastrando quem cuida dos pets.'],
    colunas: [
      { rotulo: 'Nome', valor: (r) => r.nome },
      { rotulo: 'Telefone', valor: (r) => r.telefone || '—' },
      { rotulo: 'E-mail', valor: (r) => r.email || '—' },
    ],
    campos: [
      { nome: 'nome', rotulo: 'Nome', tipo: 'text', obrigatorio: true },
      { nome: 'telefone', rotulo: 'Telefone', tipo: 'tel' },
      { nome: 'email', rotulo: 'E-mail', tipo: 'email' },
    ],
  },
  servicos: {
    titulo: 'Serviços',
    novo: 'Novo serviço',
    vazio: ['Nenhum serviço cadastrado', 'Cadastre banho, tosa, consultas e o que mais o petshop oferece.'],
    colunas: [
      { rotulo: 'Nome', valor: (r) => r.nome },
      { rotulo: 'Descrição', valor: (r) => r.descricao || '—' },
      { rotulo: 'Preço', valor: (r) => dinheiro(r.preco) },
      { rotulo: 'Duração', valor: (r) => `${r.duracao_min} min` },
    ],
    campos: [
      { nome: 'nome', rotulo: 'Nome', tipo: 'text', obrigatorio: true },
      { nome: 'descricao', rotulo: 'Descrição', tipo: 'textarea' },
      { nome: 'preco', rotulo: 'Preço (R$)', tipo: 'number', step: '0.01', min: '0', numero: true, obrigatorio: true },
      { nome: 'duracao_min', rotulo: 'Duração (minutos)', tipo: 'number', step: '5', min: '5', numero: true, obrigatorio: true },
    ],
  },
};

/* ---------- Utilitários ---------- */
const $ = (sel) => document.querySelector(sel);

function esc(texto) {
  const d = document.createElement('div');
  d.textContent = texto ?? '';
  return d.innerHTML;
}

async function api(caminho, { metodo = 'GET', corpo } = {}) {
  const resposta = await fetch(`/api${caminho}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  if (resposta.status === 204) return null;
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível concluir a operação.');
  return dados;
}

let temporizador;
function avisar(mensagem, erro = false) {
  const el = $('#aviso');
  el.textContent = mensagem;
  el.className = erro ? 'aviso erro-aviso' : 'aviso';
  el.hidden = false;
  clearTimeout(temporizador);
  temporizador = setTimeout(() => (el.hidden = true), 3500);
}

/* ---------- Estado e telas ---------- */
let atual = 'agendamentos';
let linhas = [];
let editandoId = null;

function montarMenu() {
  $('#menu').innerHTML = Object.entries(entidades)
    .map(([chave, e]) => `<button type="button" data-chave="${chave}" aria-current="${chave === atual}">${e.titulo}</button>`)
    .join('');
}

async function abrirTela(chave) {
  atual = chave;
  const e = entidades[chave];
  montarMenu();
  $('#titulo').textContent = e.titulo;
  $('#btn-novo').textContent = e.novo;
  await carregar();
}

async function carregar() {
  const e = entidades[atual];
  try {
    linhas = await api(`/${atual}`);
  } catch (erro) {
    $('#conteudo').innerHTML = `<div class="vazio"><strong>Não foi possível carregar</strong>${esc(erro.message)}</div>`;
    return;
  }
  if (!linhas.length) {
    $('#conteudo').innerHTML = `<div class="vazio"><strong>${esc(e.vazio[0])}</strong>${esc(e.vazio[1])}</div>`;
    return;
  }
  const cabecalho = e.colunas.map((c) => `<th>${esc(c.rotulo)}</th>`).join('') + '<th></th>';
  const corpo = linhas.map((r) => {
    const celulas = e.colunas.map((c) => `<td>${c.html ? c.html(r) : esc(c.valor(r))}</td>`).join('');
    return `<tr>${celulas}<td class="acoes-linha">
      <button class="btn pequeno" data-acao="editar" data-id="${r.id}" type="button">Editar</button>
      <button class="btn pequeno perigo" data-acao="excluir" data-id="${r.id}" type="button">Excluir</button>
    </td></tr>`;
  }).join('');
  $('#conteudo').innerHTML = `<table><thead><tr>${cabecalho}</tr></thead><tbody>${corpo}</tbody></table>`;
}

/* ---------- Formulário ---------- */
async function abrirFormulario(registro = null) {
  const e = entidades[atual];
  editandoId = registro ? registro.id : null;
  $('#dlg-titulo').textContent = registro ? `Editar ${e.novo.replace(/^Nov[oa] /, '')}` : e.novo;
  $('#dlg-erro').hidden = true;

  // Carrega as opções dos selects que dependem de outra entidade (ex.: pets -> tutores)
  const origens = {};
  try {
    await Promise.all(e.campos.filter((c) => c.origem).map(async (c) => {
      origens[c.origem] = await api(`/${c.origem}`);
    }));
  } catch (erro) {
    return avisar(erro.message, true);
  }

  $('#campos').innerHTML = e.campos.map((c) => {
    const id = `campo-${c.nome}`;
    const valor = registro ? registro[c.nome] : null;
    let controle;
    if (c.tipo === 'select') {
      const opcoes = c.origem
        ? origens[c.origem].map((o) => ({ valor: o.id, rotulo: c.opcao(o) }))
        : c.fixas;
      const vazio = c.obrigatorio && !c.fixas ? '<option value="">Selecione…</option>' : '';
      controle = `<select id="${id}" name="${c.nome}">${vazio}${opcoes
        .map((o) => `<option value="${esc(String(o.valor))}" ${String(o.valor) === String(valor) ? 'selected' : ''}>${esc(o.rotulo)}</option>`)
        .join('')}</select>`;
    } else if (c.tipo === 'textarea') {
      controle = `<textarea id="${id}" name="${c.nome}">${esc(valor)}</textarea>`;
    } else {
      let v = valor ?? '';
      if (c.tipo === 'datetime-local' && valor) v = paraInputLocal(valor);
      const extras = [c.step && `step="${c.step}"`, c.min && `min="${c.min}"`].filter(Boolean).join(' ');
      controle = `<input id="${id}" name="${c.nome}" type="${c.tipo}" value="${esc(String(v))}" ${extras}>`;
    }
    return `<div class="campo"><label for="${id}">${esc(c.rotulo)}${c.obrigatorio ? ' *' : ''}</label>${controle}</div>`;
  }).join('');

  $('#dialogo').showModal();
  $('#campos').querySelector('input, select, textarea')?.focus();
}

async function salvar(evento) {
  evento.preventDefault();
  const e = entidades[atual];
  const corpo = {};
  for (const c of e.campos) {
    let v = $(`#campo-${c.nome}`).value.trim();
    if (v === '') v = null;
    else if (c.numero) v = Number(v);
    else if (c.tipo === 'datetime-local') v = new Date(v).toISOString();
    corpo[c.nome] = v;
  }
  const faltando = e.campos.filter((c) => c.obrigatorio && corpo[c.nome] === null);
  if (faltando.length) {
    const el = $('#dlg-erro');
    el.textContent = `Preencha: ${faltando.map((c) => c.rotulo).join(', ')}.`;
    el.hidden = false;
    return;
  }
  try {
    if (editandoId) await api(`/${atual}/${editandoId}`, { metodo: 'PUT', corpo });
    else await api(`/${atual}`, { metodo: 'POST', corpo });
    $('#dialogo').close();
    avisar(editandoId ? 'Alterações salvas.' : 'Cadastro salvo.');
    await carregar();
  } catch (erro) {
    const el = $('#dlg-erro');
    el.textContent = erro.message;
    el.hidden = false;
  }
}

async function excluir(id) {
  if (!confirm('Excluir este registro? Essa ação não pode ser desfeita.')) return;
  try {
    await api(`/${atual}/${id}`, { metodo: 'DELETE' });
    avisar('Registro excluído.');
    await carregar();
  } catch (erro) {
    avisar(erro.message, true);
  }
}

/* ---------- Eventos ---------- */
$('#menu').addEventListener('click', (ev) => {
  const botao = ev.target.closest('button[data-chave]');
  if (botao) abrirTela(botao.dataset.chave);
});
$('#btn-novo').addEventListener('click', () => abrirFormulario());
$('#btn-cancelar').addEventListener('click', () => $('#dialogo').close());
$('#formulario').addEventListener('submit', salvar);
$('#conteudo').addEventListener('click', (ev) => {
  const botao = ev.target.closest('button[data-acao]');
  if (!botao) return;
  const id = Number(botao.dataset.id);
  if (botao.dataset.acao === 'editar') abrirFormulario(linhas.find((r) => r.id === id));
  else excluir(id);
});

abrirTela(atual);
