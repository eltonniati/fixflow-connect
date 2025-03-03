
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Job, Invoice } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import { 
  calculateInvoiceTotals, 
  createLineItem, 
  prepareInvoiceForDatabase 
} from "@/lib/invoice-utils";

export function useInvoiceCreator() {
  const [loading, setLoading] = useState(false);

  const createInvoiceFromJob = async (job: Job): Promise<Invoice | null> => {
    if (!job.id) return null;

    try {
      setLoading(true);

      const lineItems = [
        createLineItem("Handling Fees", 1, job.details.handling_fees)
      ];

      // Default tax (VAT)
      const taxes = [
        {
          name: "VAT",
          rate: 15,
          amount: job.details.handling_fees * 0.15
        }
      ];

      const { subtotal, tax_total, total } = calculateInvoiceTotals(lineItems, taxes);

      // Create a draft invoice
      const today = new Date();
      const dueDate = new Date();
      dueDate.setDate(today.getDate() + 30); // 30 days from now
      
      const newInvoice: Omit<Invoice, 'id' | 'invoice_number'> = {
        job_id: job.id,
        bill_description: `Invoice for job card #${job.job_card_number}`,
        status: "Draft",
        issue_date: today.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        line_items: lineItems,
        taxes: taxes,
        subtotal: subtotal,
        tax_total: tax_total,
        bill_amount: subtotal,
        total: total,
        notes: "",
        terms: "Payment due within 30 days."
      };

      const invoiceData = {
        ...prepareInvoiceForDatabase(newInvoice),
        invoice_number: `INV-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
      };

      // Insert into database with properly prepared data
      const { data, error } = await supabase
        .from("invoices")
        .insert(invoiceData)
        .select()
        .single();

      if (error) throw error;
      
      // Manually construct the full invoice object
      const formattedInvoice: Invoice = {
        ...newInvoice,
        id: data.id,
        invoice_number: data.invoice_number || `INV-${data.id.substring(0, 8)}`,
        created_at: data.created_at
      };
      
      toast.success("Invoice created successfully");
      return formattedInvoice;
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      toast.error(error.message || "Failed to create invoice");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createInvoiceFromJob,
    loading
  };
}
