import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

// Job number generator with user isolation
const generateJobCardNumber = async (userId: string): Promise<string> => {
  try {
    const { data, error } = await supabase.rpc('increment_job_number', { 
      p_user_id: userId 
    });

    if (error || typeof data !== "number") {
      throw new Error(error?.message || "Invalid sequence number");
    }

    const userPrefix = userId.slice(0, 4).toUpperCase();
    return `${userPrefix}-${data.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error("Job Number Generation Failed:", error);
    throw new Error("Failed to generate job number. Please try again.");
  }
};

// Frontend to database mapper with validation
const mapJobToDatabaseJob = async (
  job: Omit<Job, 'id' | 'job_card_number' | 'created_at' | 'updated_at'>,
  userId: string
) => {
  // Validate phone number format
  if (!/^\d{10,}$/.test(job.customer.phone)) {
    throw new Error("Phone number must contain at least 10 digits");
  }

  return {
    customer_name: job.customer.name.substring(0, 50),
    customer_phone: job.customer.phone,
    customer_email: job.customer.email?.substring(0, 100) || null,
    device_name: job.device.name.substring(0, 50),
    device_model: job.device.model.substring(0, 50),
    device_condition: job.device.condition,
    problem: job.details.problem.substring(0, 500),
    status: job.details.status,
    handling_fees: Number(job.details.handling_fees) || 0,
    job_card_number: await generateJobCardNumber(userId),
    user_id: userId
  };
};

export function useJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setJobs([]);
        return;
      }

      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data?.map(mapDatabaseJobToJob) || []);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();

    const channel = supabase
      .channel('jobs-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'jobs',
        filter: `user_id=eq.${user?.id}`
      }, fetchJobs)
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  const createJob = async (jobData: Omit<Job, 'id' | 'job_card_number' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    let retries = 0;
    const maxRetries = 3;
    const errors: string[] = [];

    while (retries <= maxRetries) {
      try {
        setLoading(true);
        const dbJobData = await mapJobToDatabaseJob(jobData, user.id);

        const { data, error } = await supabase
          .from("jobs")
          .insert(dbJobData)
          .select()
          .single();

        if (error) throw error;

        const newJob = mapDatabaseJobToJob(data);
        setJobs(prev => [newJob, ...prev]);
        toast.success("Job created successfully");
        return newJob;
      } catch (err: any) {
        errors.push(err.message);
        retries++;
        
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        console.error("Create Job Failed:", errors);
        toast.error(errors.join("\n") || "Failed to create job");
        return null;
      } finally {
        setLoading(false);
      }
    }
    return null;
  };

  const updateJob = async (id: string, updates: Partial<Job>) => {
    if (!user) return null;

    try {
      setLoading(true);
      const updateData: Record<string, any> = {};

      if (updates.customer) {
        updateData.customer_name = updates.customer.name?.substring(0, 50);
        updateData.customer_phone = updates.customer.phone;
        updateData.customer_email = updates.customer.email?.substring(0, 100) || null;
      }

      if (updates.device) {
        updateData.device_name = updates.device.name?.substring(0, 50);
        updateData.device_model = updates.device.model?.substring(0, 50);
        updateData.device_condition = updates.device.condition;
      }

      if (updates.details) {
        updateData.problem = updates.details.problem?.substring(0, 500);
        updateData.status = updates.details.status;
        updateData.handling_fees = Number(updates.details.handling_fees) || 0;
      }

      const { data, error } = await supabase
        .from("jobs")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      const updatedJob = mapDatabaseJobToJob(data);
      setJobs(prev => prev.map(j => j.id === id ? updatedJob : j));
      toast.success("Job updated successfully");
      return updatedJob;
    } catch (err) {
      console.error("Update Error:", err);
      toast.error(err instanceof Error ? err.message : "Update failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (id: string) => {
    if (!user) return false;

    try {
      setLoading(true);
      
      // Verify ownership first
      const { data: jobData, error: fetchError } = await supabase
        .from("jobs")
        .select("user_id")
        .eq("id", id)
        .single();

      if (fetchError || jobData?.user_id !== user.id) {
        throw new Error("Job not found or unauthorized");
      }

      const { error } = await supabase
        .from("jobs")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setJobs(prev => prev.filter(j => j.id !== id));
      toast.success("Job deleted successfully");
      return true;
    } catch (err) {
      console.error("Delete Error:", err);
      toast.error(err instanceof Error ? err.message : "Deletion failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    jobs,
    loading,
    error,
    createJob,
    updateJob,
    deleteJob,
    fetchJobs
  };
}
