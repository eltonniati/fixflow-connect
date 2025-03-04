
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Job, JobStatus } from "@/lib/types";
import { mapJobToDatabaseJob, mapDatabaseJobToJob, generateUniqueJobCardNumber } from "@/utils/job-utils";

// Maximum number of retries for job creation
const MAX_RETRIES = 5;

export function useJobMutation() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const createJob = async (jobData: Omit<Job, 'id' | 'job_card_number' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      setLoading(true);
      console.log("Starting job creation process...");

      // Map job data to database format with a unique job card number
      let dbJobData = await mapJobToDatabaseJob(jobData, user.id);
      console.log("Initial job card number generated:", dbJobData.job_card_number);

      // Try to insert with maximum of MAX_RETRIES attempts for duplicate key errors
      let retries = 0;
      let data = null;
      let error = null;
      
      while (retries < MAX_RETRIES) {
        try {
          // Attempt to insert the job
          const result = await supabase
            .from("jobs")
            .insert(dbJobData)
            .select()
            .single();
          
          if (result.error) {
            if (result.error.message.includes('duplicate key value violates unique constraint "jobs_job_card_number_key"')) {
              console.log(`Retry #${retries + 1}: Duplicate job card number detected, generating a new one...`);
              
              // Add a delay before retry to ensure different timestamp
              await new Promise(resolve => setTimeout(resolve, 50 * (retries + 1)));
              
              // Generate a completely new job card number with additional randomness
              // Add a random suffix to the customer name to ensure different prefix generation
              const randomSuffix = Math.random().toString(36).substring(2, 7);
              const newJobCardNumber = await generateUniqueJobCardNumber(
                jobData.customer.name + randomSuffix, 
                jobData.customer.phone + randomSuffix
              );
              
              console.log(`Generated new job card number: ${newJobCardNumber}`);
              
              // Update job data with new job card number
              dbJobData.job_card_number = newJobCardNumber;
              retries++;
            } else {
              // If other error, throw it
              console.error("Supabase error:", result.error);
              throw result.error;
            }
          } else {
            // Success - break out of retry loop
            console.log("Job created successfully!");
            data = result.data;
            break;
          }
        } catch (e: any) {
          console.error("Error during job creation attempt:", e);
          if (!e.message || !e.message.includes('duplicate key value violates unique constraint "jobs_job_card_number_key"') || retries >= MAX_RETRIES - 1) {
            // If it's not a duplicate key error or we've tried too many times, throw
            error = e;
            break;
          }
          retries++;
        }
      }
      
      // Check if we have an error or no data after all retries
      if (error) throw error;
      if (!data) throw new Error("Failed to create job after multiple attempts");
      
      const formattedJob = mapDatabaseJobToJob(data);
      toast.success(`Job created successfully: ${formattedJob.job_card_number}`);
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
