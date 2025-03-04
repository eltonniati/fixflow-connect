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

// Atomic Job Number Generator
const generateJobNumber = async (userId: string): Promise<string> => {
  try {
    const { data, error } = await supabase.rpc('increment_job_number', {
      p_user_id: userId
    });

    if (error) {
      console.error("Sequence Error:", {
        code: error.code,
        message: error.message,
        details: error.details
      });
      throw new Error("Failed to generate sequence number");
    }

    if (typeof data !== "number" || data < 0) {
      throw new Error("Invalid sequence number received");
    }

    return `JC-${data.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error("Job Number Generation Failed:", error);
    throw new Error("Failed to generate job number. Please try again.");
  }
};

// Frontend to Database Model Converter
const mapJobToDatabaseJob = async (
  job: Omit<Job, 'id' | 'job_card_number' | 'created_at' | 'updated_at'>,
  userId: string
) => {
  // Validate required fields
  if (!job.customer.phone.match(/^\d{10,}$/)) {
    throw new Error("Invalid phone number format");
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
    handling_fees: job.details.handling_fees,
    job_card_number: await generateJobNumber(userId),
    user_id: userId
  };
};

export function useJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);

  // Fetch jobs with error boundaries
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
      setJobs(data?.map(mapDatabaseJobToJob) || []);
    } catch (error: any) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load jobs. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  // Real-time updates
  useEffect(() => {
    if (!user) return;

    fetchJobs();
    
    const subscription = supabase
      .channel('jobs-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'jobs',
        filter: `user_id=eq.${user.id}`
      }, fetchJobs)
      .subscribe();

    return () => subscription.unsubscribe();
  }, [user]);

  // Robust Job Creation
  const createJob = async (jobData: Omit<Job, 'id' | 'job_card_number' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    let retries = 0;
    const maxRetries = 3;
    let lastGeneratedNumber: string | null = null;

    while (retries < maxRetries) {
      try {
        setLoading(true);
        
        // Generate database payload
        const dbJobData = await mapJobToDatabaseJob(jobData, user.id);
        lastGeneratedNumber = dbJobData.job_card_number;

        // Insert job
        const { data, error } = await supabase
          .from("jobs")
          .insert(dbJobData)
          .select()
          .single();

        if (error) {
          // Handle unique constraint violation
          if (error.code === '23505') {
            console.warn(`Duplicate detected: ${lastGeneratedNumber}`);
            retries++;
            await new Promise(resolve => setTimeout(resolve, 50));
            continue;
          }
          throw error;
        }

        // Update state
        const newJob = mapDatabaseJobToJob(data);
        setJobs(prev => [newJob, ...prev]);
        toast.success("Job created successfully");
        return newJob;

      } catch (error: any) {
        console.error(`Create Job Attempt ${retries + 1} Failed:`, {
          error,
          lastGeneratedNumber,
          user: user.id,
          jobData
        });

        if (retries < maxRetries - 1) {
          retries++;
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        // Final error handling
        const errorMessage = error.message.includes("phone number") 
          ? "Invalid phone number format"
          : "Failed to create job after multiple attempts";

        toast.error(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    }
    return null;
  };

  // Update Job with validation
  const updateJob = async (id: string, updates: Partial<Job>) => {
    if (!user) return null;

    try {
      setLoading(true);
      const updateData: Record<string, any> = {};

      // Validate and prepare update data
      if (updates.customer) {
        if (updates.customer.name) updateData.customer_name = updates.customer.name.substring(0, 50);
        if (updates.customer.phone) {
          if (!updates.customer.phone.match(/^\d{10,}$/)) {
            throw new Error("Invalid phone number format");
          }
          updateData.customer_phone = updates.customer.phone;
        }
        updateData.customer_email = updates.customer.email?.substring(0, 100) || null;
      }

      if (updates.device) {
        if (updates.device.name) updateData.device_name = updates.device.name.substring(0, 50);
        if (updates.device.model) updateData.device_model = updates.device.model.substring(0, 50);
        if (updates.device.condition) updateData.device_condition = updates.device.condition;
      }

      if (updates.details) {
        if (updates.details.problem) updateData.problem = updates.details.problem.substring(0, 500);
        if (updates.details.status) updateData.status = updates.details.status;
        if (typeof updates.details.handling_fees !== 'undefined') {
          updateData.handling_fees = updates.details.handling_fees;
        }
      }

      // Perform update
      const { data, error } = await supabase
        .from("jobs")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      // Update state
      const updatedJob = mapDatabaseJobToJob(data);
      setJobs(prev => prev.map(j => j.id === id ? updatedJob : j));
      setJob(updatedJob);
      toast.success("Job updated successfully");
      return updatedJob;

    } catch (error: any) {
      console.error("Update Error:", error);
      toast.error(error.message.includes("phone number") 
        ? "Invalid phone number format" 
        : "Failed to update job"
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete Job with confirmation
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
      console.error("Delete Error:", error);
      toast.error("Failed to delete job. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get single job with cache
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
      console.error("Fetch Error:", error);
      toast.error("Job not found. It may have been deleted.");
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
