
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Invoice } from "@/lib/types";
import { calculateInvoiceTotals, prepareInvoiceForDatabase } from "@/lib/invoice-utils";

export function useInvoiceUpdater() {
  const [loading, setLoading] = useState(false);

  const updateInvoice = async (id: string, updates: Partial<Invoice>, currentInvoice: Invoice): Promise<Invoice | null> => {
    try {
      setLoading(true);

      let updatedInvoice: Invoice = {
        ...currentInvoice,
        ...updates
      };
      
      // Recalculate totals if line items or taxes were updated
      if (updates.line_items || updates.taxes || updates.charge_vat !== undefined) {
        const { subtotal, tax_total, total, taxes } = calculateInvoiceTotals(
          updatedInvoice.line_items,
          updatedInvoice.taxes
        );
        
        updatedInvoice = {
          ...updatedInvoice,
          subtotal,
          tax_total,
          bill_amount: subtotal,
          total,
          taxes
        };
      }

      // Prepare the data for Supabase with JSON formatting
      const invoiceData = prepareInvoiceForDatabase(updatedInvoice);

      // Update the database record
      const { error } = await supabase
        .from("invoices")
        .update(invoiceData)
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Invoice updated successfully");
      return updatedInvoice;
    } catch (error: any) {
      console.error("Error updating invoice:", error);
      toast.error(error.message || "Failed to update invoice");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateInvoice,
    loading
  };
}
