import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ContainerProvider } from "@/contexts/ContainerContext";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import ContainerList from "./pages/ContainerList";
import ContainerForm from "./pages/ContainerForm";
import GanttChart from "./pages/GanttChart";
import FactoryLayout from "./pages/FactoryLayout";
import ProcessesList from "./pages/ProcessesList";
import WorkerManagement from "./pages/WorkerManagement";
import ContainerTypes from "./pages/ContainerTypes";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ContainerProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/containers" element={<ContainerList />} />
              <Route path="/container/new" element={<ContainerForm />} />
              <Route path="/container/:id" element={<ContainerForm />} />
              <Route path="/gantt" element={<GanttChart />} />
              <Route path="/layout" element={<FactoryLayout />} />
              <Route path="/processes" element={<ProcessesList />} />
              <Route path="/workers" element={<WorkerManagement />} />
              <Route path="/container-types" element={<ContainerTypes />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ContainerProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
