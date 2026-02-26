// ============================================
// Types and helpers - data comes from API
// ============================================

export interface Process {
  id: number;
  name: string;
  averageTimeMinutes: number;
  order: number;
}

export interface ContainerType {
  id: number;
  name: string;
  description: string;
  dimensions: string;
}

export interface Worker {
  id: number;
  name: string;
  level: 'junior' | 'senior';
  specialtyProcessIds: number[];
  avatar?: string;
}

export interface SequencingRule {
  processId: number;
  beforeProcesses: number[];
  afterProcesses: number[];
  parallelProcesses: number[];
  separatedProcesses: number[];
  sameWorkerProcesses: number[];
  requiresSeniorJunior: boolean;
}

export interface ProcessStage {
  processId: number;
  assignedWorkerIds: number[];
  scheduledStartTime: string | null;
  scheduledEndTime: string | null;
  actualStartTime: string | null;
  actualEndTime: string | null;
  estimatedDuration: number;
  elapsedTime: number;
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface Container {
  id: number;
  number: string;
  type: string;
  cliente: string;
  deliveryDeadline: string;
  startDate: string;
  currentStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  processStages: ProcessStage[];
  createdAt: string;
  slotId?: string;
  floorId?: number;
}

export interface FactorySlot {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  containerId: number | null;
  nameX?: number;
  nameY?: number;
}

// ============================================
// INITIAL FACTORY SLOTS
// ============================================
export const INITIAL_FACTORY_SLOTS: FactorySlot[] = [
  { id: 'slot-1', name: 'V-01', x: 50, y: 50, width: 180, height: 80, containerId: null },
  { id: 'slot-2', name: 'V-02', x: 250, y: 50, width: 180, height: 80, containerId: null },
  { id: 'slot-3', name: 'V-03', x: 450, y: 50, width: 180, height: 80, containerId: null },
  { id: 'slot-4', name: 'V-04', x: 50, y: 150, width: 180, height: 80, containerId: null },
  { id: 'slot-5', name: 'V-05', x: 250, y: 150, width: 180, height: 80, containerId: null },
  { id: 'slot-6', name: 'V-06', x: 450, y: 150, width: 180, height: 80, containerId: null },
];

export const INITIAL_FACTORY_SLOTS_2: FactorySlot[] = [
  { id: 'slot-2-1', name: 'A-01', x: 50, y: 50, width: 180, height: 80, containerId: null },
  { id: 'slot-2-2', name: 'A-02', x: 250, y: 50, width: 180, height: 80, containerId: null },
  { id: 'slot-2-3', name: 'A-03', x: 450, y: 50, width: 180, height: 80, containerId: null },
];

// ============================================
// WORKER COLORS
// ============================================
export const WORKER_COLORS = [
  '#4ECDC4',
  '#FFB366',
  '#95E1D3',
  '#F38181',
  '#AA96DA',
  '#FCBAD3',
  '#A8E6CF',
  '#FFD93D',
];

export const getWorkerColor = (workerId: number): string => {
  return WORKER_COLORS[(workerId - 1) % WORKER_COLORS.length];
};
