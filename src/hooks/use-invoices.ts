
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DatabaseInvoice, Invoice } from "@/lib/types";
import { toast } from "sonner";
import { mapDatabaseInvoiceToInvoice } from "@/lib/invoice-utils";

export function useInvoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to transform database invoice to frontend model
  const transformInvoice = (dbInvoice: any): Invoice => {
    return mapDatabaseInvoiceToInvoice(dbInvoice);
  };

  const fetchInvoices = useCallback(async () => {
    if (!user) {
      setInvoices([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          jobs:job_id (
            *
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        // Using as unknown as DatabaseInvoice to handle the type conversion
        const formattedInvoices = data.map((item: any) => transformInvoice(item));
        setInvoices(formattedInvoices);
      }
    } catch (error: any) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const deleteInvoice = async (id: string) => {
    if (!user) return false;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      // Update the local state
      setInvoices(prev => prev.filter(invoice => invoice.id !== id));
      toast.success("Invoice deleted successfully");
      return true;
    } catch (error: any) {
      console.error("Error deleting invoice:", error);
      toast.error(error.message || "Failed to delete invoice");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getInvoicesByJobId = async (jobId: string): Promise<Invoice[]> => {
    if (!user) return [];

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        // Using as unknown as DatabaseInvoice to handle the type conversion
        return data.map((item: any) => transformInvoice(item));
      }
      
      return [];
    } catch (error: any) {
      console.error("Error fetching invoices by job ID:", error);
      toast.error("Failed to load invoices for this job");
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    invoices,
    loading,
    fetchInvoices,
    deleteInvoice,
    getInvoicesByJobId
  };
}
