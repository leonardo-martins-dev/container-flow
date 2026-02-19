const { query } = require('../db/pool');

function parseJsonArray(str) {
  if (!str) return [];
  try {
    const a = JSON.parse(str);
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

async function listar() {
  try {
    const result = await query(`
      SELECT id, process_id, before_processes, after_processes, parallel_processes,
        separated_processes, same_worker_processes, requires_senior_junior
      FROM container_flow.regras_sequenciamento
      ORDER BY process_id
    `);
    const rows = result.recordset || [];
    return rows.map((r) => ({
      processId: r.process_id,
      beforeProcesses: parseJsonArray(r.before_processes),
      afterProcesses: parseJsonArray(r.after_processes),
      parallelProcesses: parseJsonArray(r.parallel_processes),
      separatedProcesses: parseJsonArray(r.separated_processes),
      sameWorkerProcesses: parseJsonArray(r.same_worker_processes),
      requiresSeniorJunior: !!r.requires_senior_junior,
    }));
  } catch {
    return [];
  }
}

function garantirBidirecional(regras) {
  const byProcess = {};
  regras.forEach((r) => {
    byProcess[r.processId] = { ...r };
  });
  regras.forEach((r) => {
    const p = r.processId;
    (r.afterProcesses || []).forEach((other) => {
      if (byProcess[other] && !(byProcess[other].beforeProcesses || []).includes(p)) {
        byProcess[other].beforeProcesses = [...(byProcess[other].beforeProcesses || []), p];
      }
    });
    (r.beforeProcesses || []).forEach((other) => {
      if (byProcess[other] && !(byProcess[other].afterProcesses || []).includes(p)) {
        byProcess[other].afterProcesses = [...(byProcess[other].afterProcesses || []), p];
      }
    });
    (r.parallelProcesses || []).forEach((other) => {
      if (byProcess[other] && !(byProcess[other].parallelProcesses || []).includes(p)) {
        byProcess[other].parallelProcesses = [...(byProcess[other].parallelProcesses || []), p];
      }
    });
    (r.sameWorkerProcesses || []).forEach((other) => {
      if (byProcess[other] && !(byProcess[other].sameWorkerProcesses || []).includes(p)) {
        byProcess[other].sameWorkerProcesses = [...(byProcess[other].sameWorkerProcesses || []), p];
      }
    });
    (r.separatedProcesses || []).forEach((other) => {
      if (byProcess[other] && !(byProcess[other].separatedProcesses || []).includes(p)) {
        byProcess[other].separatedProcesses = [...(byProcess[other].separatedProcesses || []), p];
      }
    });
  });
  return Object.values(byProcess);
}

async function salvarComSincronizacao(regras) {
  const sincronizadas = garantirBidirecional(Array.isArray(regras) ? regras : []);
  for (const r of sincronizadas) {
    const before = JSON.stringify(r.beforeProcesses || []);
    const after = JSON.stringify(r.afterProcesses || []);
    const parallel = JSON.stringify(r.parallelProcesses || []);
    const separated = JSON.stringify(r.separatedProcesses || []);
    const sameWorker = JSON.stringify(r.sameWorkerProcesses || []);
    const requires = r.requiresSeniorJunior ? 1 : 0;

    const upd = await query(
      `UPDATE container_flow.regras_sequenciamento SET
         before_processes = @before, after_processes = @after,
         parallel_processes = @parallel, separated_processes = @separated,
         same_worker_processes = @sameWorker, requires_senior_junior = @requires,
         updated_at = GETUTCDATE()
       WHERE process_id = @processId`,
      { processId: r.processId, before, after, parallel, separated, sameWorker, requires }
    );

    if (!upd.rowsAffected || upd.rowsAffected[0] === 0) {
      await query(
        `INSERT INTO container_flow.regras_sequenciamento (process_id, before_processes, after_processes, parallel_processes, separated_processes, same_worker_processes, requires_senior_junior)
         VALUES (@processId, @before, @after, @parallel, @separated, @sameWorker, @requires)`,
        { processId: r.processId, before, after, parallel, separated, sameWorker, requires }
      );
    }
  }
  return listar();
}

function validarUma(regras, processId) {
  const r = regras.find((x) => x.processId === processId);
  if (!r) return [];
  const erros = [];
  (r.afterProcesses || []).forEach((other) => {
    const o = regras.find((x) => x.processId === other);
    if (o && !(o.beforeProcesses || []).includes(processId)) {
      erros.push(`Sequência: processo ${other} deveria ter "antes" ${processId}`);
    }
  });
  (r.parallelProcesses || []).forEach((other) => {
    const o = regras.find((x) => x.processId === other);
    if (o && !(o.parallelProcesses || []).includes(processId)) {
      erros.push(`Paralelo: processo ${other} deveria ter "paralelo" ${processId}`);
    }
  });
  (r.sameWorkerProcesses || []).forEach((other) => {
    const o = regras.find((x) => x.processId === other);
    if (o && !(o.sameWorkerProcesses || []).includes(processId)) {
      erros.push(`Mesmo trabalhador: processo ${other} deveria ter "mesmo trabalhador" ${processId}`);
    }
  });
  (r.separatedProcesses || []).forEach((other) => {
    const o = regras.find((x) => x.processId === other);
    if (o && !(o.separatedProcesses || []).includes(processId)) {
      erros.push(`Separação: processo ${other} deveria ter "separado" ${processId}`);
    }
  });
  return erros;
}

async function validarTodas() {
  const regras = await listar();
  const erros = [];
  regras.forEach((r) => {
    validarUma(regras, r.processId).forEach((e) => erros.push(e));
  });
  const unicos = [...new Set(erros)];
  return { ok: unicos.length === 0, erros: unicos };
}

module.exports = { listar, salvarComSincronizacao, validarTodas, garantirBidirecional };
