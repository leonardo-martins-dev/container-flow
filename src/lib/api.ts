const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const TOKEN_KEY = 'container_flow_token';

function getAuthHeaders(): Record<string, string> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
  const res = await fetch(`${API_BASE}/api/propostas`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function getPatrimoniosDisponiveis(): Promise<PatrimonioRow[]> {
  const res = await fetch(`${API_BASE}/api/patrimonios/disponiveis`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function getCronogramaMacro() {
  const res = await fetch(`${API_BASE}/api/cronograma/macro`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function getCronogramaDiario(date: string) {
  const res = await fetch(`${API_BASE}/api/cronograma/diario?date=${encodeURIComponent(date)}`, { headers: getAuthHeaders() });
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
  const res = await fetch(`${API_BASE}/api/cronograma/gerar`, { method: 'POST', headers: getAuthHeaders() });
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
  const res = await fetch(`${API_BASE}/api/regras/validar`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function getRegras() {
  const res = await fetch(`${API_BASE}/api/regras`, { headers: getAuthHeaders() });
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
  const res = await fetch(`${API_BASE}/api/processos`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createProcess(process: Omit<ProcessRow, 'id'>): Promise<ProcessRow> {
  const res = await fetch(`${API_BASE}/api/processos`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
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
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
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
  const res = await fetch(`${API_BASE}/api/processos/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err = (() => { try { return JSON.parse(text); } catch { return null; } })();
    throw new Error(err?.error ?? text);
  }
}

export interface ProcessDelayRow {
  processId: number;
  delayMinutos: number;
}

export async function getProcessDelays(): Promise<ProcessDelayRow[]> {
  const res = await fetch(`${API_BASE}/api/processos/delays`, { headers: getAuthHeaders() });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function putProcessDelay(processId: number, delayMinutos: number): Promise<ProcessDelayRow> {
  const res = await fetch(`${API_BASE}/api/processos/delays`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ processId, delayMinutos }),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export interface WorkerRow {
  id: number;
  name: string;
  level: 'junior' | 'senior';
  specialtyProcessIds: number[];
  status?: string;
  coringa?: boolean;
  atrasoMinutos?: number | null;
  presenceDate?: string;
  logPresence?: boolean;
}

export async function getWorkers(): Promise<WorkerRow[]> {
  const res = await fetch(`${API_BASE}/api/workers`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createWorker(worker: Omit<WorkerRow, 'id'>): Promise<WorkerRow> {
  const res = await fetch(`${API_BASE}/api/workers`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
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
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err = (() => { try { return JSON.parse(text); } catch { return null; } })();
    throw new Error(err?.error ?? text);
  }
  return res.json();
}

export interface WorkerPresence {
  date: string;
  status: string;
  atrasoMinutos: number | null;
}

export interface WorkerPresenceSummary {
  totalFaltas: number;
  totalAtrasos: number;
  totalMinutosAtraso: number;
  presencas: WorkerPresence[];
}

export async function getWorkerPresences(workerId: number, month: string): Promise<WorkerPresenceSummary> {
  const params = new URLSearchParams({ month });
  const res = await fetch(`${API_BASE}/api/workers/${workerId}/presencas?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function deleteWorker(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/workers/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
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
  const res = await fetch(`${API_BASE}/api/container-types`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createContainerType(type: Omit<ContainerTypeRow, 'id'>): Promise<ContainerTypeRow> {
  const res = await fetch(`${API_BASE}/api/container-types`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
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
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
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
  const res = await fetch(`${API_BASE}/api/container-types/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err = (() => { try { return JSON.parse(text); } catch { return null; } })();
    throw new Error(err?.error ?? text);
  }
}

export async function putRegras(regras: unknown) {
  const res = await fetch(`${API_BASE}/api/regras`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
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
  const res = await fetch(`${API_BASE}/api/containers`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createContainer(container: Omit<ContainerRow, 'id' | 'createdAt'>): Promise<ContainerRow> {
  const res = await fetch(`${API_BASE}/api/containers`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
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
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
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
  const res = await fetch(`${API_BASE}/api/containers/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err = (() => { try { return JSON.parse(text); } catch { return null; } })();
    throw new Error(err?.error ?? text);
  }
}

export async function syncContainersFromPropostas(): Promise<{ synced: number; total: number }> {
  const res = await fetch(`${API_BASE}/api/containers/sync-from-propostas`, { method: 'POST', headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export interface FactoryLayoutResponse {
  floor1: Array<{ id: string; name: string; x: number; y: number; width: number; height: number; containerId: number | null; nameX?: number; nameY?: number }>;
  floor2: Array<{ id: string; name: string; x: number; y: number; width: number; height: number; containerId: number | null; nameX?: number; nameY?: number }>;
}

export async function getFactoryLayout(): Promise<FactoryLayoutResponse> {
  const res = await fetch(`${API_BASE}/api/factory-layout`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function saveFactoryLayout(payload: FactoryLayoutResponse): Promise<FactoryLayoutResponse> {
  const res = await fetch(`${API_BASE}/api/factory-layout`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err = (() => { try { return JSON.parse(text); } catch { return null; } })();
    throw new Error(err?.error ?? text);
  }
  return res.json();
}

export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export async function loginAuth(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || 'Falha no login');
  }
  return res.json();
}

export async function getMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Sessão inválida');
  return res.json();
}

export interface UserRow {
  id: number;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export async function getUsers(): Promise<UserRow[]> {
  const res = await fetch(`${API_BASE}/api/users`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createUser(payload: { nome: string; email: string; senha: string; role: string; ativo?: boolean }): Promise<UserRow> {
  const res = await fetch(`${API_BASE}/api/users`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    try {
      const json = JSON.parse(text);
      throw new Error(json?.error || text);
    } catch {
      throw new Error(text);
    }
  }
  return res.json();
}

export async function updateUser(id: number, updates: Partial<Pick<UserRow, 'nome' | 'email' | 'role' | 'ativo'>>): Promise<UserRow> {
  const res = await fetch(`${API_BASE}/api/users/${id}`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    try {
      const json = JSON.parse(text);
      throw new Error(json?.error || text);
    } catch {
      throw new Error(text);
    }
  }
  return res.json();
}

export async function updateUserPassword(id: number, senha: string): Promise<UserRow> {
  const res = await fetch(`${API_BASE}/api/users/${id}/password`, {
    method: 'PATCH',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ senha }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    try {
      const json = JSON.parse(text);
      throw new Error(json?.error || text);
    } catch {
      throw new Error(text);
    }
  }
  return res.json();
}

export interface SolicitacaoLogistica {
  id: number;
  containerId: number;
  data: string;
  hora: string;
  tipo: string;
}

export async function getSolicitacoesLogistica(): Promise<SolicitacaoLogistica[]> {
  const res = await fetch(`${API_BASE}/api/logistics/solicitacoes`, { headers: getAuthHeaders() });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function createSolicitacaoLogistica(payload: { containerId: number; data: string; hora?: string; tipo?: string }): Promise<SolicitacaoLogistica> {
  const res = await fetch(`${API_BASE}/api/logistics/solicitacoes`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Erro ao criar solicitação');
  return res.json();
}

export async function getTarefasMotorista(): Promise<Array<{ id: number; tipo: string; containerId: number; data: string; status: string }>> {
  const res = await fetch(`${API_BASE}/api/logistics/tarefas-motorista`, { headers: getAuthHeaders() });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function getPrevisaoComercial(): Promise<Array<{ containerId: number; numero: string; inicioPrevisto: string; fimPrevisto: string; entregaPrevista: string }>> {
  const res = await fetch(`${API_BASE}/api/cronograma/previsao-comercial`, { headers: getAuthHeaders() });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export interface DashboardTVData {
  avgProgress: number;
  inProgress: number;
  overdue: number;
  bottlenecks: string[];
  containersInProgress: Array<{ id: number; number: string; progress: number }>;
  totalContainers: number;
  totalProcesses: number;
}

export async function getDashboardTVData(): Promise<DashboardTVData> {
  const res = await fetch(`${API_BASE}/api/public/dashboard-tv`);
  if (!res.ok) throw new Error('Falha ao carregar dados do dashboard TV');
  return res.json();
}
