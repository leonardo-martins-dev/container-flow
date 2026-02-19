const { query } = require('../db/pool');

const HORARIO = {
  segQui: { inicio: 7 * 60 + 10, fim: 16 * 60 + 50 },
  sexta: { inicio: 7 * 60 + 10, fim: 15 * 60 + 50 },
  almoco: { inicio: 12 * 60, fim: 13 * 60 },
};

const LINHAS_PRODUCAO = 7;

function getDiaUtil(diaOffset) {
  const d = new Date();
  d.setDate(d.getDate() + diaOffset);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

function minutosDoDia(data) {
  const d = new Date(data);
  const day = d.getDay();
  if (day === 0 || day === 6) return null;
  return day === 5 ? HORARIO.sexta : HORARIO.segQui;
}

function addMinutos(data, minutos) {
  const r = new Date(data);
  r.setMinutes(r.getMinutes() + minutos);
  return r;
}

function consideraAlmoco(inicioMinutos, duracaoMinutos) {
  const almoco = HORARIO.almoco;
  let fim = inicioMinutos + duracaoMinutos;
  if (inicioMinutos < almoco.inicio && fim > almoco.inicio) {
    fim += almoco.fim - almoco.inicio;
  }
  return fim;
}

async function gerarCronograma() {
  const [propostasRes, regrasRes, delaysRes, doisTrabalhadoresRes] = await Promise.all([
    query(`SELECT ID, Ordem_Prod, Cliente, Produto, Data_Firmada FROM PROPOSTAS WHERE Finalizacao IS NULL AND Ordem_Prod IS NOT NULL AND Patrimonio IS NULL AND Cancelamento_Ficha IS NULL ORDER BY ID`).catch(() => ({ recordset: [] })),
    query(`SELECT process_id, before_processes, after_processes, parallel_processes, same_worker_processes, requires_senior_junior FROM container_flow.regras_sequenciamento`).catch(() => ({ recordset: [] })),
    query(`SELECT process_id, delay_minutos FROM container_flow.processos_delay`).catch(() => ({ recordset: [] })),
    query(`SELECT process_id FROM container_flow.processos_dois_trabalhadores WHERE ativo = 1`).catch(() => ({ recordset: [] })),
  ]);

  const propostas = propostasRes.recordset || [];
  const delayByProcess = {};
  (delaysRes.recordset || []).forEach((r) => { delayByProcess[r.process_id] = r.delay_minutos ?? 12; });
  const processosComDois = new Set((doisTrabalhadoresRes.recordset || []).map((r) => r.process_id));

  const processos = [
    { id: 1, name: 'LIMPEZA', avgMin: 120 },
    { id: 2, name: 'LAVAGEM EXTERNA', avgMin: 60 },
    { id: 3, name: 'LAVAGEM INTERNA', avgMin: 90 },
    { id: 6, name: 'SOLDA', avgMin: 300 },
    { id: 22, name: 'C.QUALIDADE', avgMin: 60 },
  ];
  const workers = [
    { id: 1, name: 'João Silva', level: 'senior' },
    { id: 2, name: 'Maria Santos', level: 'senior' },
    { id: 3, name: 'Pedro Oliveira', level: 'junior' },
  ];

  await query(`DELETE FROM container_flow.cronograma_macro`);
  await query(`DELETE FROM container_flow.cronograma_diario`);
  await query(`DELETE FROM container_flow.hora_extra`);

  const macro = [];
  const diario = [];
  let linhaAtual = 0;
  const workerDisponivel = {};
  workers.forEach((w) => {
    workerDisponivel[w.id] = null;
  });

  for (let i = 0; i < propostas.length; i++) {
    const prop = propostas[i];
    const linha = (i % LINHAS_PRODUCAO) + 1;
    const diaInicio = Math.floor(i / LINHAS_PRODUCAO);
    const dataInicio = getDiaUtil(diaInicio);
    dataInicio.setHours(7, 10, 0, 0);
    const totalMin = processos.reduce((acc, p) => acc + p.avgMin, 0);
    const dataFim = addMinutos(dataInicio, totalMin + 60);

    await query(
      `INSERT INTO container_flow.cronograma_macro (linha, dia, proposta_id, container_id, inicio_previsto, fim_previsto)
       VALUES (@linha, @dia, @propostaId, @containerId, @inicio, @fim)`,
      {
        linha,
        dia: diaInicio,
        propostaId: prop.ID,
        containerId: prop.Ordem_Prod || prop.Patrimonio || null,
        inicio: dataInicio,
        fim: dataFim,
      }
    );

    let minutoAtual = HORARIO.segQui.inicio;
    let diaIdx = 0;
    const dataBase = new Date(dataInicio);
    dataBase.setHours(0, 0, 0, 0);

    for (const proc of processos) {
      const janela = minutosDoDia(getDiaUtil(diaIdx));
      if (!janela) {
        diaIdx++;
        continue;
      }
      const delay = delayByProcess[proc.id] ?? (proc.id === 6 || proc.id === 2 || proc.id === 3 ? 12 : 5);
      const inicioMin = minutoAtual;
      const fimMin = consideraAlmoco(inicioMin, proc.avgMin);
      minutoAtual = fimMin + delay;
      if (minutoAtual >= janela.fim) {
        diaIdx++;
        minutoAtual = janela.inicio;
      }

      const inicioDate = new Date(dataBase);
      inicioDate.setDate(inicioDate.getDate() + diaIdx);
      inicioDate.setMinutes(inicioDate.getMinutes() + janela.inicio + (inicioMin - janela.inicio));
      const fimDate = addMinutos(inicioDate, proc.avgMin);

      const fimMinutosTask = fimDate.getHours() * 60 + fimDate.getMinutes();
      let horaExtraMin = 0;
      if (fimMinutosTask > janela.fim) {
        horaExtraMin = fimMinutosTask - janela.fim;
      }

      const workerId = workers[diaIdx % workers.length].id;
      diario.push({
        data: getDiaUtil(diaIdx),
        worker_id: workerId,
        container_id: prop.Ordem_Prod,
        proposta_id: prop.ID,
        processo_id: proc.id,
        processo_nome: proc.name,
        inicio: inicioDate,
        fim: fimDate,
        hora_extra_minutos: horaExtraMin,
      });
    }
  }

  for (const d of diario) {
    const dataStr = d.data.toISOString().slice(0, 10);
    await query(
      `INSERT INTO container_flow.cronograma_diario (data, worker_id, container_id, proposta_id, processo_id, processo_nome, inicio, fim, hora_extra_minutos)
       VALUES (@data, @workerId, @containerId, @propostaId, @processoId, @processoNome, @inicio, @fim, @horaExtra)`,
      {
        data: dataStr,
        workerId: d.worker_id,
        containerId: d.container_id,
        propostaId: d.proposta_id,
        processoId: d.processo_id,
        processoNome: d.processo_nome,
        inicio: d.inicio,
        fim: d.fim,
        horaExtra: d.hora_extra_minutos || 0,
      }
    );
  }

  const macroResult = await query(`SELECT id, linha, dia, proposta_id, container_id, inicio_previsto, fim_previsto FROM container_flow.cronograma_macro ORDER BY linha, dia`);
  const diarioResult = await query(`SELECT id, data, worker_id, container_id, processo_id, processo_nome, inicio, fim, hora_extra_minutos FROM container_flow.cronograma_diario ORDER BY data, worker_id, inicio`);

  return {
    macro: { lines: LINHAS_PRODUCAO, assignments: macroResult.recordset || [] },
    diario: diarioResult.recordset || [],
  };
}

module.exports = { gerarCronograma };
