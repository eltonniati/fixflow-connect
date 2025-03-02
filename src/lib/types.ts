
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
  price?: number; // Added price property
}

export interface Invoice {
  id?: string;
  job_id: string;
  bill_description: string;
  bill_amount: number;
  total: number;
  created_at?: string;
}

export interface User {
  id?: string;
  email: string;
}
