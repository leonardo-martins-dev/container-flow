const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface PropostaRow {
  ID: number;
  Ordem_Prod: string | null;
  Empresa: string | null;
  Data_Firmada: string | null;
  NumeroFicha: string | null;
  Cliente: string | null;
  Cidade: string | null;
  Produto: string | null;
  Descrição?: string | null;
  Patrimonio: string | null;
  IDPatrim: number | null;
  Valor: number | null;
  InformacoesAdicionais: string | null;
  TIPO_PROD: string | null;
}

export interface PatrimonioRow {
  TIPO: string | null;
  GRUPO: string | null;
  Patrimonio: string | null;
  Descrição: string | null;
  Id: number;
}

export async function getPropostas(): Promise<PropostaRow[]> {
  const res = await fetch(`${API_BASE}/api/propostas`);
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function getPatrimoniosDisponiveis(): Promise<PatrimonioRow[]> {
  const res = await fetch(`${API_BASE}/api/patrimonios/disponiveis`);
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function getCronogramaMacro() {
  const res = await fetch(`${API_BASE}/api/cronograma/macro`);
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function getCronogramaDiario(date: string) {
  const res = await fetch(`${API_BASE}/api/cronograma/diario?date=${encodeURIComponent(date)}`);
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export interface CronogramaConflict {
  workerId: number;
  data: string;
  task1: { proposta_id: number; processo_id: number; inicio: string; fim: string };
  task2: { proposta_id: number; processo_id: number; inicio: string; fim: string };
}

export class CronogramaGerarError extends Error {
  conflicts: CronogramaConflict[];
  constructor(message: string, conflicts: CronogramaConflict[] = []) {
    super(message);
    this.name = 'CronogramaGerarError';
    this.conflicts = conflicts;
  }
}

export async function postCronogramaGerar() {
  const res = await fetch(`${API_BASE}/api/cronograma/gerar`, { method: 'POST' });
  if (!res.ok) {
    const contentType = res.headers.get('content-type');
    const body = contentType?.includes('application/json')
      ? await res.json().catch(() => ({}))
      : {};
    const message = body?.error ?? (await res.text().catch(() => res.statusText));
    const conflicts = Array.isArray(body?.conflicts) ? body.conflicts : [];
    throw new CronogramaGerarError(message, conflicts);
  }
  return res.json();
}

export async function getRegrasValidar() {
  const res = await fetch(`${API_BASE}/api/regras/validar`);
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function getRegras() {
  const res = await fetch(`${API_BASE}/api/regras`);
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export interface ProcessRow {
  id: number;
  name: string;
  averageTimeMinutes: number;
  order: number;
}

export async function getProcessos(): Promise<ProcessRow[]> {
  const res = await fetch(`${API_BASE}/api/processos`);
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createProcess(process: Omit<ProcessRow, 'id'>): Promise<ProcessRow> {
  const res = await fetch(`${API_BASE}/api/processos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(process),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err = (() => { try { return JSON.parse(text); } catch { return null; } })();
    throw new Error(err?.error ?? text);
  }
  return res.json();
}

export async function updateProcess(id: number, updates: Partial<ProcessRow>): Promise<ProcessRow> {
  const res = await fetch(`${API_BASE}/api/processos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err = (() => { try { return JSON.parse(text); } catch { return null; } })();
    throw new Error(err?.error ?? text);
  }
  return res.json();
}

export async function deleteProcess(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/processos/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err = (() => { try { return JSON.parse(text); } catch { return null; } })();
    throw new Error(err?.error ?? text);
  }
}

export interface WorkerRow {
  id: number;
  name: string;
  level: 'junior' | 'senior';
  specialtyProcessIds: number[];
}

export async function getWorkers(): Promise<WorkerRow[]> {
  const res = await fetch(`${API_BASE}/api/workers`);
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createWorker(worker: Omit<WorkerRow, 'id'>): Promise<WorkerRow> {
  const res = await fetch(`${API_BASE}/api/workers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(worker),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err = (() => { try { return JSON.parse(text); } catch { return null; } })();
    throw new Error(err?.error ?? text);
  }
  return res.json();
}

export async function updateWorker(id: number, updates: Partial<WorkerRow>): Promise<WorkerRow> {
  const res = await fetch(`${API_BASE}/api/workers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err = (() => { try { return JSON.parse(text); } catch { return null; } })();
    throw new Error(err?.error ?? text);
  }
  return res.json();
}

export async function deleteWorker(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/workers/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err = (() => { try { return JSON.parse(text); } catch { return null; } })();
    throw new Error(err?.error ?? text);
  }
}

export interface ContainerTypeRow {
  id: number;
  name: string;
  description: string;
  dimensions: string;
}

export async function getContainerTypes(): Promise<ContainerTypeRow[]> {
  const res = await fetch(`${API_BASE}/api/container-types`);
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createContainerType(type: Omit<ContainerTypeRow, 'id'>): Promise<ContainerTypeRow> {
  const res = await fetch(`${API_BASE}/api/container-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(type),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err = (() => { try { return JSON.parse(text); } catch { return null; } })();
    throw new Error(err?.error ?? text);
  }
  return res.json();
}

export async function updateContainerType(id: number, updates: Partial<ContainerTypeRow>): Promise<ContainerTypeRow> {
  const res = await fetch(`${API_BASE}/api/container-types/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err = (() => { try { return JSON.parse(text); } catch { return null; } })();
    throw new Error(err?.error ?? text);
  }
  return res.json();
}

export async function deleteContainerType(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/container-types/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err = (() => { try { return JSON.parse(text); } catch { return null; } })();
    throw new Error(err?.error ?? text);
  }
}

export async function putRegras(regras: unknown) {
  const res = await fetch(`${API_BASE}/api/regras`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regras),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export interface ContainerRow {
  id: number;
  number: string;
  type: string;
  cliente: string;
  deliveryDeadline: string;
  startDate: string;
  currentStatus: string;
  processStages: unknown[];
  createdAt: string;
}

export async function getContainers(): Promise<ContainerRow[]> {
  const res = await fetch(`${API_BASE}/api/containers`);
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createContainer(container: Omit<ContainerRow, 'id' | 'createdAt'>): Promise<ContainerRow> {
  const res = await fetch(`${API_BASE}/api/containers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(container),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err = (() => { try { return JSON.parse(text); } catch { return null; } })();
    throw new Error(err?.error ?? text);
  }
  return res.json();
}

export async function updateContainer(id: number, updates: Partial<ContainerRow>): Promise<ContainerRow> {
  const res = await fetch(`${API_BASE}/api/containers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err = (() => { try { return JSON.parse(text); } catch { return null; } })();
    throw new Error(err?.error ?? text);
  }
  return res.json();
}

export async function deleteContainer(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/containers/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err = (() => { try { return JSON.parse(text); } catch { return null; } })();
    throw new Error(err?.error ?? text);
  }
}

export async function syncContainersFromPropostas(): Promise<{ synced: number; total: number }> {
  const res = await fetch(`${API_BASE}/api/containers/sync-from-propostas`, { method: 'POST' });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export interface FactoryLayoutResponse {
  floor1: Array<{ id: string; name: string; x: number; y: number; width: number; height: number; containerId: number | null; nameX?: number; nameY?: number }>;
  floor2: Array<{ id: string; name: string; x: number; y: number; width: number; height: number; containerId: number | null; nameX?: number; nameY?: number }>;
}

export async function getFactoryLayout(): Promise<FactoryLayoutResponse> {
  const res = await fetch(`${API_BASE}/api/factory-layout`);
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function saveFactoryLayout(payload: FactoryLayoutResponse): Promise<FactoryLayoutResponse> {
  const res = await fetch(`${API_BASE}/api/factory-layout`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err = (() => { try { return JSON.parse(text); } catch { return null; } })();
    throw new Error(err?.error ?? text);
  }
  return res.json();
}
