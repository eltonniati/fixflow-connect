import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Job, JobStatus } from "@/lib/types";

// Database to Frontend Model Mapper
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

// Job Number Generator
const getNextJobNumber = async (userId: string): Promise<string> => {
  try {
    const { data, error } = await supabase.rpc('increment_job_number', { 
      p_user_id: userId 
    });

    if (error) {
      console.error("RPC Error:", {
        code: error.code,
        message: error.message,
        details: error.details
      });
      throw new Error("Failed to generate sequence number");
    }

    if (typeof data !== "number") {
      throw new Error("Invalid sequence number received");
    }

    return `JC-${data.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error("Job Number Generation Failed:", error);
    throw new Error("Failed to generate job number. Please try again.");
  }
};

// Frontend to Database Model Mapper
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
  job_card_number: await getNextJobNumber(userId),
  user_id: userId
});

export function useJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);

  // Fetch jobs with explicit table references
  const fetchJobs = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("jobs.user_id", user.id)
        .order("jobs.created_at", { ascending: false });

      if (error) throw error;
      setJobs((data || []).map(mapDatabaseJobToJob));
    } catch (error: any) {
      console.error("Fetch Error:", error);
      toast.error(error.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  // Real-time updates
  useEffect(() => {
    if (!user) return;

    fetchJobs();
    
    const channel = supabase
      .channel('jobs-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'jobs',
        filter: `user_id=eq.${user.id}`
      }, fetchJobs)
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  // Create job with enhanced retry logic
  const createJob = async (jobData: Omit<Job, 'id' | 'job_card_number' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    let retries = 0;
    const maxRetries = 3;
    const errors: Array<{ attempt: number; error: any }> = [];

    while (retries <= maxRetries) {
      try {
        setLoading(true);
        const dbJobData = await mapJobToDatabaseJob(jobData, user.id);

        const { data, error } = await supabase
          .from("jobs")
          .insert(dbJobData)
          .select()
          .single();

        if (error) {
          errors.push({ attempt: retries, error });
          if (error.code === '23505') { // Unique violation
            retries++;
            await new Promise(resolve => setTimeout(resolve, 100));
            continue;
          }
          throw error;
        }

        const newJob = mapDatabaseJobToJob(data);
        setJobs(prev => [newJob, ...prev]);
        toast.success("Job created successfully");
        return newJob;
      } catch (error: any) {
        errors.push({ attempt: retries, error });
        if (retries < maxRetries) {
          retries++;
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        console.error("Create Job Failed:", {
          attempts: retries,
          userId: user.id,
          errors: errors.map(e => ({
            code: e.error.code,
            message: e.error.message
          })),
          jobData
        });

        toast.error("Failed to create job after multiple attempts. Please try again.");
        return null;
      } finally {
        setLoading(false);
      }
    }
    return null;
  };

  // Update job with explicit table references
  const updateJob = async (id: string, jobData: Partial<Job>) => {
    if (!user) return null;

    try {
      setLoading(true);
      const updatePayload: Record<string, any> = {};

      // Customer updates
      if (jobData.customer) {
        updatePayload.customer_name = jobData.customer.name || undefined;
        updatePayload.customer_phone = jobData.customer.phone || undefined;
        updatePayload.customer_email = jobData.customer.email ?? null;
      }

      // Device updates
      if (jobData.device) {
        updatePayload.device_name = jobData.device.name || undefined;
        updatePayload.device_model = jobData.device.model || undefined;
        updatePayload.device_condition = jobData.device.condition || undefined;
      }

      // Detail updates
      if (jobData.details) {
        updatePayload.problem = jobData.details.problem || undefined;
        updatePayload.status = jobData.details.status || undefined;
        if (typeof jobData.details.handling_fees !== 'undefined') {
          updatePayload.handling_fees = jobData.details.handling_fees;
        }
      }

      const { data, error } = await supabase
        .from("jobs")
        .update(updatePayload)
        .eq("jobs.id", id)
        .eq("jobs.user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      const updatedJob = mapDatabaseJobToJob(data);
      setJobs(prev => prev.map(j => j.id === id ? updatedJob : j));
      setJob(updatedJob);
      toast.success("Job updated successfully");
      return updatedJob;
    } catch (error: any) {
      console.error("Update Error:", error);
      toast.error(error.message || "Failed to update job");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete job with explicit table references
  const deleteJob = async (id: string) => {
    if (!user) return false;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("jobs")
        .delete()
        .eq("jobs.id", id)
        .eq("jobs.user_id", user.id);

      if (error) throw error;

      setJobs(prev => prev.filter(j => j.id !== id));
      setJob(null);
      toast.success("Job deleted successfully");
      return true;
    } catch (error: any) {
      console.error("Delete Error:", error);
      toast.error(error.message || "Failed to delete job");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get single job with explicit references
  const getJob = async (id: string) => {
    if (!user) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("jobs.id", id)
        .eq("jobs.user_id", user.id)
        .single();

      if (error) throw error;

      const job = mapDatabaseJobToJob(data);
      setJob(job);
      return job;
    } catch (error: any) {
      console.error("Fetch Error:", error);
      toast.error(error.message || "Failed to fetch job");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Status update shortcut
  const updateJobStatus = async (id: string, status: JobStatus) => {
    return updateJob(id, { 
      details: { 
        status,
        problem: '',
        handling_fees: 0
      } 
    });
  };

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
}
