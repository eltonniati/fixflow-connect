import { supabase, generateRandomString, getLastFourDigits, getPrefix } from "@/integrations/supabase/client";
import type { Job, JobStatus } from "@/lib/types";

// Map database job to frontend job model
export const mapDatabaseJobToJob = (dbJob: any): Job => {
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

// Generate a unique job card number with increased randomness
export const generateUniqueJobCardNumber = async (customerName: string, customerPhone: string): Promise<string> => {
  try {
    // Generate components for job card number with higher entropy
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp for more uniqueness
    const namePrefix = getPrefix(customerName);
    const phoneDigits = getLastFourDigits(customerPhone);
    const randomStr = generateRandomString(4); // Increase random string length from 3 to 4
    
    // Combine components with a different format to avoid collisions
    const jobCardNumber = `${namePrefix}${phoneDigits}-${randomStr}${timestamp}`;
    
    // Check if this job card number already exists
    const { data } = await supabase
      .from("jobs")
      .select("job_card_number")
      .eq("job_card_number", jobCardNumber)
      .single();
    
    // If it exists, try again with a new random string and timestamp
    if (data) {
      console.log(`Job card number ${jobCardNumber} already exists, generating a new one...`);
      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 50));
      return generateUniqueJobCardNumber(customerName, customerPhone);
    }
    
    return jobCardNumber;
  } catch (error) {
    // If there's an error (like no matching record), the number is unique
    // Add additional randomness for safety in the fallback
    const uniqueSuffix = `${Math.floor(Math.random() * 1000)}-${Date.now().toString().slice(-6)}`;
    return `${getPrefix(customerName)}${getLastFourDigits(customerPhone)}-${generateRandomString(4)}${uniqueSuffix}`;
  }
};

// Map frontend job to database job format
export const mapJobToDatabaseJob = async (
  job: Omit<Job, 'id' | 'job_card_number' | 'created_at' | 'updated_at'>, 
  userId: string
) => {
  // Generate a unique job card number
  const jobCardNumber = await generateUniqueJobCardNumber(job.customer.name, job.customer.phone);
  
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
    job_card_number: jobCardNumber, // Set the generated job card number
    user_id: userId
  };
};
