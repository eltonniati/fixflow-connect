import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Job, JobStatus } from "@/lib/types";

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

// Job number generation
const generateJobCardNumber = async (userId: string): Promise<string> => {
  try {
    const { data, error } = await supabase.rpc('increment_job_number', { 
      p_user_id: userId 
    });

    if (error || typeof data !== "number") {
      throw error || new Error("Invalid sequence number received");
    }

    return `JC-${data.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error("Job Number Generation Failed:", error);
    throw new Error("Failed to generate job number. Please try again.");
  }
};

// Database payload creator with validation
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
      setJobs(data?.map(mapDatabaseJobToJob) || []);
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };
  const deleteJob = async (id: string) => {
  if (!user) return false;

  try {
    setLoading(true);
    
    // First get the job to verify ownership
    const { data: jobData, error: fetchError } = await supabase
      .from("jobs")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || jobData?.user_id !== user.id) {
      throw new Error("Job not found or unauthorized");
    }

    // Then delete
    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", id);

    if (error) throw error;

    setJobs(prev => prev.filter(j => j.id !== id));
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

  const createJob = async (jobData: Omit<Job, 'id' | 'job_card_number' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    let retries = 0;
    const maxRetries = 3;
    const errors: Array<{ attempt: number; error: unknown }> = [];

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
      } catch (error: any) {
        errors.push({ attempt: retries, error });
        
        if (error.code === '23505' && retries < maxRetries) {
          retries++;
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        console.error("Create Job Failed:", {
          attempts: retries,
          error: error.message,
          user: user.id
        });

        const errorMessage = error.message.includes("Phone number") 
          ? "Invalid phone number (10+ digits required)"
          : "Failed to create job after 3 attempts";
        
        toast.error(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    }
    return null;
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
