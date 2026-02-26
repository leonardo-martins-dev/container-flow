import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Container,
  Process,
  Worker,
  ContainerType,
  SequencingRule,
  FactorySlot,
  INITIAL_FACTORY_SLOTS,
  INITIAL_FACTORY_SLOTS_2,
} from '@/data/mockData';
import { calculateContainerStatus } from '@/lib/utils';
import { getRegras, getProcessos, getWorkers, getContainerTypes, getContainers, createContainer as apiCreateContainer, updateContainer as apiUpdateContainer, deleteContainer as apiDeleteContainer, syncContainersFromPropostas, getFactoryLayout, saveFactoryLayout, createProcess as apiCreateProcess, updateProcess as apiUpdateProcess, deleteProcess as apiDeleteProcess, createWorker as apiCreateWorker, updateWorker as apiUpdateWorker, deleteWorker as apiDeleteWorker, createContainerType as apiCreateContainerType, updateContainerType as apiUpdateContainerType, deleteContainerType as apiDeleteContainerType } from '@/lib/api';

interface Alert {
  id: string;
  containerNumber: string;
  processName: string;
  workerName: string;
  remainingMinutes: number;
}

interface ContainerContextType {
  // Data
  containers: Container[];
  processes: Process[];
  workers: Worker[];
  containerTypes: ContainerType[];
  sequencingRules: SequencingRule[];
  factorySlots: FactorySlot[];
  factorySlots2: FactorySlot[];
  alerts: Alert[];
  
  // Container Actions
  addContainer: (container: Omit<Container, 'id' | 'createdAt'>) => Promise<void>;
  updateContainer: (id: number, updates: Partial<Container>) => Promise<void>;
  deleteContainer: (id: number) => Promise<void>;
  
  // Process Actions
  addProcess: (process: Omit<Process, 'id'>) => Promise<void>;
  updateProcess: (id: number, updates: Partial<Process>) => Promise<void>;
  deleteProcess: (id: number) => Promise<void>;
  
  // Worker Actions
  addWorker: (worker: Omit<Worker, 'id'>) => Promise<void>;
  updateWorker: (id: number, updates: Partial<Worker>) => Promise<void>;
  deleteWorker: (id: number) => Promise<void>;
  
  // Container Type Actions
  addContainerType: (type: Omit<ContainerType, 'id'>) => Promise<void>;
  updateContainerType: (id: number, updates: Partial<ContainerType>) => Promise<void>;
  deleteContainerType: (id: number) => Promise<void>;
  
  // Sequencing Rules Actions
  updateSequencingRule: (processId: number, updates: Partial<SequencingRule>) => void;
  setSequencingRules: (rules: SequencingRule[]) => void;
  resetSequencingRules: () => void;
  loadRegrasFromApi: () => Promise<void>;
  
  // Factory Slots Actions
  updateFactorySlots: (slots: FactorySlot[]) => void;
  updateFactorySlots2: (slots: FactorySlot[]) => void;
  assignContainerToSlot: (containerId: number, slotId: string, floorId: number) => void;
  removeContainerFromSlot: (containerId: number) => void;
  
  // Alert Actions
  dismissAlert: (alertId: string) => void;
  clearAlerts: () => void;

  // API sync (propostas -> containers)
  syncContainersFromApi: () => Promise<void>;
}

const ContainerContext = createContext<ContainerContextType | undefined>(undefined);

export const useContainerContext = () => {
  const context = useContext(ContainerContext);
  if (!context) {
    throw new Error('useContainerContext must be used within a ContainerProvider');
  }
  return context;
};

interface ContainerProviderProps {
  children: ReactNode;
}

export const ContainerProvider: React.FC<ContainerProviderProps> = ({ children }) => {
  const [containers, setContainers] = useState<Container[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [containerTypes, setContainerTypes] = useState<ContainerType[]>([]);
  const [sequencingRules, setSequencingRules] = useState<SequencingRule[]>([]);
  const [factorySlots, setFactorySlots] = useState<FactorySlot[]>(() => {
    const saved = localStorage.getItem('factoryLayout');
    return saved ? JSON.parse(saved) : INITIAL_FACTORY_SLOTS;
  });
  const [factorySlots2, setFactorySlots2] = useState<FactorySlot[]>(() => {
    const saved = localStorage.getItem('factoryLayout2');
    return saved ? JSON.parse(saved) : INITIAL_FACTORY_SLOTS_2;
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    localStorage.setItem('factoryLayout', JSON.stringify(factorySlots));
  }, [factorySlots]);
  useEffect(() => {
    localStorage.setItem('factoryLayout2', JSON.stringify(factorySlots2));
  }, [factorySlots2]);

  // Container Actions
  const addContainer = useCallback(async (container: Omit<Container, 'id' | 'createdAt'>) => {
    const created = await apiCreateContainer(container);
    setContainers(prev => [...prev, created as Container]);
  }, []);

  const updateContainer = useCallback(async (id: number, updates: Partial<Container>) => {
    const updated = await apiUpdateContainer(id, updates);
    const newStatus = calculateContainerStatus(updates.processStages ?? updated.processStages ?? []);
    setContainers(prev => prev.map(c =>
      c.id === id ? { ...c, ...updated, currentStatus: newStatus } : c
    ));
  }, []);

  const deleteContainer = useCallback(async (id: number) => {
    await apiDeleteContainer(id);
    setContainers(prev => prev.filter(c => c.id !== id));
    setFactorySlots(prev => prev.map(slot =>
      slot.containerId === id ? { ...slot, containerId: null } : slot
    ));
    setFactorySlots2(prev => prev.map(slot =>
      slot.containerId === id ? { ...slot, containerId: null } : slot
    ));
  }, []);

  // Process Actions
  const addProcess = useCallback(async (process: Omit<Process, 'id'>) => {
    const created = await apiCreateProcess(process);
    setProcesses(prev => [...prev, created]);
  }, []);

  const updateProcess = useCallback(async (id: number, updates: Partial<Process>) => {
    const updated = await apiUpdateProcess(id, updates);
    setProcesses(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
  }, []);

  const deleteProcess = useCallback(async (id: number) => {
    await apiDeleteProcess(id);
    setProcesses(prev => prev.filter(p => p.id !== id));
  }, []);

  // Worker Actions
  const addWorker = useCallback(async (worker: Omit<Worker, 'id'>) => {
    const created = await apiCreateWorker(worker);
    setWorkers(prev => [...prev, created]);
  }, []);

  const updateWorker = useCallback(async (id: number, updates: Partial<Worker>) => {
    const updated = await apiUpdateWorker(id, updates);
    setWorkers(prev => prev.map(w => w.id === id ? { ...w, ...updated } : w));
  }, []);

  const deleteWorker = useCallback(async (id: number) => {
    await apiDeleteWorker(id);
    setWorkers(prev => prev.filter(w => w.id !== id));
  }, []);

  // Container Type Actions
  const addContainerType = useCallback(async (type: Omit<ContainerType, 'id'>) => {
    const created = await apiCreateContainerType(type);
    setContainerTypes(prev => [...prev, created]);
  }, []);

  const updateContainerType = useCallback(async (id: number, updates: Partial<ContainerType>) => {
    const updated = await apiUpdateContainerType(id, updates);
    setContainerTypes(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
  }, []);

  const deleteContainerType = useCallback(async (id: number) => {
    await apiDeleteContainerType(id);
    setContainerTypes(prev => prev.filter(t => t.id !== id));
  }, []);

  // Sequencing Rules Actions
  const updateSequencingRule = useCallback((processId: number, updates: Partial<SequencingRule>) => {
    setSequencingRules(prev => {
      const exists = prev.find(r => r.processId === processId);
      if (exists) {
        return prev.map(r => r.processId === processId ? { ...r, ...updates } : r);
      }
      return [...prev, { processId, beforeProcesses: [], afterProcesses: [], parallelProcesses: [], separatedProcesses: [], sameWorkerProcesses: [], requiresSeniorJunior: false, ...updates }];
    });
  }, []);

  const setSequencingRulesList = useCallback((rules: SequencingRule[]) => {
    setSequencingRules(rules);
  }, []);

  const loadRegrasFromApi = useCallback(async () => {
    const regras = await getRegras();
    setSequencingRules(Array.isArray(regras) ? regras : []);
  }, []);

  const resetSequencingRules = useCallback(() => {
    loadRegrasFromApi();
  }, [loadRegrasFromApi]);

  // Factory Slots Actions (persist to API)
  const updateFactorySlots = useCallback((slots: FactorySlot[]) => {
    setFactorySlots(slots);
    saveFactoryLayout({ floor1: slots, floor2: factorySlots2 }).catch(() => {});
  }, [factorySlots2]);

  const updateFactorySlots2 = useCallback((slots: FactorySlot[]) => {
    setFactorySlots2(slots);
    saveFactoryLayout({ floor1: factorySlots, floor2: slots }).catch(() => {});
  }, [factorySlots]);

  const assignContainerToSlot = useCallback((containerId: number, slotId: string, floorId: number) => {
    let newFloor1 = factorySlots;
    let newFloor2 = factorySlots2;
    if (floorId === 1) {
      newFloor1 = factorySlots.map(slot => ({
        ...slot,
        containerId: slot.id === slotId ? containerId : (slot.containerId === containerId ? null : slot.containerId)
      }));
    } else {
      newFloor2 = factorySlots2.map(slot => ({
        ...slot,
        containerId: slot.id === slotId ? containerId : (slot.containerId === containerId ? null : slot.containerId)
      }));
    }
    setFactorySlots(newFloor1);
    setFactorySlots2(newFloor2);
    saveFactoryLayout({ floor1: newFloor1, floor2: newFloor2 }).catch(() => {});
    setContainers(prev => prev.map(c =>
      c.id === containerId ? { ...c, slotId, floorId } : c
    ));
  }, [factorySlots, factorySlots2]);

  const removeContainerFromSlot = useCallback((containerId: number) => {
    const newFloor1 = factorySlots.map(slot =>
      slot.containerId === containerId ? { ...slot, containerId: null } : slot
    );
    const newFloor2 = factorySlots2.map(slot =>
      slot.containerId === containerId ? { ...slot, containerId: null } : slot
    );
    setFactorySlots(newFloor1);
    setFactorySlots2(newFloor2);
    saveFactoryLayout({ floor1: newFloor1, floor2: newFloor2 }).catch(() => {});
    setContainers(prev => prev.map(c =>
      c.id === containerId ? { ...c, slotId: undefined, floorId: undefined } : c
    ));
  }, [factorySlots, factorySlots2]);

  // Alert Actions
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const syncContainersFromApi = useCallback(async () => {
    await syncContainersFromPropostas();
    const list = await getContainers();
    setContainers(list as Container[]);
  }, []);

  const loadContainers = useCallback(async () => {
    const list = await getContainers();
    setContainers(list as Container[]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadContainers().catch(() => {});
    getProcessos()
      .then((data) => { if (!cancelled) setProcesses(data); })
      .catch(() => {});
    getWorkers()
      .then((data) => { if (!cancelled) setWorkers(data); })
      .catch(() => {});
    getContainerTypes()
      .then((data) => { if (!cancelled) setContainerTypes(data); })
      .catch(() => {});
    getRegras()
      .then((data) => { if (!cancelled) setSequencingRules(Array.isArray(data) ? data : []); })
      .catch(() => {});
    getFactoryLayout()
      .then((data) => {
        if (!cancelled && data.floor1?.length) setFactorySlots(data.floor1 as FactorySlot[]);
        if (!cancelled && data.floor2?.length) setFactorySlots2(data.floor2 as FactorySlot[]);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [loadContainers]);

  // Auto-update status every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setContainers(prev => prev.map(container => ({
        ...container,
        currentStatus: calculateContainerStatus(container.processStages)
      })));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const value: ContainerContextType = {
    containers,
    processes,
    workers,
    containerTypes,
    sequencingRules,
    factorySlots,
    factorySlots2,
    alerts,
    addContainer,
    updateContainer,
    deleteContainer,
    addProcess,
    updateProcess,
    deleteProcess,
    addWorker,
    updateWorker,
    deleteWorker,
    addContainerType,
    updateContainerType,
    deleteContainerType,
    updateSequencingRule,
    setSequencingRules: setSequencingRulesList,
    resetSequencingRules,
    loadRegrasFromApi,
    updateFactorySlots,
    updateFactorySlots2,
    assignContainerToSlot,
    removeContainerFromSlot,
    dismissAlert,
    clearAlerts,
    syncContainersFromApi,
  };

  return (
    <ContainerContext.Provider value={value}>
      {children}
    </ContainerContext.Provider>
  );
};
