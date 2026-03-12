const express = require('express');
const { query } = require('../db/pool');

const router = express.Router();

function parseProcessStages(val) {
  if (val == null || val === '') return [];
  try {
    const arr = JSON.parse(val);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function calculateProgress(stages) {
  if (!stages || stages.length === 0) return 0;
  const completed = stages.filter((s) => s.status === 'completed').length;
  return Math.round((completed / stages.length) * 100);
}

function daysRemaining(deadline) {
  if (!deadline) return 999;
  const now = new Date();
  const d = new Date(deadline);
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

router.get('/dashboard-tv', async (req, res) => {
  try {
    const [containersRes, processesRes] = await Promise.all([
      query(
        `SELECT id, numero, current_status, process_stages, delivery_deadline
         FROM container_flow.containers ORDER BY id`
      ),
      query(`SELECT id FROM container_flow.processos`),
    ]);
    const rows = containersRes.recordset || [];
    const processCount = (processesRes.recordset || []).length;
    const containers = rows.map((r) => ({
      id: r.id,
      number: r.numero,
      currentStatus: (r.current_status || 'pending').toLowerCase(),
      processStages: parseProcessStages(r.process_stages),
      deliveryDeadline: r.delivery_deadline ? new Date(r.delivery_deadline).toISOString().slice(0, 10) : '',
    }));
    const inProgress = containers.filter((c) => c.currentStatus === 'in_progress').length;
    const overdue = containers.filter((c) => daysRemaining(c.deliveryDeadline) <= 0).length;
    const avgProgress =
      containers.length > 0
        ? Math.round(
            containers.reduce((acc, c) => acc + calculateProgress(c.processStages), 0) / containers.length
          )
        : 0;
    const byProcess = {};
    containers.forEach((c) => {
      (c.processStages || [])
        .filter((s) => s.status === 'in_progress')
        .forEach((s) => {
          const pid = s.processId;
          byProcess[pid] = (byProcess[pid] || 0) + 1;
        });
    });
    const maxLoad = Math.max(0, ...Object.values(byProcess));
    const bottlenecks = [];
    if (overdue > 0) bottlenecks.push(`${overdue} container(s) atrasado(s)`);
    if (maxLoad > 2) bottlenecks.push('Processos com fila (sobrecarga)');
    const containersInProgress = containers
      .filter((c) => c.currentStatus === 'in_progress')
      .slice(0, 12)
      .map((c) => ({ id: c.id, number: c.number, progress: calculateProgress(c.processStages) }));
    res.json({
      avgProgress,
      inProgress,
      overdue,
      bottlenecks,
      containersInProgress,
      totalContainers: containers.length,
      totalProcesses: processCount,
    });
  } catch (err) {
    console.error('GET /api/public/dashboard-tv', err);
    res.status(500).json({
      avgProgress: 0,
      inProgress: 0,
      overdue: 0,
      bottlenecks: [],
      containersInProgress: [],
      totalContainers: 0,
      totalProcesses: 0,
    });
  }
});

module.exports = router;
