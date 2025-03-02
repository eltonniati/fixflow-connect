
export type JobStatus = "In Progress" | "Finished" | "Waiting for Parts";

export interface Company {
  id?: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo_url?: string;
}

export interface Customer {
  name: string;
  phone: string;
  email?: string;
}

export interface Device {
  name: string;
  model: string;
  condition: string;
}

export interface JobDetails {
  problem: string;
  status: JobStatus;
  handling_fees: number;
}

export interface Job {
  id?: string;
  job_card_number?: string;
  customer: Customer;
  device: Device;
  details: JobDetails;
  created_at?: string;
  updated_at?: string;
  price?: number; // This matches handling_fees for backward compatibility
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface InvoiceTax {
  name: string;
  rate: number;
  amount: number;
}

export interface Invoice {
  id?: string;
  invoice_number?: string;
  job_id: string;
  bill_description: string;
  status: "Draft" | "Sent" | "Paid" | "Overdue";
  issue_date: string;
  due_date: string;
  line_items: InvoiceLineItem[];
  taxes: InvoiceTax[];
  subtotal: number;
  tax_total: number;
  bill_amount: number;
  total: number;
  notes?: string;
  terms?: string;
  created_at?: string;
}

export interface DatabaseInvoice {
  id: string;
  job_id: string;
  bill_description: string;
  bill_amount: number;
  total: number;
  created_at: string;
  invoice_number?: string;
  invoice_data?: {
    status: "Draft" | "Sent" | "Paid" | "Overdue";
    issue_date: string;
    due_date: string;
    line_items: InvoiceLineItem[];
    taxes: InvoiceTax[];
    subtotal: number;
    tax_total: number;
    notes?: string;
    terms?: string;
  };
  jobs?: any;
}

export interface User {
  id?: string;
  email: string;
}
