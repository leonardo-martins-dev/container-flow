import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Container,
  Process,
  Worker,
  ContainerType,
  SequencingRule,
  FactorySlot,
  MOCK_CONTAINERS,
  MOCK_PROCESSES,
  MOCK_WORKERS,
  MOCK_CONTAINER_TYPES,
  MOCK_SEQUENCING_RULES,
  INITIAL_FACTORY_SLOTS,
  INITIAL_FACTORY_SLOTS_2,
} from '@/data/mockData';
import { calculateContainerStatus } from '@/lib/utils';

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
  addContainer: (container: Omit<Container, 'id' | 'createdAt'>) => void;
  updateContainer: (id: number, updates: Partial<Container>) => void;
  deleteContainer: (id: number) => void;
  
  // Process Actions
  addProcess: (process: Omit<Process, 'id'>) => void;
  updateProcess: (id: number, updates: Partial<Process>) => void;
  deleteProcess: (id: number) => void;
  
  // Worker Actions
  addWorker: (worker: Omit<Worker, 'id'>) => void;
  updateWorker: (id: number, updates: Partial<Worker>) => void;
  deleteWorker: (id: number) => void;
  
  // Container Type Actions
  addContainerType: (type: Omit<ContainerType, 'id'>) => void;
  updateContainerType: (id: number, updates: Partial<ContainerType>) => void;
  deleteContainerType: (id: number) => void;
  
  // Sequencing Rules Actions
  updateSequencingRule: (processId: number, updates: Partial<SequencingRule>) => void;
  
  // Factory Slots Actions
  updateFactorySlots: (slots: FactorySlot[]) => void;
  updateFactorySlots2: (slots: FactorySlot[]) => void;
  assignContainerToSlot: (containerId: number, slotId: string, floorId: number) => void;
  removeContainerFromSlot: (containerId: number) => void;
  
  // Alert Actions
  dismissAlert: (alertId: string) => void;
  clearAlerts: () => void;
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
  // Initialize state from localStorage or mock data
  const [containers, setContainers] = useState<Container[]>(() => {
    const saved = localStorage.getItem('containers');
    return saved ? JSON.parse(saved) : MOCK_CONTAINERS;
  });
  
  const [processes, setProcesses] = useState<Process[]>(() => {
    const saved = localStorage.getItem('processes');
    return saved ? JSON.parse(saved) : MOCK_PROCESSES;
  });
  
  const [workers, setWorkers] = useState<Worker[]>(() => {
    const saved = localStorage.getItem('workers');
    return saved ? JSON.parse(saved) : MOCK_WORKERS;
  });
  
  const [containerTypes, setContainerTypes] = useState<ContainerType[]>(() => {
    const saved = localStorage.getItem('containerTypes');
    return saved ? JSON.parse(saved) : MOCK_CONTAINER_TYPES;
  });
  
  const [sequencingRules, setSequencingRules] = useState<SequencingRule[]>(() => {
    const saved = localStorage.getItem('sequencingRules');
    return saved ? JSON.parse(saved) : MOCK_SEQUENCING_RULES;
  });
  
  const [factorySlots, setFactorySlots] = useState<FactorySlot[]>(() => {
    const saved = localStorage.getItem('factoryLayout');
    return saved ? JSON.parse(saved) : INITIAL_FACTORY_SLOTS;
  });
  
  const [factorySlots2, setFactorySlots2] = useState<FactorySlot[]>(() => {
    const saved = localStorage.getItem('factoryLayout2');
    return saved ? JSON.parse(saved) : INITIAL_FACTORY_SLOTS_2;
  });
  
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('containers', JSON.stringify(containers));
  }, [containers]);
  
  useEffect(() => {
    localStorage.setItem('processes', JSON.stringify(processes));
  }, [processes]);
  
  useEffect(() => {
    localStorage.setItem('workers', JSON.stringify(workers));
  }, [workers]);
  
  useEffect(() => {
    localStorage.setItem('containerTypes', JSON.stringify(containerTypes));
  }, [containerTypes]);
  
  useEffect(() => {
    localStorage.setItem('sequencingRules', JSON.stringify(sequencingRules));
  }, [sequencingRules]);
  
  useEffect(() => {
    localStorage.setItem('factoryLayout', JSON.stringify(factorySlots));
  }, [factorySlots]);
  
  useEffect(() => {
    localStorage.setItem('factoryLayout2', JSON.stringify(factorySlots2));
  }, [factorySlots2]);

  // Container Actions
  const addContainer = useCallback((container: Omit<Container, 'id' | 'createdAt'>) => {
    const newContainer: Container = {
      ...container,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };
    setContainers(prev => [...prev, newContainer]);
  }, []);

  const updateContainer = useCallback((id: number, updates: Partial<Container>) => {
    setContainers(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates, currentStatus: calculateContainerStatus(updates.processStages || c.processStages) } : c
    ));
  }, []);

  const deleteContainer = useCallback((id: number) => {
    setContainers(prev => prev.filter(c => c.id !== id));
    // Remove from slots
    setFactorySlots(prev => prev.map(slot => 
      slot.containerId === id ? { ...slot, containerId: null } : slot
    ));
    setFactorySlots2(prev => prev.map(slot => 
      slot.containerId === id ? { ...slot, containerId: null } : slot
    ));
  }, []);

  // Process Actions
  const addProcess = useCallback((process: Omit<Process, 'id'>) => {
    const newProcess: Process = {
      ...process,
      id: Math.max(0, ...processes.map(p => p.id)) + 1,
    };
    setProcesses(prev => [...prev, newProcess]);
  }, [processes]);

  const updateProcess = useCallback((id: number, updates: Partial<Process>) => {
    setProcesses(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deleteProcess = useCallback((id: number) => {
    setProcesses(prev => prev.filter(p => p.id !== id));
  }, []);

  // Worker Actions
  const addWorker = useCallback((worker: Omit<Worker, 'id'>) => {
    const newWorker: Worker = {
      ...worker,
      id: Math.max(0, ...workers.map(w => w.id)) + 1,
    };
    setWorkers(prev => [...prev, newWorker]);
  }, [workers]);

  const updateWorker = useCallback((id: number, updates: Partial<Worker>) => {
    setWorkers(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const deleteWorker = useCallback((id: number) => {
    setWorkers(prev => prev.filter(w => w.id !== id));
  }, []);

  // Container Type Actions
  const addContainerType = useCallback((type: Omit<ContainerType, 'id'>) => {
    const newType: ContainerType = {
      ...type,
      id: Math.max(0, ...containerTypes.map(t => t.id)) + 1,
    };
    setContainerTypes(prev => [...prev, newType]);
  }, [containerTypes]);

  const updateContainerType = useCallback((id: number, updates: Partial<ContainerType>) => {
    setContainerTypes(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteContainerType = useCallback((id: number) => {
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

  // Factory Slots Actions
  const updateFactorySlots = useCallback((slots: FactorySlot[]) => {
    setFactorySlots(slots);
  }, []);

  const updateFactorySlots2 = useCallback((slots: FactorySlot[]) => {
    setFactorySlots2(slots);
  }, []);

  const assignContainerToSlot = useCallback((containerId: number, slotId: string, floorId: number) => {
    if (floorId === 1) {
      setFactorySlots(prev => prev.map(slot => ({
        ...slot,
        containerId: slot.id === slotId ? containerId : (slot.containerId === containerId ? null : slot.containerId)
      })));
    } else {
      setFactorySlots2(prev => prev.map(slot => ({
        ...slot,
        containerId: slot.id === slotId ? containerId : (slot.containerId === containerId ? null : slot.containerId)
      })));
    }
    setContainers(prev => prev.map(c => 
      c.id === containerId ? { ...c, slotId, floorId } : c
    ));
  }, []);

  const removeContainerFromSlot = useCallback((containerId: number) => {
    setFactorySlots(prev => prev.map(slot => 
      slot.containerId === containerId ? { ...slot, containerId: null } : slot
    ));
    setFactorySlots2(prev => prev.map(slot => 
      slot.containerId === containerId ? { ...slot, containerId: null } : slot
    ));
    setContainers(prev => prev.map(c => 
      c.id === containerId ? { ...c, slotId: undefined, floorId: undefined } : c
    ));
  }, []);

  // Alert Actions
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

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
    updateFactorySlots,
    updateFactorySlots2,
    assignContainerToSlot,
    removeContainerFromSlot,
    dismissAlert,
    clearAlerts,
  };

  return (
    <ContainerContext.Provider value={value}>
      {children}
    </ContainerContext.Provider>
  );
};
