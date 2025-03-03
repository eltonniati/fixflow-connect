
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Invoice } from "@/lib/types";
import { mapDatabaseInvoiceToInvoice } from "@/lib/invoice-utils";

export function useInvoiceFetcher() {
  const [loading, setLoading] = useState(false);

  const getInvoice = async (id: string): Promise<Invoice | null> => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      if (!data) return null;

      // Use mapping function
      const formattedInvoice = mapDatabaseInvoiceToInvoice(data);
      
      return formattedInvoice;
    } catch (error: any) {
      console.error("Error fetching invoice:", error);
      toast.error(error.message || "Failed to fetch invoice");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    getInvoice,
    loading
  };
}
