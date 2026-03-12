const { query } = require('../db/pool');

let cacheMacro = { lines: 7, days: [], assignments: [] };
let cacheDiario = {};

async function getMacro() {
  try {
    const result = await query(`
      SELECT id, linha, dia, proposta_id, container_id, inicio_previsto, fim_previsto
      FROM container_flow.cronograma_macro
      ORDER BY linha, dia
    `);
    const rows = result.recordset || [];
    const assignments = rows.map((r) => ({
      id: r.id,
      linha: r.linha,
      dia: r.dia,
      propostaId: r.proposta_id,
      containerId: r.container_id,
      inicioPrevisto: r.inicio_previsto,
      fimPrevisto: r.fim_previsto,
    }));
    return { lines: 7, days: [...Array(14)].map((_, i) => i), assignments };
  } catch (err) {
    console.error('getMacro:', err);
    return { lines: 7, days: [...Array(14)].map((_, i) => i), assignments: cacheMacro.assignments };
  }
}

async function getDiario(date) {
  try {
    const result = await query(
      `SELECT id, data, worker_id, worker_id_2, container_id, proposta_id, processo_id, processo_nome, inicio, fim, hora_extra_minutos
       FROM container_flow.cronograma_diario
       WHERE data = @date
       ORDER BY worker_id, inicio`,
      { date }
    );
    const rows = result.recordset || [];
    const byWorker = {};
    rows.forEach((r) => {
      const w = r.worker_id;
      if (!byWorker[w]) byWorker[w] = [];
      byWorker[w].push({
        id: r.id,
        containerId: r.container_id,
        processoId: r.processo_id,
        processoNome: r.processo_nome,
        inicio: r.inicio,
        fim: r.fim,
        horaExtraMinutos: r.hora_extra_minutos || 0,
        workerId2: r.worker_id_2 ?? undefined,
      });
    });
    return { date, byWorker };
  } catch (err) {
    console.error('getDiario:', err);
    return { date, byWorker: {} };
  }
}

async function gerar() {
  const engine = require('./cronogramaEngine');
  const result = await engine.gerarCronograma();
  return result;
}

async function getPrevisaoComercial() {
  try {
    const macro = await getMacro();
    const assignments = macro.assignments || [];
    const byContainer = {};
    assignments.forEach((a) => {
      const cid = a.containerId || a.propostaId;
      if (!cid) return;
      if (!byContainer[cid]) byContainer[cid] = { containerId: cid, numero: String(cid), inicioPrevisto: '', fimPrevisto: '', entregaPrevista: '' };
      const inc = a.inicioPrevisto ? new Date(a.inicioPrevisto).toISOString().slice(0, 10) : '';
      const fim = a.fimPrevisto ? new Date(a.fimPrevisto).toISOString().slice(0, 10) : '';
      if (inc && (!byContainer[cid].inicioPrevisto || inc < byContainer[cid].inicioPrevisto)) byContainer[cid].inicioPrevisto = inc;
      if (fim && (!byContainer[cid].fimPrevisto || fim > byContainer[cid].fimPrevisto)) byContainer[cid].fimPrevisto = fim;
    });
    const list = Object.values(byContainer);
    list.forEach((p) => { p.entregaPrevista = p.fimPrevisto || p.inicioPrevisto || '-'; });
    const containerIds = list.map((p) => p.containerId);
    if (containerIds.length > 0) {
      const res = await query(
        `SELECT id, numero FROM container_flow.containers WHERE id IN (${containerIds.join(',')})`
      ).catch(() => ({ recordset: [] }));
      const numBy = {};
      (res.recordset || []).forEach((r) => { numBy[r.id] = r.numero; });
      list.forEach((p) => { if (numBy[p.containerId]) p.numero = numBy[p.containerId]; });
    }
    return list;
  } catch (err) {
    console.error('getPrevisaoComercial:', err);
    return [];
  }
}

module.exports = { getMacro, getDiario, gerar, getPrevisaoComercial };
