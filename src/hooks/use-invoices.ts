
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Invoice } from "@/lib/types";

export function useInvoices(jobId?: string) {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchInvoices = async () => {
      try {
        let query = supabase
          .from("invoices")
          .select(`
            *,
            jobs!inner (
              id,
              job_card_number,
              user_id
            )
          `)
          .eq("jobs.user_id", user.id);

        if (jobId) {
          query = query.eq("job_id", jobId);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) throw error;

        setInvoices(data || []);
      } catch (error: any) {
        console.error("Error fetching invoices:", error);
        toast.error(error.message || "Failed to fetch invoices");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [user, jobId]);

  const createInvoice = async (invoiceData: Omit<Invoice, 'id' | 'created_at'>) => {
    if (!user) return null;

    try {
      setLoading(true);

      // First verify that the job belongs to the current user
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("user_id")
        .eq("id", invoiceData.job_id)
        .single();

      if (jobError) throw jobError;
      
      if (jobData.user_id !== user.id) {
        throw new Error("You don't have permission to create an invoice for this job");
      }

      const { data, error } = await supabase
        .from("invoices")
        .insert([invoiceData])
        .select()
        .single();

      if (error) throw error;
      
      setInvoices(prevInvoices => [data, ...prevInvoices]);
      toast.success("Invoice created successfully");
      return data;
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      toast.error(error.message || "Failed to create invoice");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { invoices, loading, createInvoice };
}
