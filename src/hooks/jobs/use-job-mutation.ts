
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Job, JobStatus } from "@/lib/types";
import { mapJobToDatabaseJob, mapDatabaseJobToJob, generateUniqueJobCardNumber } from "@/utils/job-utils";

export function useJobMutation() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const createJob = async (jobData: Omit<Job, 'id' | 'job_card_number' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      setLoading(true);

      // Map job data to database format with a unique job card number
      const dbJobData = await mapJobToDatabaseJob(jobData, user.id);

      // Attempt to insert the job
      let { data, error } = await supabase
        .from("jobs")
        .insert(dbJobData)
        .select()
        .single();

      // If there's a duplicate key error, retry with a new job card number
      if (error && error.message.includes('duplicate key value violates unique constraint "jobs_job_card_number_key"')) {
        console.log("Duplicate job card number detected, generating a new one...");
        
        // Generate a new job card number with additional randomness
        const newJobCardNumber = await generateUniqueJobCardNumber(
          jobData.customer.name, 
          jobData.customer.phone
        );
        
        // Retry with the new job card number
        const result = await supabase
          .from("jobs")
          .insert({
            ...dbJobData,
            job_card_number: newJobCardNumber
          })
          .select()
          .single();
        
        if (result.error) throw result.error;
        data = result.data;
      } else if (error) {
        throw error;
      }
      
      const formattedJob = mapDatabaseJobToJob(data);
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

  return { 
    loading, 
    createJob, 
    updateJob, 
    updateJobStatus, 
    deleteJob 
  };
}
