
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import CompanyProfile from "./pages/CompanyProfile";
import JobCards from "./pages/JobCards";
import CreateJobCard from "./pages/CreateJobCard";
import JobDetail from "./pages/JobDetail";
import CreateInvoice from "./pages/CreateInvoice";
import InvoiceDetail from "./pages/InvoiceDetail";
import Invoices from "./pages/Invoices";
import NotFound from "./pages/NotFound";
import RequireAuth from "./components/auth/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            } />
            <Route path="/company-profile" element={
              <RequireAuth>
                <CompanyProfile />
              </RequireAuth>
            } />
            <Route path="/job-cards" element={
              <RequireAuth>
                <JobCards />
              </RequireAuth>
            } />
            <Route path="/job-cards/new" element={
              <RequireAuth>
                <CreateJobCard />
              </RequireAuth>
            } />
            <Route path="/job-cards/:id" element={
              <RequireAuth>
                <JobDetail />
              </RequireAuth>
            } />
            <Route path="/invoices" element={
              <RequireAuth>
                <Invoices />
              </RequireAuth>
            } />
            <Route path="/invoices/new/:jobId" element={
              <RequireAuth>
                <CreateInvoice />
              </RequireAuth>
            } />
            <Route path="/invoices/:invoiceId" element={
              <RequireAuth>
                <InvoiceDetail />
              </RequireAuth>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
