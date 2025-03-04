import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Job, JobStatus } from "@/lib/types";

// Helper function to map database job to frontend model
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

// Job number generation with enhanced validation
const generateJobNumber = async (userId: string): Promise<string> => {
  try {
    const { data, error } = await supabase.rpc('increment_job_number', {
      p_user_id: userId
    });

    if (error) {
      console.error("Sequence Error:", error);
      throw new Error("Failed to generate job number sequence");
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

// Database payload creator with validation
const createJobPayload = async (
  jobData: Omit<Job, 'id' | 'job_card_number' | 'created_at' | 'updated_at'>,
  userId: string
) => {
  // Validate required fields
  if (!/^\d{10,}$/.test(jobData.customer.phone)) {
    throw new Error("Phone number must contain at least 10 digits");
  }

  return {
    customer_name: jobData.customer.name.substring(0, 50),
    customer_phone: jobData.customer.phone,
    customer_email: jobData.customer.email?.substring(0, 100) || null,
    device_name: jobData.device.name.substring(0, 50),
    device_model: jobData.device.model.substring(0, 50),
    device_condition: jobData.device.condition,
    problem: jobData.details.problem.substring(0, 500),
    status: jobData.details.status,
    handling_fees: Number(jobData.details.handling_fees) || 0,
    job_card_number: await generateJobNumber(userId),
    user_id: userId
  };
};

export function useJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);

  const fetchJobs = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data?.map(mapDatabaseJobToJob) || []);
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

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

  const createJob = async (jobData: Omit<Job, 'id' | 'job_card_number' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        setLoading(true);
        
        // Validate and create payload
        const dbJobData = await createJobPayload(jobData, user.id);

        // Insert job
        const { data, error } = await supabase
          .from("jobs")
          .insert(dbJobData)
          .select()
          .single();

        if (error) {
          if (error.code === '23505') { // Unique violation
            retries++;
            await new Promise(resolve => setTimeout(resolve, 100));
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
        console.error(`Attempt ${retries + 1} Failed:`, error);
        
        if (retries < maxRetries - 1) {
          retries++;
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        // User-friendly error messages
        const errorMessage = error.message.includes("Phone number") 
          ? "Invalid phone number (must be 10+ digits)"
          : "Failed to create job after multiple attempts";

        toast.error(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    }
    return null;
  };

  // Keep other CRUD operations (updateJob, deleteJob, etc.) the same
  // as in previous implementations
}
