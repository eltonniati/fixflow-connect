
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Invoice, DatabaseInvoice } from "@/lib/types";

// Helper function to map database invoice to frontend model
const mapDatabaseInvoiceToInvoice = (item: DatabaseInvoice): Invoice => {
  return {
    id: item.id,
    invoice_number: item.invoice_number || `INV-${item.id.substring(0, 8)}`,
    job_id: item.job_id,
    bill_description: item.bill_description,
    status: item.invoice_data?.status || "Draft",
    issue_date: item.invoice_data?.issue_date || new Date().toISOString().split('T')[0],
    due_date: item.invoice_data?.due_date || new Date().toISOString().split('T')[0],
    line_items: item.invoice_data?.line_items || [],
    taxes: item.invoice_data?.taxes || [],
    subtotal: item.invoice_data?.subtotal || item.bill_amount || 0,
    tax_total: item.invoice_data?.tax_total || 0,
    bill_amount: item.bill_amount || 0,
    total: item.total || 0,
    notes: item.invoice_data?.notes || "",
    terms: item.invoice_data?.terms || "",
    created_at: item.created_at
  };
};

export function useInvoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, jobs!inner(*)")
        .eq("jobs.user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedInvoices = (data || []).map(item => mapDatabaseInvoiceToInvoice(item as DatabaseInvoice));
      setInvoices(formattedInvoices);
    } catch (error: any) {
      console.error("Error fetching invoices:", error);
      toast.error(error.message || "Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();

    // Subscribe to changes in the invoices table
    const setupSubscription = () => {
      if (!user) return null;

      return supabase
        .channel('invoices-channel')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'invoices'
          }, 
          () => {
            fetchInvoices();
          }
        )
        .subscribe();
    };

    const subscription = setupSubscription();

    return () => {
      subscription?.unsubscribe();
    };
  }, [user]);

  const getInvoice = async (id: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      return mapDatabaseInvoiceToInvoice(data as DatabaseInvoice);
    } catch (error: any) {
      console.error("Error fetching invoice:", error);
      toast.error(error.message || "Failed to fetch invoice");
      return null;
    }
  };

  const getInvoicesForJob = async (jobId: string) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return (data || []).map(item => mapDatabaseInvoiceToInvoice(item as DatabaseInvoice));
    } catch (error: any) {
      console.error("Error fetching invoices for job:", error);
      toast.error(error.message || "Failed to fetch invoices");
      return [];
    }
  };

  return { 
    invoices, 
    loading, 
    fetchInvoices, 
    getInvoice, 
    getInvoicesForJob 
  };
}
