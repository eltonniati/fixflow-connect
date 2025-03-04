// Enhanced getNextJobNumber with better error handling
const getNextJobNumber = async (userId: string): Promise<string> => {
  try {
    const { data, error } = await supabase.rpc('increment_job_number', { 
      p_user_id: userId
    });

    if (error) {
      console.error("RPC Error Details:", {
        code: error.code,
        message: error.message,
        details: error.details
      });
      throw error;
    }

    if (!data && data !== 0) {
      throw new Error("No sequence number returned from database");
    }

    return `JC-${data.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error("Job Number Generation Failed:", {
      userId,
      error: error instanceof Error ? error : new Error(JSON.stringify(error))
    });
    throw new Error("Failed to generate job number. Please try again.");
  }
};

// Modified createJob with enhanced error tracking
const createJob = async (jobData: Omit<Job, 'id' | 'job_card_number' | 'created_at' | 'updated_at'>) => {
  if (!user) return null;

  let retries = 0;
  const maxRetries = 3;
  const errors: Error[] = [];

  while (retries < maxRetries) {
    try {
      setLoading(true);
      const dbJobData = await mapJobToDatabaseJob(jobData, user.id);

      const { data, error } = await supabase
        .from("jobs")
        .insert(dbJobData)
        .select()
        .single();

      if (error) {
        errors.push(error);
        if (error.code === '23505') {
          retries++;
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }
        throw error;
      }

      const newJob = mapDatabaseJobToJob(data);
      setJobs(prev => [newJob, ...prev]);
      toast.success("Job created successfully");
      return newJob;
    } catch (error: any) {
      errors.push(error);
      if (retries < maxRetries) {
        retries++;
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }
      
      console.error("Final Create Job Error:", {
        attempts: retries,
        userId: user.id,
        errors: errors.map(e => e.message),
        jobData
      });
      
      toast.error("Job creation failed. Please check customer details and try again.");
      return null;
    } finally {
      setLoading(false);
    }
  }
  return null;
};
