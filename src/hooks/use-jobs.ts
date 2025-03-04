import { useEffect, useState } from "react";
import { supabase, generateRandomString, getLastFourDigits, getPrefix } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Job, JobStatus } from "@/lib/types";

// Updated helper function for random string generation
export const generateRandomString = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const crypto = window.crypto || (window as any).msCrypto;
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => characters[value % characters.length]).join('');
};

// Modified job card number generator
const generateJobCardNumber = (customerName: string, customerPhone: string): string => {
  const timestamp = Date.now().toString().slice(-6); 
  const namePrefix = getPrefix(customerName);
  const phoneDigits = getLastFourDigits(customerPhone);
  const randomStr = generateRandomString(5); // Increased to 5 characters
  return `${namePrefix}${phoneDigits}-${randomStr}${timestamp}`;
};

// Updated createJob function with enhanced logging
const createJob = async (jobData: Omit<Job, 'id' | 'job_card_number' | 'created_at' | 'updated_at'>) => {
  if (!user) return null;

  let retries = 0;
  const maxRetries = 5;
  let lastGeneratedNumber = '';

  while (retries < maxRetries) {
    try {
      setLoading(true);
      const dbJobData = mapJobToDatabaseJob(jobData, user.id);
      lastGeneratedNumber = dbJobData.job_card_number;

      const { data, error } = await supabase
        .from("jobs")
        .insert(dbJobData)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          console.log(`Collision detected on ${lastGeneratedNumber}, retrying...`);
          retries++;
          continue;
        }
        throw error;
      }

      const formattedJob = mapDatabaseJobToJob(data);
      setJobs(prevJobs => [formattedJob, ...prevJobs]);
      toast.success("Job created successfully");
      return formattedJob;
    } catch (error: any) {
      if (error.code === '23505' && retries < maxRetries) {
        retries++;
        continue;
      }
      
      console.error("Error creating job:", {
        error,
        lastAttemptedNumber: lastGeneratedNumber,
        retries
      });
      toast.error(error.message || "Failed to create job");
      return null;
    } finally {
      setLoading(false);
    }
  }

  console.error("Max retries exceeded:", {
    lastAttemptedNumber: lastGeneratedNumber,
    customerData: jobData.customer
  });
  toast.error("Failed to create job after multiple attempts");
  return null;
};
