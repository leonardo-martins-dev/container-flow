// ============================================
// MOCK DATA - Container Management System
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
// PROCESSES
// ============================================
export const MOCK_PROCESSES: Process[] = [
  { id: 1, name: 'LIMPEZA', averageTimeMinutes: 120, order: 1 },
  { id: 2, name: 'LAVAGEM EXTERNA', averageTimeMinutes: 60, order: 2 },
  { id: 3, name: 'LAVAGEM INTERNA', averageTimeMinutes: 90, order: 3 },
  { id: 4, name: 'TETO/FUNILARIA', averageTimeMinutes: 180, order: 4 },
  { id: 5, name: 'ABERTURAS', averageTimeMinutes: 240, order: 5 },
  { id: 6, name: 'SOLDA', averageTimeMinutes: 300, order: 6 },
  { id: 7, name: 'PISO', averageTimeMinutes: 180, order: 7 },
  { id: 8, name: 'FORRO', averageTimeMinutes: 120, order: 8 },
  { id: 9, name: 'DIVISÓRIA', averageTimeMinutes: 150, order: 9 },
  { id: 10, name: 'PAREDE', averageTimeMinutes: 200, order: 10 },
  { id: 11, name: 'PINTURA AIRLESS', averageTimeMinutes: 240, order: 11 },
  { id: 12, name: 'PINTURA PAREDES', averageTimeMinutes: 180, order: 12 },
  { id: 13, name: 'SILICONE', averageTimeMinutes: 60, order: 13 },
  { id: 14, name: 'HIDRÁULICA', averageTimeMinutes: 300, order: 14 },
  { id: 15, name: 'ELÉTRICA', averageTimeMinutes: 360, order: 15 },
  { id: 16, name: 'VIDRAÇARIA', averageTimeMinutes: 120, order: 16 },
  { id: 17, name: 'ACABAMENTOS', averageTimeMinutes: 180, order: 17 },
  { id: 18, name: 'PINTURA PISO', averageTimeMinutes: 120, order: 18 },
  { id: 19, name: 'ADESIVOS', averageTimeMinutes: 90, order: 19 },
  { id: 20, name: 'ACESSÓRIOS', averageTimeMinutes: 150, order: 20 },
  { id: 21, name: 'PORTA ORIGINAL', averageTimeMinutes: 180, order: 21 },
  { id: 22, name: 'C.QUALIDADE', averageTimeMinutes: 60, order: 22 }
];

// ============================================
// CONTAINER TYPES
// ============================================
export const MOCK_CONTAINER_TYPES: ContainerType[] = [
  { id: 1, name: '20ft Standard', description: 'Contêiner padrão de 20 pés', dimensions: '20x8x8.5 ft' },
  { id: 2, name: '40ft Standard', description: 'Contêiner padrão de 40 pés', dimensions: '40x8x8.5 ft' },
  { id: 3, name: '40ft HC', description: 'Contêiner High Cube de 40 pés', dimensions: '40x8x9.5 ft' },
  { id: 4, name: '45ft HC', description: 'Contêiner High Cube de 45 pés', dimensions: '45x8x9.5 ft' },
  { id: 5, name: '53ft Standard', description: 'Contêiner padrão de 53 pés', dimensions: '53x8x8.5 ft' }
];

// ============================================
// WORKERS
// ============================================
export const MOCK_WORKERS: Worker[] = [
  { id: 1, name: 'João Silva', level: 'senior', specialtyProcessIds: [1, 2, 3, 4, 5, 6] },
  { id: 2, name: 'Maria Santos', level: 'senior', specialtyProcessIds: [7, 8, 9, 10, 11, 12] },
  { id: 3, name: 'Pedro Oliveira', level: 'junior', specialtyProcessIds: [1, 2, 3, 13, 14, 15] },
  { id: 4, name: 'Ana Costa', level: 'junior', specialtyProcessIds: [16, 17, 18, 19, 20, 21] },
  { id: 5, name: 'Carlos Souza', level: 'senior', specialtyProcessIds: [1, 2, 3, 4, 5, 6, 7, 8] },
  { id: 6, name: 'Gabriel Lima', level: 'junior', specialtyProcessIds: [16, 17, 18, 19, 20, 21, 22] }
];

// ============================================
// SEQUENCING RULES
// ============================================
export const MOCK_SEQUENCING_RULES: SequencingRule[] = [
  {
    processId: 1,
    beforeProcesses: [],
    afterProcesses: [],
    parallelProcesses: [],
    separatedProcesses: [],
    sameWorkerProcesses: [],
    requiresSeniorJunior: false
  },
  {
    processId: 2,
    beforeProcesses: [1],
    afterProcesses: [],
    parallelProcesses: [],
    separatedProcesses: [],
    sameWorkerProcesses: [3],
    requiresSeniorJunior: false
  },
  {
    processId: 3,
    beforeProcesses: [2],
    afterProcesses: [],
    parallelProcesses: [],
    separatedProcesses: [],
    sameWorkerProcesses: [2],
    requiresSeniorJunior: false
  },
  {
    processId: 16,
    beforeProcesses: [],
    afterProcesses: [],
    parallelProcesses: [4, 5, 6],
    separatedProcesses: [],
    sameWorkerProcesses: [],
    requiresSeniorJunior: false
  },
  {
    processId: 22,
    beforeProcesses: [],
    afterProcesses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
    parallelProcesses: [],
    separatedProcesses: [],
    sameWorkerProcesses: [],
    requiresSeniorJunior: false
  }
];

// ============================================
// INITIAL CONTAINERS
// ============================================
const now = new Date();
const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

export const MOCK_CONTAINERS: Container[] = [
  {
    id: 1,
    number: 'CONT-001',
    type: '40ft HC',
    cliente: 'Transportes ABC',
    deliveryDeadline: sevenDaysFromNow.toISOString(),
    startDate: twoDaysAgo.toISOString(),
    currentStatus: 'in_progress',
    processStages: [
      {
        processId: 1,
        assignedWorkerIds: [1],
        scheduledStartTime: twoDaysAgo.toISOString(),
        scheduledEndTime: new Date(twoDaysAgo.getTime() + 120 * 60 * 1000).toISOString(),
        actualStartTime: twoDaysAgo.toISOString(),
        actualEndTime: new Date(twoDaysAgo.getTime() + 120 * 60 * 1000).toISOString(),
        estimatedDuration: 120,
        elapsedTime: 120,
        status: 'completed'
      },
      {
        processId: 2,
        assignedWorkerIds: [1],
        scheduledStartTime: oneDayAgo.toISOString(),
        scheduledEndTime: new Date(oneDayAgo.getTime() + 60 * 60 * 1000).toISOString(),
        actualStartTime: oneDayAgo.toISOString(),
        actualEndTime: null,
        estimatedDuration: 60,
        elapsedTime: 30,
        status: 'in_progress'
      },
      {
        processId: 3,
        assignedWorkerIds: [1],
        scheduledStartTime: null,
        scheduledEndTime: null,
        actualStartTime: null,
        actualEndTime: null,
        estimatedDuration: 90,
        elapsedTime: 0,
        status: 'pending'
      }
    ],
    createdAt: twoDaysAgo.toISOString()
  },
  {
    id: 2,
    number: 'CONT-002',
    type: '20ft Standard',
    cliente: 'Logística XYZ',
    deliveryDeadline: threeDaysFromNow.toISOString(),
    startDate: oneDayAgo.toISOString(),
    currentStatus: 'in_progress',
    processStages: [
      {
        processId: 1,
        assignedWorkerIds: [3],
        scheduledStartTime: oneDayAgo.toISOString(),
        scheduledEndTime: new Date(oneDayAgo.getTime() + 120 * 60 * 1000).toISOString(),
        actualStartTime: oneDayAgo.toISOString(),
        actualEndTime: new Date(oneDayAgo.getTime() + 110 * 60 * 1000).toISOString(),
        estimatedDuration: 120,
        elapsedTime: 110,
        status: 'completed'
      },
      {
        processId: 4,
        assignedWorkerIds: [5],
        scheduledStartTime: now.toISOString(),
        scheduledEndTime: new Date(now.getTime() + 180 * 60 * 1000).toISOString(),
        actualStartTime: now.toISOString(),
        actualEndTime: null,
        estimatedDuration: 180,
        elapsedTime: 45,
        status: 'in_progress'
      }
    ],
    createdAt: oneDayAgo.toISOString()
  },
  {
    id: 3,
    number: 'CONT-003',
    type: '45ft HC',
    cliente: 'Frete Rápido',
    deliveryDeadline: tenDaysFromNow.toISOString(),
    startDate: now.toISOString(),
    currentStatus: 'pending',
    processStages: [
      {
        processId: 1,
        assignedWorkerIds: [],
        scheduledStartTime: null,
        scheduledEndTime: null,
        actualStartTime: null,
        actualEndTime: null,
        estimatedDuration: 120,
        elapsedTime: 0,
        status: 'pending'
      },
      {
        processId: 5,
        assignedWorkerIds: [],
        scheduledStartTime: null,
        scheduledEndTime: null,
        actualStartTime: null,
        actualEndTime: null,
        estimatedDuration: 240,
        elapsedTime: 0,
        status: 'pending'
      },
      {
        processId: 6,
        assignedWorkerIds: [],
        scheduledStartTime: null,
        scheduledEndTime: null,
        actualStartTime: null,
        actualEndTime: null,
        estimatedDuration: 300,
        elapsedTime: 0,
        status: 'pending'
      }
    ],
    createdAt: now.toISOString()
  }
];

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
  '#4ECDC4', // Teal
  '#FFB366', // Orange
  '#95E1D3', // Mint
  '#F38181', // Coral
  '#AA96DA', // Purple
  '#FCBAD3', // Pink
  '#A8E6CF', // Light Green
  '#FFD93D', // Yellow
];

export const getWorkerColor = (workerId: number): string => {
  return WORKER_COLORS[(workerId - 1) % WORKER_COLORS.length];
};
