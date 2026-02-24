/**
 * Ordena processos por regras de sequenciamento (before/after).
 * C.QUALIDADE (ou processo com id qualidadeId) fica sempre por último.
 * @param {Array<{id: number, name?: string, avgMin?: number}>} processos
 * @param {Array<{processId: number, afterProcesses?: number[], beforeProcesses?: number[]}>} regras
 * @param {number|null} processoQualidadeId - id do processo C.QUALIDADE (sempre último)
 * @returns {Array<{id: number, name: string, avgMin: number}>} processos ordenados
 */
function ordenarProcessosPorRegras(processos, regras, processoQualidadeId = null) {
  if (!processos || processos.length === 0) return [];
  const byId = {};
  processos.forEach((p) => {
    byId[p.id] = {
      id: p.id,
      name: p.name || String(p.id),
      avgMin: p.avgMin ?? p.avg_minutos ?? 60,
    };
  });
  const idsInicial = Object.keys(byId).map(Number);
  const realIds = new Set(idsInicial);
  const allIds = new Set(idsInicial);
  (regras || []).forEach((r) => {
    if (r.processId != null) allIds.add(r.processId);
    (r.afterProcesses || []).forEach((id) => allIds.add(id));
    (r.beforeProcesses || []).forEach((id) => allIds.add(id));
  });
  allIds.forEach((id) => {
    if (!byId[id]) byId[id] = { id, name: String(id), avgMin: 60 };
  });
  const ids = Array.from(allIds);

  // Build graph: "A has after_processes [B]" => A must come before B => edge A -> B
  const outEdges = {};
  ids.forEach((id) => { outEdges[id] = []; });
  (regras || []).forEach((r) => {
    const from = r.processId;
    (r.afterProcesses || []).forEach((to) => {
      if (byId[to] && from !== to) outEdges[from].push(to);
    });
  });

  // In-degree for each node (how many must come before it)
  const inDegree = {};
  ids.forEach((id) => { inDegree[id] = 0; });
  ids.forEach((id) => {
    outEdges[id].forEach((to) => { inDegree[to] = (inDegree[to] || 0) + 1; });
  });

  // Kahn's algorithm
  const queue = ids.filter((id) => inDegree[id] === 0);
  const order = [];
  while (queue.length > 0) {
    const id = queue.shift();
    order.push(id);
    outEdges[id].forEach((to) => {
      inDegree[to]--;
      if (inDegree[to] === 0) queue.push(to);
    });
  }

  // If cycle, not all nodes in order; fallback to original order
  if (order.length !== ids.length) {
    return processos.map((p) => ({ id: p.id, name: p.name || String(p.id), avgMin: p.avgMin ?? p.avg_minutos ?? 60 }));
  }

  let ordered = order.filter((id) => realIds.has(id)).map((id) => byId[id]);

  // C.QUALIDADE always last (only if it is a real process)
  const qualidadeId = processoQualidadeId != null ? processoQualidadeId : (ids.find((id) => (byId[id].name || '').toUpperCase().includes('QUALIDADE')));
  if (qualidadeId != null && realIds.has(qualidadeId) && byId[qualidadeId]) {
    ordered = ordered.filter((p) => p.id !== qualidadeId);
    ordered.push(byId[qualidadeId]);
  }

  return ordered;
}

module.exports = { ordenarProcessosPorRegras };
