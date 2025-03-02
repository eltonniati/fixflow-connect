
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Invoice, InvoiceLineItem, InvoiceTax, Job } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

// Helper functions for mapping between database and frontend models
const mapDatabaseInvoiceToInvoice = (dbInvoice: any): Invoice => {
  return {
    id: dbInvoice.id,
    invoice_number: dbInvoice.invoice_number,
    job_id: dbInvoice.job_id,
    bill_description: dbInvoice.bill_description,
    status: dbInvoice.status,
    issue_date: dbInvoice.issue_date,
    due_date: dbInvoice.due_date,
    line_items: dbInvoice.line_items || [],
    taxes: dbInvoice.taxes || [],
    subtotal: dbInvoice.subtotal,
    tax_total: dbInvoice.tax_total,
    bill_amount: dbInvoice.bill_amount,
    total: dbInvoice.total,
    notes: dbInvoice.notes,
    terms: dbInvoice.terms,
    created_at: dbInvoice.created_at,
  };
};

const calculateInvoiceTotals = (lineItems: InvoiceLineItem[], taxes: InvoiceTax[]) => {
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  
  // Update tax amounts based on the subtotal
  const updatedTaxes = taxes.map(tax => ({
    ...tax,
    amount: subtotal * (tax.rate / 100)
  }));
  
  const taxTotal = updatedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
  const total = subtotal + taxTotal;
  
  return {
    subtotal,
    tax_total: taxTotal,
    total,
    taxes: updatedTaxes
  };
};

export function useInvoiceDetails() {
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);

  const createInvoiceFromJob = async (job: Job): Promise<Invoice | null> => {
    if (!user || !job.id) return null;

    try {
      setLoading(true);

      const lineItems: InvoiceLineItem[] = [
        {
          id: uuidv4(),
          description: "Handling Fees",
          quantity: 1,
          unit_price: job.details.handling_fees,
          amount: job.details.handling_fees
        }
      ];

      // Default tax (VAT)
      const taxes: InvoiceTax[] = [
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

      const { data, error } = await supabase
        .from("invoices")
        .insert({
          job_id: newInvoice.job_id,
          bill_description: newInvoice.bill_description,
          bill_amount: newInvoice.bill_amount,
          total: newInvoice.total,
          // Store the extended data as JSON
          invoice_data: {
            status: newInvoice.status,
            issue_date: newInvoice.issue_date,
            due_date: newInvoice.due_date,
            line_items: newInvoice.line_items,
            taxes: newInvoice.taxes,
            subtotal: newInvoice.subtotal,
            tax_total: newInvoice.tax_total,
            notes: newInvoice.notes,
            terms: newInvoice.terms
          }
        })
        .select()
        .single();

      if (error) throw error;
      
      const formattedInvoice = {
        ...newInvoice,
        id: data.id,
        invoice_number: data.invoice_number || `INV-${data.id.substring(0, 8)}`,
        created_at: data.created_at
      };
      
      setInvoice(formattedInvoice);
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

  const getInvoice = async (id: string): Promise<Invoice | null> => {
    if (!user) return null;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      if (!data) return null;

      // Merge the basic invoice data with the extended JSON data
      const invoiceData = data.invoice_data || {};
      const formattedInvoice: Invoice = {
        id: data.id,
        invoice_number: data.invoice_number || `INV-${data.id.substring(0, 8)}`,
        job_id: data.job_id,
        bill_description: data.bill_description,
        status: invoiceData.status || "Draft",
        issue_date: invoiceData.issue_date || new Date().toISOString().split('T')[0],
        due_date: invoiceData.due_date || new Date().toISOString().split('T')[0],
        line_items: invoiceData.line_items || [],
        taxes: invoiceData.taxes || [],
        subtotal: invoiceData.subtotal || data.bill_amount || 0,
        tax_total: invoiceData.tax_total || 0,
        bill_amount: data.bill_amount || 0,
        total: data.total || 0,
        notes: invoiceData.notes || "",
        terms: invoiceData.terms || "",
        created_at: data.created_at
      };
      
      setInvoice(formattedInvoice);
      return formattedInvoice;
    } catch (error: any) {
      console.error("Error fetching invoice:", error);
      toast.error(error.message || "Failed to fetch invoice");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>): Promise<Invoice | null> => {
    if (!user) return null;

    try {
      setLoading(true);

      // Get the current invoice to merge with updates
      const currentInvoice = invoice || await getInvoice(id);
      if (!currentInvoice) throw new Error("Invoice not found");

      let updatedInvoice: Invoice = {
        ...currentInvoice,
        ...updates
      };
      
      // Recalculate totals if line items or taxes were updated
      if (updates.line_items || updates.taxes) {
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

      const { data, error } = await supabase
        .from("invoices")
        .update({
          bill_description: updatedInvoice.bill_description,
          bill_amount: updatedInvoice.bill_amount,
          total: updatedInvoice.total,
          invoice_data: {
            status: updatedInvoice.status,
            issue_date: updatedInvoice.issue_date,
            due_date: updatedInvoice.due_date,
            line_items: updatedInvoice.line_items,
            taxes: updatedInvoice.taxes,
            subtotal: updatedInvoice.subtotal,
            tax_total: updatedInvoice.tax_total,
            notes: updatedInvoice.notes,
            terms: updatedInvoice.terms
          }
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      // Update the state with the new invoice data
      setInvoice(updatedInvoice);
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

  const addLineItem = (description: string, quantity: number, unitPrice: number) => {
    if (!invoice) return;

    const newItem: InvoiceLineItem = {
      id: uuidv4(),
      description,
      quantity,
      unit_price: unitPrice,
      amount: quantity * unitPrice
    };

    const updatedLineItems = [...invoice.line_items, newItem];
    const { subtotal, tax_total, total, taxes } = calculateInvoiceTotals(updatedLineItems, invoice.taxes);

    setInvoice({
      ...invoice,
      line_items: updatedLineItems,
      subtotal,
      tax_total,
      bill_amount: subtotal,
      total,
      taxes
    });
  };

  const updateLineItem = (id: string, updates: Partial<InvoiceLineItem>) => {
    if (!invoice) return;

    const updatedLineItems = invoice.line_items.map(item => {
      if (item.id === id) {
        const updatedItem = {
          ...item,
          ...updates
        };
        // Recalculate amount if quantity or unit_price changed
        if (updates.quantity !== undefined || updates.unit_price !== undefined) {
          updatedItem.amount = (updates.quantity ?? item.quantity) * (updates.unit_price ?? item.unit_price);
        }
        return updatedItem;
      }
      return item;
    });

    const { subtotal, tax_total, total, taxes } = calculateInvoiceTotals(updatedLineItems, invoice.taxes);

    setInvoice({
      ...invoice,
      line_items: updatedLineItems,
      subtotal,
      tax_total,
      bill_amount: subtotal,
      total,
      taxes
    });
  };

  const removeLineItem = (id: string) => {
    if (!invoice) return;

    const updatedLineItems = invoice.line_items.filter(item => item.id !== id);
    const { subtotal, tax_total, total, taxes } = calculateInvoiceTotals(updatedLineItems, invoice.taxes);

    setInvoice({
      ...invoice,
      line_items: updatedLineItems,
      subtotal,
      tax_total,
      bill_amount: subtotal,
      total,
      taxes
    });
  };

  const addTax = (name: string, rate: number) => {
    if (!invoice) return;

    const amount = invoice.subtotal * (rate / 100);
    const newTax: InvoiceTax = {
      name,
      rate,
      amount
    };

    const updatedTaxes = [...invoice.taxes, newTax];
    const taxTotal = updatedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
    const total = invoice.subtotal + taxTotal;

    setInvoice({
      ...invoice,
      taxes: updatedTaxes,
      tax_total: taxTotal,
      total
    });
  };

  const updateTax = (index: number, updates: Partial<InvoiceTax>) => {
    if (!invoice) return;

    const updatedTaxes = invoice.taxes.map((tax, i) => {
      if (i === index) {
        const updatedTax = {
          ...tax,
          ...updates
        };
        // Recalculate amount if rate changed
        if (updates.rate !== undefined) {
          updatedTax.amount = invoice.subtotal * (updates.rate / 100);
        }
        return updatedTax;
      }
      return tax;
    });

    const taxTotal = updatedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
    const total = invoice.subtotal + taxTotal;

    setInvoice({
      ...invoice,
      taxes: updatedTaxes,
      tax_total: taxTotal,
      total
    });
  };

  const removeTax = (index: number) => {
    if (!invoice) return;

    const updatedTaxes = invoice.taxes.filter((_, i) => i !== index);
    const taxTotal = updatedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
    const total = invoice.subtotal + taxTotal;

    setInvoice({
      ...invoice,
      taxes: updatedTaxes,
      tax_total: taxTotal,
      total
    });
  };

  const saveInvoice = async (): Promise<Invoice | null> => {
    if (!invoice || !invoice.id) return null;
    return updateInvoice(invoice.id, invoice);
  };

  return {
    invoice,
    loading,
    createInvoiceFromJob,
    getInvoice,
    updateInvoice,
    addLineItem,
    updateLineItem,
    removeLineItem,
    addTax,
    updateTax,
    removeTax,
    saveInvoice,
    setInvoice
  };
}
