import { useEffect, useState } from "react";
import { supabase, getLastFourDigits, getPrefix } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Job, JobStatus } from "@/lib/types";

// Cryptographic random string generator
const generateRandomString = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const crypto = window.crypto || (window as any).msCrypto;
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => characters[value % characters.length]).join('');
};

// Job card number generator
const generateJobCardNumber = (customerName: string, customerPhone: string): string => {
  const timestamp = Date.now().toString().slice(-6);
  const namePrefix = getPrefix(customerName);
  const phoneDigits = getLastFourDigits(customerPhone);
  const randomStr = generateRandomString(5);
  return `${namePrefix}${phoneDigits}-${randomStr}${timestamp}`;
};

// Database to frontend model mapper
const mapDatabaseJobToJob = (dbJob: any): Job => ({
  id: dbJob.id,
  job_card_number: dbJob.job_card_number,
  customer: {
    name: dbJob.customer_name,
    phone: dbJob.customer_phone,
    email: dbJob.customer_email || undefined
  },
  device: {
    name: dbJob.device_name,
    model: dbJob.device_model,
    condition: dbJob.device_condition
  },
  details: {
    problem: dbJob.problem,
    status: dbJob.status as JobStatus,
    handling_fees: dbJob.handling_fees
  },
  created_at: dbJob.created_at,
  updated_at: dbJob.updated_at,
  price: dbJob.handling_fees
});

// Frontend to database model mapper
const mapJobToDatabaseJob = async (
  job: Omit<Job, 'id' | 'job_card_number' | 'created_at' | 'updated_at'>, 
  userId: string
) => ({
  customer_name: job.customer.name,
  customer_phone: job.customer.phone,
  customer_email: job.customer.email || null,
  device_name: job.device.name,
  device_model: job.device.model,
  device_condition: job.device.condition,
  problem: job.details.problem,
  status: job.details.status,
  handling_fees: job.details.handling_fees,
  job_card_number: generateJobCardNumber(job.customer.name, job.customer.phone),
  user_id: userId
});

export function useJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);

  const fetchJobs = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs((data || []).map(mapDatabaseJobToJob));
    } catch (error: any) {
      console.error("Error fetching jobs:", error);
      toast.error(error.message || "Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();

    const subscription = supabase
      .channel('jobs-channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'jobs',
          filter: `user_id=eq.${user?.id}`
        }, 
        fetchJobs
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const createJob = async (jobData: Omit<Job, 'id' | 'job_card_number' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    let retries = 0;
    const maxRetries = 5;
    let lastGeneratedNumber = '';

    while (retries < maxRetries) {
      try {
        setLoading(true);
        const dbJobData = await mapJobToDatabaseJob(jobData, user.id);
        lastGeneratedNumber = dbJobData.job_card_number;

        const { data, error } = await supabase
          .from("jobs")
          .insert(dbJobData)
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            retries++;
            continue;
          }
          throw error;
        }

        const formattedJob = mapDatabaseJobToJob(data);
        setJobs(prevJobs => [formattedJob, ...prevJobs]);
        toast.success("Job created successfully");
        return formattedJob;
      } catch (error: any) {
        if (error.code === '23505' && retries < maxRetries) {
          retries++;
          continue;
        }
        
        console.error("Error creating job:", {
          error,
          lastAttemptedNumber: lastGeneratedNumber,
          retries
        });
        toast.error(error.message || "Failed to create job");
        return null;
      } finally {
        setLoading(false);
      }
    }

    toast.error("Failed to create job after multiple attempts");
    return null;
  };

  const updateJob = async (id: string, jobData: Partial<Job>) => {
    if (!user) return null;

    try {
      setLoading(true);
      const dbJobData: Record<string, any> = {};

      if (jobData.customer) {
        if (jobData.customer.name) dbJobData.customer_name = jobData.customer.name;
        if (jobData.customer.phone) dbJobData.customer_phone = jobData.customer.phone;
        dbJobData.customer_email = jobData.customer.email ?? null;
      }

      if (jobData.device) {
        if (jobData.device.name) dbJobData.device_name = jobData.device.name;
        if (jobData.device.model) dbJobData.device_model = jobData.device.model;
        if (jobData.device.condition) dbJobData.device_condition = jobData.device.condition;
      }

      if (jobData.details) {
        if (jobData.details.problem) dbJobData.problem = jobData.details.problem;
        if (jobData.details.status) dbJobData.status = jobData.details.status;
        if (typeof jobData.details.handling_fees !== 'undefined') {
          dbJobData.handling_fees = jobData.details.handling_fees;
        }
      }

      const { data, error } = await supabase
        .from("jobs")
        .update(dbJobData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      
      const updatedJob = mapDatabaseJobToJob(data);
      setJobs(prev => prev.map(j => j.id === id ? updatedJob : j));
      setJob(updatedJob);
      toast.success("Job updated successfully");
      return updatedJob;
    } catch (error: any) {
      console.error("Error updating job:", error);
      toast.error(error.message || "Failed to update job");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (id: string, status: JobStatus) => {
    return updateJob(id, { 
      details: { 
        status,
        problem: '',
        handling_fees: 0
      } 
    });
  };

  const getJob = async (id: string) => {
    if (!user) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      
      const job = mapDatabaseJobToJob(data);
      setJob(job);
      return job;
    } catch (error: any) {
      console.error("Error fetching job:", error);
      toast.error(error.message || "Failed to fetch job");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (id: string) => {
    if (!user) return false;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("jobs")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      
      setJobs(prev => prev.filter(j => j.id !== id));
      setJob(null);
      toast.success("Job deleted successfully");
      return true;
    } catch (error: any) {
      console.error("Error deleting job:", error);
      toast.error(error.message || "Failed to delete job");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Proper closing of useJobs function
  return { 
    jobs, 
    job,
    loading, 
    createJob, 
    updateJob, 
    updateJobStatus, 
    getJob,
    deleteJob,
    fetchJobs
  };
} // Closing brace added here
