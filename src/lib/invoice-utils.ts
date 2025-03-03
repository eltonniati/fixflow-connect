
import { Invoice, InvoiceLineItem, InvoiceTax } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import { Json } from "@/integrations/supabase/types";

/**
 * Maps a database invoice record to the frontend Invoice model
 */
export const mapDatabaseInvoiceToInvoice = (dbInvoice: any): Invoice => {
  return {
    id: dbInvoice.id,
    invoice_number: dbInvoice.invoice_number || `INV-${dbInvoice.id.substring(0, 8)}`,
    job_id: dbInvoice.job_id,
    bill_description: dbInvoice.bill_description,
    status: dbInvoice.invoice_data?.status || "Draft",
    issue_date: dbInvoice.invoice_data?.issue_date || new Date().toISOString().split('T')[0],
    due_date: dbInvoice.invoice_data?.due_date || new Date().toISOString().split('T')[0],
    line_items: dbInvoice.invoice_data?.line_items || [],
    taxes: dbInvoice.invoice_data?.taxes || [],
    subtotal: dbInvoice.invoice_data?.subtotal || dbInvoice.bill_amount || 0,
    tax_total: dbInvoice.invoice_data?.tax_total || 0,
    bill_amount: dbInvoice.bill_amount || 0,
    total: dbInvoice.total || 0,
    notes: dbInvoice.invoice_data?.notes || "",
    terms: dbInvoice.invoice_data?.terms || "",
    created_at: dbInvoice.created_at
  };
};

/**
 * Calculates invoice totals based on line items and taxes
 */
export const calculateInvoiceTotals = (lineItems: InvoiceLineItem[], taxes: InvoiceTax[]) => {
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

/**
 * Creates a new line item
 */
export const createLineItem = (description: string, quantity: number, unitPrice: number): InvoiceLineItem => {
  return {
    id: uuidv4(),
    description,
    quantity,
    unit_price: unitPrice,
    amount: quantity * unitPrice
  };
};

/**
 * Creates a new tax item
 */
export const createTaxItem = (name: string, rate: number, subtotal: number): InvoiceTax => {
  return {
    name,
    rate,
    amount: subtotal * (rate / 100)
  };
};

/**
 * Prepares invoice data for Supabase insert/update
 * Converts complex objects to JSON compatible format for Supabase
 */
export const prepareInvoiceForDatabase = (invoice: Partial<Invoice>) => {
  // First, create a properly structured JSON object
  // that conforms to the Json type from Supabase
  const invoiceData = {
    status: invoice.status,
    issue_date: invoice.issue_date,
    due_date: invoice.due_date,
    line_items: invoice.line_items ? JSON.parse(JSON.stringify(invoice.line_items)) : [],
    taxes: invoice.taxes ? JSON.parse(JSON.stringify(invoice.taxes)) : [],
    subtotal: invoice.subtotal,
    tax_total: invoice.tax_total,
    notes: invoice.notes || "",
    terms: invoice.terms || ""
  };

  return {
    job_id: invoice.job_id,
    bill_description: invoice.bill_description,
    bill_amount: invoice.bill_amount || invoice.subtotal,
    total: invoice.total,
    invoice_number: invoice.invoice_number,
    invoice_data: invoiceData as Json
  };
};
