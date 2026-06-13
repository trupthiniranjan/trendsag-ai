import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import CommentsPage from "./pages/dashboard/CommentsPage.tsx";
import InsightsPage from "./pages/dashboard/InsightsPage.tsx";
import ChatPage from "./pages/dashboard/ChatPage.tsx";
import VoicePage from "./pages/dashboard/VoicePage.tsx";
import SourcesPage from "./pages/dashboard/SourcesPage.tsx";
import SettingsPage from "./pages/dashboard/SettingsPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { DashboardLayout } from "./components/dashboard/DashboardLayout.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="comments" element={<CommentsPage />} />
            <Route path="insights" element={<InsightsPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="voice" element={<VoicePage />} />
            <Route path="sources" element={<SourcesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
