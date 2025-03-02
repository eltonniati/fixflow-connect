
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Job, JobStatus, Customer, Device, JobDetails } from "@/lib/types";

// Helper functions for mapping between database and frontend models
const mapDatabaseJobToJob = (dbJob: any): Job => {
  return {
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
    price: dbJob.handling_fees // Map handling_fees to price for backward compatibility
  };
};

const mapJobToDatabaseJob = (job: Omit<Job, 'id' | 'job_card_number' | 'created_at' | 'updated_at'>, userId: string) => {
  return {
    customer_name: job.customer.name,
    customer_phone: job.customer.phone,
    customer_email: job.customer.email || null,
    device_name: job.device.name,
    device_model: job.device.model,
    device_condition: job.device.condition,
    problem: job.details.problem,
    status: job.details.status,
    handling_fees: job.details.handling_fees,
    job_card_number: '', // Will be set by database trigger
    user_id: userId
  };
};

export function useJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

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

      const formattedJobs = (data || []).map(mapDatabaseJobToJob);
      setJobs(formattedJobs);
    } catch (error: any) {
      console.error("Error fetching jobs:", error);
      toast.error(error.message || "Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();

    // Subscribe to changes in the jobs table
    const setupSubscription = () => {
      if (!user) return null;

      return supabase
        .channel('jobs-channel')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'jobs',
            filter: `user_id=eq.${user.id}`
          }, 
          () => {
            fetchJobs();
          }
        )
        .subscribe();
    };

    const subscription = setupSubscription();

    return () => {
      subscription?.unsubscribe();
    };
  }, [user]);

  const createJob = async (jobData: Omit<Job, 'id' | 'job_card_number' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      setLoading(true);

      const dbJobData = mapJobToDatabaseJob(jobData, user.id);

      const { data, error } = await supabase
        .from("jobs")
        .insert(dbJobData)
        .select()
        .single();

      if (error) throw error;
      
      const formattedJob = mapDatabaseJobToJob(data);
      setJobs(prevJobs => [formattedJob, ...prevJobs]);
      toast.success("Job created successfully");
      return formattedJob;
    } catch (error: any) {
      console.error("Error creating job:", error);
      toast.error(error.message || "Failed to create job");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateJob = async (id: string, jobData: Partial<Job>) => {
    if (!user) return null;

    try {
      setLoading(true);

      // Extract database-compatible values
      const dbJobData: Record<string, any> = {};
      
      if (jobData.customer) {
        if (jobData.customer.name) dbJobData.customer_name = jobData.customer.name;
        if (jobData.customer.phone) dbJobData.customer_phone = jobData.customer.phone;
        if (jobData.customer.email !== undefined) dbJobData.customer_email = jobData.customer.email;
      }
      
      if (jobData.device) {
        if (jobData.device.name) dbJobData.device_name = jobData.device.name;
        if (jobData.device.model) dbJobData.device_model = jobData.device.model;
        if (jobData.device.condition) dbJobData.device_condition = jobData.device.condition;
      }
      
      if (jobData.details) {
        if (jobData.details.problem) dbJobData.problem = jobData.details.problem;
        if (jobData.details.status) dbJobData.status = jobData.details.status;
        if (jobData.details.handling_fees !== undefined) dbJobData.handling_fees = jobData.details.handling_fees;
      }

      const { data, error } = await supabase
        .from("jobs")
        .update(dbJobData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      const formattedJob = mapDatabaseJobToJob(data);
      setJobs(prevJobs => 
        prevJobs.map(job => job.id === id ? formattedJob : job)
      );
      toast.success("Job updated successfully");
      return formattedJob;
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
        problem: '', // These empty values won't be used in the actual update
        handling_fees: 0
      } 
    });
  };

  const getJob = async (id: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      
      return mapDatabaseJobToJob(data);
    } catch (error: any) {
      console.error("Error fetching job:", error);
      toast.error(error.message || "Failed to fetch job");
      return null;
    }
  };

  return { jobs, loading, createJob, updateJob, updateJobStatus, getJob, fetchJobs };
}
