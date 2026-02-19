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

export async function postCronogramaGerar() {
  const res = await fetch(`${API_BASE}/api/cronograma/gerar`, { method: 'POST' });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
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

export async function putRegras(regras: unknown) {
  const res = await fetch(`${API_BASE}/api/regras`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regras),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}
