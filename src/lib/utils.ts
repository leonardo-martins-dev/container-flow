import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================
// TYPE DEFINITIONS
// ============================================

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

export interface Process {
  id: number;
  name: string;
  averageTimeMinutes: number;
  order: number;
}

// ============================================
// DATE & TIME UTILITIES
// ============================================

export const WORKING_HOURS = {
  mondayToThursday: { start: { hour: 7, minute: 10 }, end: { hour: 16, minute: 50 } },
  friday: { start: { hour: 7, minute: 10 }, end: { hour: 15, minute: 50 } },
  lunch: { start: { hour: 12, minute: 0 }, end: { hour: 13, minute: 0 } }
};

export const isWorkingDay = (date: Date): boolean => {
  const day = date.getDay();
  return day >= 1 && day <= 5;
};

export const isWorkingHours = (date: Date): boolean => {
  const day = date.getDay();
  const hour = date.getHours();
  const minute = date.getMinutes();
  
  if (day === 5) {
    return hour >= 7 && (hour < 15 || (hour === 15 && minute <= 50));
  } else if (day >= 1 && day <= 4) {
    return hour >= 7 && (hour < 16 || (hour === 16 && minute <= 50));
  }
  return false;
};

export const adjustToWorkingHours = (date: Date): Date => {
  const workingDate = new Date(date);
  
  if (workingDate.getDay() === 0) {
    workingDate.setDate(workingDate.getDate() + 1);
  } else if (workingDate.getDay() === 6) {
    workingDate.setDate(workingDate.getDate() + 2);
  }
  
  const day = workingDate.getDay();
  const hour = workingDate.getHours();
  const minute = workingDate.getMinutes();
  
  if (day === 5) {
    if (hour < 7 || (hour === 7 && minute < 10)) {
      workingDate.setHours(7, 10, 0, 0);
    } else if (hour > 15 || (hour === 15 && minute > 50)) {
      workingDate.setDate(workingDate.getDate() + 3);
      workingDate.setHours(7, 10, 0, 0);
    }
  } else if (day >= 1 && day <= 4) {
    if (hour < 7 || (hour === 7 && minute < 10)) {
      workingDate.setHours(7, 10, 0, 0);
    } else if (hour > 16 || (hour === 16 && minute > 50)) {
      workingDate.setDate(workingDate.getDate() + 1);
      workingDate.setHours(7, 10, 0, 0);
      if (workingDate.getDay() === 6) {
        workingDate.setDate(workingDate.getDate() + 2);
      }
    }
  }
  
  return workingDate;
};

export const calculateEndTimeWithLunch = (startTime: Date, durationMinutes: number): Date => {
  let currentTime = new Date(startTime);
  let remainingMinutes = durationMinutes;
  
  while (remainingMinutes > 0) {
    const day = currentTime.getDay();
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    
    if (day === 0 || day === 6) {
      const daysToAdd = day === 0 ? 1 : 2;
      currentTime.setDate(currentTime.getDate() + daysToAdd);
      currentTime.setHours(7, 10, 0, 0);
      continue;
    }
    
    const workStart = 7 * 60 + 10;
    const lunchStart = 12 * 60;
    const lunchEnd = 13 * 60;
    const workEnd = day === 5 ? (15 * 60 + 50) : (16 * 60 + 50);
    const currentMinutes = hour * 60 + minute;
    
    if (currentMinutes < workStart) {
      currentTime.setHours(7, 10, 0, 0);
      continue;
    }
    
    if (currentMinutes >= workEnd) {
      currentTime.setDate(currentTime.getDate() + 1);
      currentTime.setHours(7, 10, 0, 0);
      continue;
    }
    
    if (currentMinutes >= lunchStart && currentMinutes < lunchEnd) {
      currentTime.setHours(13, 0, 0, 0);
      continue;
    }
    
    let availableMinutes: number;
    if (currentMinutes < lunchStart) {
      availableMinutes = lunchStart - currentMinutes;
    } else {
      availableMinutes = workEnd - currentMinutes;
    }
    
    const workTime = Math.min(availableMinutes, remainingMinutes);
    currentTime.setTime(currentTime.getTime() + workTime * 60000);
    remainingMinutes -= workTime;
    
    if (remainingMinutes > 0 && currentTime.getHours() === 12) {
      currentTime.setHours(13, 0, 0, 0);
    }
    
    if (remainingMinutes > 0 && currentTime.getHours() * 60 + currentTime.getMinutes() >= workEnd) {
      currentTime.setDate(currentTime.getDate() + 1);
      currentTime.setHours(7, 10, 0, 0);
    }
  }
  
  return currentTime;
};

// ============================================
// FORMATTING UTILITIES
// ============================================

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Não definido';
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

export const formatTimeShort = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// ============================================
// CALCULATION UTILITIES
// ============================================

export const calculateDaysRemaining = (deadline: string): number => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getDeadlineStatus = (deadline: string): 'overdue' | 'urgent' | 'warning' | 'normal' => {
  const daysLeft = calculateDaysRemaining(deadline);
  
  if (daysLeft <= 0) return 'overdue';
  if (daysLeft <= 2) return 'urgent';
  if (daysLeft <= 7) return 'warning';
  return 'normal';
};

export const calculateProgress = (processStages: ProcessStage[]): number => {
  if (!processStages || processStages.length === 0) return 0;
  const completed = processStages.filter(stage => stage.status === 'completed').length;
  return Math.round((completed / processStages.length) * 100);
};

export const calculateContainerStatus = (processStages: ProcessStage[]): 'pending' | 'in_progress' | 'completed' | 'cancelled' => {
  if (!processStages || processStages.length === 0) return 'pending';
  
  const hasInProgress = processStages.some(s => s.status === 'in_progress');
  const hasPending = processStages.some(s => s.status === 'pending' || s.status === 'scheduled');
  const allCompleted = processStages.every(s => s.status === 'completed');
  const allCancelled = processStages.every(s => s.status === 'cancelled');
  
  if (allCompleted) return 'completed';
  if (hasInProgress) return 'in_progress';
  if (hasPending) return 'pending';
  if (allCancelled) return 'cancelled';
  return 'pending';
};

export const getRemainingTime = (stage: ProcessStage, process: Process): string => {
  if (!stage.actualStartTime) return '--:--';
  const start = new Date(stage.actualStartTime);
  const now = new Date();
  const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
  const total = stage.estimatedDuration || process.averageTimeMinutes;
  const remaining = Math.max(0, total - elapsed);
  const hours = Math.floor(remaining / 60);
  const minutes = remaining % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const getElapsedPercentage = (stage: ProcessStage, process: Process): number => {
  if (!stage.actualStartTime) return 0;
  const start = new Date(stage.actualStartTime);
  const now = new Date();
  const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
  const total = stage.estimatedDuration || process.averageTimeMinutes;
  return Math.min(100, Math.round((elapsed / total) * 100));
};

// ============================================
// DEADLINE ADJUSTMENT
// ============================================

export const adjustDeadlineToBusinessHours = (dateTimeValue: string): string => {
  const date = new Date(dateTimeValue);
  const dayOfWeek = date.getDay();
  const currentHour = date.getHours();
  
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    const daysToAdd = dayOfWeek === 0 ? 1 : 2;
    date.setDate(date.getDate() + daysToAdd);
    date.setHours(17, 0, 0, 0);
  } else if (currentHour >= 17 || currentHour < 7) {
    date.setHours(17, 0, 0, 0);
  }
  
  return date.toISOString().slice(0, 16);
};
