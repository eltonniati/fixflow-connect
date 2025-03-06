
import { useMemo } from "react";
import { Job, Invoice } from "@/lib/types";
import { useJobs } from "./use-jobs";
import { useInvoices } from "./use-invoices";

export function useAnalytics() {
  const { jobs, loading: jobsLoading } = useJobs();
  const { invoices, loading: invoicesLoading } = useInvoices();

  const analytics = useMemo(() => {
    if (jobsLoading || invoicesLoading) {
      return {
        totalRevenue: 0,
        averageJobValue: 0,
        totalJobs: 0,
        completionRate: 0,
        revenueByStatus: {},
        jobCountByMonth: {},
        revenueByMonth: {},
        unpaidInvoices: 0,
        unpaidAmount: 0,
        loading: true
      };
    }

    const totalJobs = jobs.length;
    const finishedJobs = jobs.filter(job => job.details.status === "Finished").length;
    const completionRate = totalJobs > 0 ? (finishedJobs / totalJobs) * 100 : 0;

    // Revenue calculations
    const totalRevenue = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
    const averageJobValue = totalJobs > 0 ? totalRevenue / totalJobs : 0;

    // Revenue by job status
    const revenueByStatus: Record<string, number> = {};
    jobs.forEach(job => {
      const jobInvoices = invoices.filter(invoice => invoice.job_id === job.id);
      const jobRevenue = jobInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
      
      if (!revenueByStatus[job.details.status]) {
        revenueByStatus[job.details.status] = 0;
      }
      revenueByStatus[job.details.status] += jobRevenue;
    });

    // Jobs and revenue by month
    const jobCountByMonth: Record<string, number> = {};
    const revenueByMonth: Record<string, number> = {};

    // Get the last 6 months
    const today = new Date();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(today);
      d.setMonth(d.getMonth() - i);
      return d.toLocaleString('default', { month: 'short', year: '2-digit' });
    }).reverse();

    // Initialize with zeros for all months
    last6Months.forEach(month => {
      jobCountByMonth[month] = 0;
      revenueByMonth[month] = 0;
    });

    // Count jobs by month
    jobs.forEach(job => {
      if (job.created_at) {
        const date = new Date(job.created_at);
        const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        
        if (jobCountByMonth[monthKey] !== undefined) {
          jobCountByMonth[monthKey]++;
        }
      }
    });

    // Calculate revenue by month
    invoices.forEach(invoice => {
      if (invoice.created_at) {
        const date = new Date(invoice.created_at);
        const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        
        if (revenueByMonth[monthKey] !== undefined) {
          revenueByMonth[monthKey] += invoice.total || 0;
        }
      }
    });

    // Unpaid invoices
    const unpaidInvoices = invoices.filter(invoice => 
      invoice.status === "Sent" || invoice.status === "Overdue"
    ).length;
    
    const unpaidAmount = invoices
      .filter(invoice => invoice.status === "Sent" || invoice.status === "Overdue")
      .reduce((sum, invoice) => sum + (invoice.total || 0), 0);

    return {
      totalRevenue,
      averageJobValue,
      totalJobs,
      completionRate,
      revenueByStatus,
      jobCountByMonth,
      revenueByMonth,
      unpaidInvoices,
      unpaidAmount,
      loading: false
    };
  }, [jobs, invoices, jobsLoading, invoicesLoading]);

  return analytics;
}
