const { query } = require('../db/pool');
const { ordenarProcessosPorRegras } = require('../lib/ordenarProcessos');

const HORARIO_FALLBACK = {
  segQui: { inicio: 7 * 60 + 10, fim: 16 * 60 + 50 },
  sexta: { inicio: 7 * 60 + 10, fim: 15 * 60 + 50 },
  almoco: { inicio: 12 * 60, fim: 13 * 60 },
};

const LINHAS_PRODUCAO = 7;

const PROCESSOS_FALLBACK = [
  { id: 1, name: 'LIMPEZA', avgMin: 120 },
  { id: 2, name: 'LAVAGEM EXTERNA', avgMin: 60 },
  { id: 3, name: 'LAVAGEM INTERNA', avgMin: 90 },
  { id: 6, name: 'SOLDA', avgMin: 300 },
  { id: 22, name: 'C.QUALIDADE', avgMin: 60 },
];

const WORKERS_FALLBACK = [
  { id: 1, name: 'João Silva', level: 'senior' },
  { id: 2, name: 'Maria Santos', level: 'senior' },
  { id: 3, name: 'Pedro Oliveira', level: 'junior' },
];

function parseJsonArray(str) {
  if (!str) return [];
  try {
    const a = JSON.parse(str);
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

/** Converte TIME do SQL (string "HH:MM:SS" ou objeto) para minutos desde meia-noite */
function timeToMinutes(val) {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  const s = typeof val === 'string' ? val : String(val);
  const parts = s.trim().split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

/**
 * Monta objeto HORARIO a partir das linhas de config_horario_trabalho.
 * Espera dia_semana 1=Segunda .. 5=Sexta (ou 0-6). Almoco unico 12-13.
 */
function buildHorarioFromConfig(rows) {
  if (!rows || rows.length === 0) return null;
  const byDay = {};
  let almoco = { inicio: 12 * 60, fim: 13 * 60 };
  rows.forEach((r) => {
    const day = r.dia_semana;
    byDay[day] = {
      inicio: timeToMinutes(r.hora_inicio),
      fim: timeToMinutes(r.hora_fim),
    };
    if (r.almoco_inicio != null && r.almoco_fim != null) {
      almoco = { inicio: timeToMinutes(r.almoco_inicio), fim: timeToMinutes(r.almoco_fim) };
    }
  });
  return { byDay, almoco };
}

function getDiaUtil(diaOffset) {
  const d = new Date();
  d.setDate(d.getDate() + diaOffset);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

/** Retorna janela do dia em minutos. HORARIO pode ser dinâmico (byDay + almoco) ou fallback (segQui/sexta/almoco). */
function minutosDoDia(data, HORARIO) {
  const d = new Date(data);
  const day = d.getDay();
  if (day === 0 || day === 6) return null;
  if (HORARIO.byDay) {
    const jsToConfig = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 };
    const diaSemana = jsToConfig[day];
    const janela = HORARIO.byDay[diaSemana];
    if (!janela) return null;
    return { ...janela };
  }
  return day === 5 ? HORARIO.sexta : HORARIO.segQui;
}

function addMinutos(data, minutos) {
  const r = new Date(data);
  r.setMinutes(r.getMinutes() + minutos);
  return r;
}

function consideraAlmoco(inicioMinutos, duracaoMinutos, almoco) {
  const a = almoco || HORARIO_FALLBACK.almoco;
  let fim = inicioMinutos + duracaoMinutos;
  if (inicioMinutos < a.inicio && fim > a.inicio) {
    fim += a.fim - a.inicio;
  }
  return fim;
}

/**
 * Detecta sobreposição de tarefas por (worker, data).
 * Considera worker_id e worker_id_2. Retorna lista de conflitos.
 */
function detectarConflitosPorWorker(diario) {
  const byWorkerDate = {};
  diario.forEach((d) => {
    const dataStr = d.data.toISOString ? d.data.toISOString().slice(0, 10) : String(d.data).slice(0, 10);
    const add = (wid) => {
      if (!wid) return;
      const key = `${wid}|${dataStr}`;
      if (!byWorkerDate[key]) byWorkerDate[key] = [];
      byWorkerDate[key].push({
        workerId: wid,
        data: dataStr,
        proposta_id: d.proposta_id,
        processo_id: d.processo_id,
        inicio: d.inicio instanceof Date ? d.inicio.getTime() : new Date(d.inicio).getTime(),
        fim: d.fim instanceof Date ? d.fim.getTime() : new Date(d.fim).getTime(),
      });
    };
    add(d.worker_id);
    if (d.worker_id_2) add(d.worker_id_2);
  });

  const conflicts = [];
  Object.values(byWorkerDate).forEach((tasks) => {
    tasks.sort((a, b) => a.inicio - b.inicio);
    for (let i = 0; i < tasks.length - 1; i++) {
      const t1 = tasks[i];
      const t2 = tasks[i + 1];
      if (t1.fim > t2.inicio) {
        conflicts.push({
          workerId: t1.workerId,
          data: t1.data,
          task1: { proposta_id: t1.proposta_id, processo_id: t1.processo_id, inicio: new Date(t1.inicio), fim: new Date(t1.fim) },
          task2: { proposta_id: t2.proposta_id, processo_id: t2.processo_id, inicio: new Date(t2.inicio), fim: new Date(t2.fim) },
        });
      }
    }
  });
  return conflicts;
}

/**
 * Escolhe dois workers para tarefa de 2 pessoas: pelo menos 1 senior (nunca 2 juniores).
 * Garante w1 !== w2 quando houver pelo menos 2 workers.
 */
function escolherDoisWorkers(workers, diaIdx) {
  const seniors = workers.filter((w) => (w.level || w.nivel || '').toLowerCase() === 'senior');
  const juniors = workers.filter((w) => (w.level || w.nivel || '').toLowerCase() === 'junior');
  if (seniors.length === 0) {
    const a = workers[0];
    const b = workers[1] && workers[1].id !== a?.id ? workers[1] : null;
    return [a, b].filter(Boolean);
  }
  const w1 = seniors[diaIdx % seniors.length];
  let w2 = juniors.length > 0 ? juniors[diaIdx % juniors.length] : seniors[(diaIdx + 1) % seniors.length];
  if (w2 && w1.id === w2.id) {
    const other = workers.find((w) => w.id !== w1.id);
    w2 = other || null;
  }
  return [w1, w2];
}

async function gerarCronograma() {
  const [
    propostasRes,
    regrasRes,
    delaysRes,
    doisTrabalhadoresRes,
    processosRes,
    workersRes,
    configHorarioRes,
    mesmoTrabalhadorRes,
  ] = await Promise.all([
    query(`SELECT ID, Ordem_Prod, Cliente, Produto, Data_Firmada FROM PROPOSTAS WHERE Finalizacao IS NULL AND Ordem_Prod IS NOT NULL AND Patrimonio IS NULL AND Cancelamento_Ficha IS NULL ORDER BY ID`).catch(() => ({ recordset: [] })),
    query(`SELECT process_id, before_processes, after_processes, parallel_processes, same_worker_processes, requires_senior_junior FROM container_flow.regras_sequenciamento`).catch(() => ({ recordset: [] })),
    query(`SELECT process_id, delay_minutos FROM container_flow.processos_delay`).catch(() => ({ recordset: [] })),
    query(`SELECT process_id FROM container_flow.processos_dois_trabalhadores WHERE ativo = 1`).catch(() => ({ recordset: [] })),
    query(`SELECT id, nome, avg_minutos, ordem FROM container_flow.processos ORDER BY ordem, id`).catch(() => ({ recordset: [] })),
    query(`SELECT id, nome, nivel FROM container_flow.workers`).catch(() => ({ recordset: [] })),
    query(`SELECT dia_semana, hora_inicio, hora_fim, almoco_inicio, almoco_fim FROM container_flow.config_horario_trabalho WHERE ativo = 1`).catch(() => ({ recordset: [] })),
    query(`SELECT processo_a_id, processo_b_id FROM container_flow.processos_mesmo_trabalhador_sequencia`).catch(() => ({ recordset: [] })),
  ]);

  const propostas = propostasRes.recordset || [];
  const delayByProcess = {};
  (delaysRes.recordset || []).forEach((r) => { delayByProcess[r.process_id] = r.delay_minutos ?? 12; });
  const processosComDois = new Set((doisTrabalhadoresRes.recordset || []).map((r) => r.process_id));

  let processos = (processosRes.recordset || []).map((r) => ({
    id: r.id,
    name: r.nome,
    avgMin: r.avg_minutos,
    avg_minutos: r.avg_minutos,
    ordem: r.ordem,
  }));
  if (processos.length === 0) processos = PROCESSOS_FALLBACK.map((p) => ({ ...p, avg_minutos: p.avgMin }));

  let workers = (workersRes.recordset || []).map((r) => ({
    id: r.id,
    name: r.nome,
    level: (r.nivel || '').toLowerCase() === 'junior' ? 'junior' : 'senior',
    nivel: r.nivel,
  }));
  if (workers.length === 0) workers = WORKERS_FALLBACK;

  const regrasRows = regrasRes.recordset || [];
  const regras = regrasRows.map((r) => ({
    processId: r.process_id,
    beforeProcesses: parseJsonArray(r.before_processes),
    afterProcesses: parseJsonArray(r.after_processes),
    sameWorkerProcesses: parseJsonArray(r.same_worker_processes),
  }));

  const qualidadeId = processos.find((p) => (p.name || '').toUpperCase().includes('QUALIDADE'))?.id ?? 22;
  processos = ordenarProcessosPorRegras(processos, regras, qualidadeId);

  const configRows = configHorarioRes.recordset || [];
  const horarioBuilt = buildHorarioFromConfig(configRows);
  const HORARIO = horarioBuilt || {
    byDay: null,
    almoco: HORARIO_FALLBACK.almoco,
    segQui: HORARIO_FALLBACK.segQui,
    sexta: HORARIO_FALLBACK.sexta,
  };
  if (!HORARIO.byDay) {
    HORARIO.segQui = HORARIO_FALLBACK.segQui;
    HORARIO.sexta = HORARIO_FALLBACK.sexta;
    HORARIO.almoco = HORARIO_FALLBACK.almoco;
  }

  const mesmoTrabalhadorPairs = new Set();
  (mesmoTrabalhadorRes.recordset || []).forEach((r) => {
    mesmoTrabalhadorPairs.add(`${r.processo_a_id}|${r.processo_b_id}`);
    mesmoTrabalhadorPairs.add(`${r.processo_b_id}|${r.processo_a_id}`);
  });
  regras.forEach((r) => {
    (r.sameWorkerProcesses || []).forEach((other) => {
      mesmoTrabalhadorPairs.add(`${r.processId}|${other}`);
      mesmoTrabalhadorPairs.add(`${other}|${r.processId}`);
    });
  });

  function isSameWorkerPair(prevProcessId, currentProcessId) {
    return mesmoTrabalhadorPairs.has(`${prevProcessId}|${currentProcessId}`);
  }

  const diario = [];
  const macroAssignments = [];

  for (let i = 0; i < propostas.length; i++) {
    const prop = propostas[i];
    const linha = (i % LINHAS_PRODUCAO) + 1;
    const diaInicio = Math.floor(i / LINHAS_PRODUCAO);
    const dataInicio = getDiaUtil(diaInicio);
    dataInicio.setHours(7, 10, 0, 0);
    const totalMin = processos.reduce((acc, p) => acc + (p.avgMin ?? p.avg_minutos ?? 0), 0);
    const dataFim = addMinutos(dataInicio, totalMin + 60);

    macroAssignments.push({
      linha,
      dia: diaInicio,
      propostaId: prop.ID,
      containerId: prop.Ordem_Prod || prop.Patrimonio || null,
      inicio: dataInicio,
      fim: dataFim,
    });

    const primeiraJanela = minutosDoDia(getDiaUtil(0), HORARIO) || { inicio: 430, fim: 1010 };
    let minutoAtual = primeiraJanela.inicio;
    let diaIdx = 0;
    const dataBase = new Date(dataInicio);
    dataBase.setHours(0, 0, 0, 0);
    let lastWorkerIdForProposta = null;
    let processoAnteriorId = null;

    for (const proc of processos) {
      while (true) {
        const janela = minutosDoDia(getDiaUtil(diaIdx), HORARIO);
        if (!janela) {
          diaIdx++;
          processoAnteriorId = null;
          continue;
        }
        const delay = delayByProcess[proc.id] ?? (proc.id === 6 || proc.id === 2 || proc.id === 3 ? 12 : 5);
        const avgMin = proc.avgMin ?? proc.avg_minutos ?? 60;
        const inicioMin = minutoAtual;
        const fimMin = consideraAlmoco(inicioMin, avgMin, HORARIO.almoco);
        minutoAtual = fimMin + delay;
        if (minutoAtual >= janela.fim) {
          diaIdx++;
          minutoAtual = (minutosDoDia(getDiaUtil(diaIdx), HORARIO) || janela).inicio;
          processoAnteriorId = null;
          continue;
        }

        const inicioDate = new Date(dataBase);
        inicioDate.setDate(inicioDate.getDate() + diaIdx);
        inicioDate.setMinutes(inicioDate.getMinutes() + janela.inicio + (inicioMin - janela.inicio));
        const fimDate = addMinutos(inicioDate, avgMin);

        const fimMinutosTask = fimDate.getHours() * 60 + fimDate.getMinutes();
        let horaExtraMin = 0;
        if (fimMinutosTask > janela.fim) {
          horaExtraMin = fimMinutosTask - janela.fim;
        }

        const precisaDois = processosComDois.has(proc.id);
        let workerId;
        let workerId2 = null;

        if (precisaDois) {
          const [w1, w2] = escolherDoisWorkers(workers, diaIdx);
          workerId = w1?.id ?? workers[0]?.id;
          workerId2 = w2?.id ?? null;
        } else if (processoAnteriorId != null && isSameWorkerPair(processoAnteriorId, proc.id) && lastWorkerIdForProposta != null) {
          workerId = lastWorkerIdForProposta;
        } else {
          workerId = workers[diaIdx % workers.length].id;
        }
        lastWorkerIdForProposta = workerId;
        processoAnteriorId = proc.id;

        diario.push({
          data: getDiaUtil(diaIdx),
          worker_id: workerId,
          worker_id_2: workerId2,
          container_id: prop.Ordem_Prod,
          proposta_id: prop.ID,
          processo_id: proc.id,
          processo_nome: proc.name,
          inicio: inicioDate,
          fim: fimDate,
          hora_extra_minutos: horaExtraMin,
        });
        break;
      }
    }
  }

  const conflicts = detectarConflitosPorWorker(diario);
  if (conflicts.length > 0) {
    return { success: false, conflicts };
  }

  await query(`DELETE FROM container_flow.cronograma_macro`);
  await query(`DELETE FROM container_flow.cronograma_diario`);
  await query(`DELETE FROM container_flow.hora_extra`);

  for (const m of macroAssignments) {
    await query(
      `INSERT INTO container_flow.cronograma_macro (linha, dia, proposta_id, container_id, inicio_previsto, fim_previsto)
       VALUES (@linha, @dia, @propostaId, @containerId, @inicio, @fim)`,
      {
        linha: m.linha,
        dia: m.dia,
        propostaId: m.propostaId,
        containerId: m.containerId,
        inicio: m.inicio,
        fim: m.fim,
      }
    );
  }

  for (const d of diario) {
    const dataStr = d.data.toISOString().slice(0, 10);
    await query(
      `INSERT INTO container_flow.cronograma_diario (data, worker_id, worker_id_2, container_id, proposta_id, processo_id, processo_nome, inicio, fim, hora_extra_minutos)
       VALUES (@data, @workerId, @workerId2, @containerId, @propostaId, @processoId, @processoNome, @inicio, @fim, @horaExtra)`,
      {
        data: dataStr,
        workerId: d.worker_id,
        workerId2: d.worker_id_2,
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

  const horaExtraByWorkerDate = {};
  diario.forEach((d) => {
    const dataStr = d.data.toISOString().slice(0, 10);
    const min = d.hora_extra_minutos || 0;
    if (min <= 0) return;
    const key1 = `${d.worker_id}|${dataStr}`;
    horaExtraByWorkerDate[key1] = (horaExtraByWorkerDate[key1] || 0) + min;
    if (d.worker_id_2) {
      const key2 = `${d.worker_id_2}|${dataStr}`;
      horaExtraByWorkerDate[key2] = (horaExtraByWorkerDate[key2] || 0) + min;
    }
  });
  for (const key of Object.keys(horaExtraByWorkerDate)) {
    const [workerId, dataStr] = key.split('|');
    const minutos = horaExtraByWorkerDate[key];
    const wid = parseInt(workerId, 10);
    const upd = await query(
      `UPDATE container_flow.hora_extra SET minutos = @minutos WHERE worker_id = @workerId AND data = @data`,
      { workerId: wid, data: dataStr, minutos }
    );
    const affected = upd.rowsAffected ? upd.rowsAffected[0] : 0;
    if (affected === 0) {
      await query(
        `INSERT INTO container_flow.hora_extra (worker_id, data, minutos) VALUES (@workerId, @data, @minutos)`,
        { workerId: wid, data: dataStr, minutos }
      );
    }
  }

  const macroResult = await query(`SELECT id, linha, dia, proposta_id, container_id, inicio_previsto, fim_previsto FROM container_flow.cronograma_macro ORDER BY linha, dia`);
  const diarioResult = await query(`SELECT id, data, worker_id, worker_id_2, container_id, proposta_id, processo_id, processo_nome, inicio, fim, hora_extra_minutos FROM container_flow.cronograma_diario ORDER BY data, worker_id, inicio`);

  return {
    success: true,
    macro: { lines: LINHAS_PRODUCAO, assignments: macroResult.recordset || [] },
    diario: diarioResult.recordset || [],
  };
}

module.exports = { gerarCronograma, detectarConflitosPorWorker, ordenarProcessosPorRegras };
