
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Job, JobStatus } from "@/lib/types";

export function useJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchJobs = async () => {
      try {
        const { data, error } = await supabase
          .from("jobs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setJobs(data || []);
      } catch (error: any) {
        console.error("Error fetching jobs:", error);
        toast.error(error.message || "Failed to fetch jobs");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();

    // Subscribe to changes in the jobs table
    const jobsSubscription = supabase
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

    return () => {
      jobsSubscription.unsubscribe();
    };
  }, [user]);

  const createJob = async (jobData: Omit<Job, 'id' | 'job_card_number' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      setLoading(true);

      const newJob = {
        ...jobData,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from("jobs")
        .insert([newJob])
        .select()
        .single();

      if (error) throw error;
      
      setJobs(prevJobs => [data, ...prevJobs]);
      toast.success("Job created successfully");
      return data;
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

      const { data, error } = await supabase
        .from("jobs")
        .update(jobData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      setJobs(prevJobs => 
        prevJobs.map(job => job.id === id ? data : job)
      );
      toast.success("Job updated successfully");
      return data;
    } catch (error: any) {
      console.error("Error updating job:", error);
      toast.error(error.message || "Failed to update job");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (id: string, status: JobStatus) => {
    return updateJob(id, { details: { status } });
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
      
      return data;
    } catch (error: any) {
      console.error("Error fetching job:", error);
      toast.error(error.message || "Failed to fetch job");
      return null;
    }
  };

  return { jobs, loading, createJob, updateJob, updateJobStatus, getJob };
}
