
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Job } from "@/lib/types";
import { mapDatabaseJobToJob } from "@/utils/job-utils";

export function useJobQuery() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [job, setJob] = useState<Job | null>(null);
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
      
      const formattedJob = mapDatabaseJobToJob(data);
      setJob(formattedJob);
      return formattedJob;
    } catch (error: any) {
      console.error("Error fetching job:", error);
      toast.error(error.message || "Failed to fetch job");
      return null;
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

  return { 
    jobs, 
    job,
    loading, 
    fetchJobs,
    getJob,
    setJobs,
    setJob
  };
}
