
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

// Generate a guaranteed unique job card number
export const generateUniqueJobCardNumber = async (customerName: string, customerPhone: string): Promise<string> => {
  try {
    // Generate a timestamp with millisecond precision
    const timestamp = Date.now();
    
    // Create a unique suffix that changes with every millisecond
    const uniqueSuffix = timestamp.toString(36) + Math.random().toString(36).substring(2, 5);
    
    // Get prefix from customer name (first 2 chars or initials)
    const namePrefix = getPrefix(customerName);
    
    // Get last 4 digits of phone
    const phoneDigits = getLastFourDigits(customerPhone);
    
    // Generate a random string for additional uniqueness
    const randomStr = generateRandomString(4);
    
    // Combine all elements to create a unique job card number
    // Format: PREFIX-PHONEDIGITS-RANDOMSTRING-TIMESTAMP
    const jobCardNumber = `${namePrefix}${phoneDigits}-${randomStr}-${uniqueSuffix}`;
    
    // Check if this job card number already exists
    const { data } = await supabase
      .from("jobs")
      .select("job_card_number")
      .eq("job_card_number", jobCardNumber)
      .single();
    
    // This should be extremely unlikely, but if it exists, add more randomness
    if (data) {
      console.log(`Job card number ${jobCardNumber} already exists, generating a new one with more entropy...`);
      // Add a small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      return generateUniqueJobCardNumber(
        customerName + Math.random().toString(36).substring(2, 4), 
        customerPhone
      );
    }
    
    return jobCardNumber;
  } catch (error) {
    // If there's an error (like no matching record), the number is unique
    // In the extremely unlikely case we get here, add a UUID-based fallback
    const fallbackSuffix = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    return `${getPrefix(customerName)}${getLastFourDigits(customerPhone)}-${generateRandomString(6)}-${fallbackSuffix}`;
  }
};

// Map frontend job to database job format
export const mapJobToDatabaseJob = async (
  job: Omit<Job, 'id' | 'job_card_number' | 'created_at' | 'updated_at'>, 
  userId: string
) => {
  // Generate a unique job card number with our improved algorithm
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
