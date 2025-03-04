
import { useJobQuery } from "./use-job-query";
import { useJobMutation } from "./use-job-mutation";
import type { Job, JobStatus } from "@/lib/types";

export function useJobs() {
  const { 
    jobs, 
    job, 
    loading: queryLoading, 
    fetchJobs, 
    getJob,
    setJobs,
    setJob
  } = useJobQuery();

  const { 
    loading: mutationLoading, 
    createJob, 
    updateJob, 
    updateJobStatus, 
    deleteJob 
  } = useJobMutation();

  // Update job in jobs array after mutation
  const handleJobUpdate = (updatedJob: Job) => {
    setJob(updatedJob);
    setJobs(prevJobs => 
      prevJobs.map(j => j.id === updatedJob.id ? updatedJob : j)
    );
    return updatedJob;
  };

  // Override createJob to update jobs state
  const createAndUpdateJob = async (jobData: Omit<Job, 'id' | 'job_card_number' | 'created_at' | 'updated_at'>) => {
    const newJob = await createJob(jobData);
    if (newJob) {
      setJobs(prevJobs => [newJob, ...prevJobs]);
    }
    return newJob;
  };

  // Override updateJob to update jobs state
  const updateAndSyncJob = async (id: string, jobData: Partial<Job>) => {
    const updated = await updateJob(id, jobData);
    if (updated) {
      return handleJobUpdate(updated);
    }
    return null;
  };

  // Override updateJobStatus to update jobs state
  const updateStatusAndSync = async (id: string, status: JobStatus) => {
    const updated = await updateJobStatus(id, status);
    if (updated) {
      return handleJobUpdate(updated);
    }
    return null;
  };

  // Override deleteJob to update jobs state
  const deleteAndSyncJob = async (id: string) => {
    const success = await deleteJob(id);
    if (success) {
      setJobs(prevJobs => prevJobs.filter(job => job.id !== id));
      if (job?.id === id) {
        setJob(null);
      }
    }
    return success;
  };

  return {
    jobs,
    job,
    loading: queryLoading || mutationLoading,
    createJob: createAndUpdateJob,
    updateJob: updateAndSyncJob,
    updateJobStatus: updateStatusAndSync,
    getJob,
    deleteJob: deleteAndSyncJob,
    fetchJobs
  };
}
