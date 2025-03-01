

import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useJobs } from "@/hooks/use-jobs";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Printer, CheckCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { JobStatus } from "@/lib/types";

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { jobs, updateJobStatus } = useJobs();
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const jobCardRef = useRef<HTMLDivElement>(null);
  
  // Find the job from the jobs array
  const job = jobs.find(job => job.id === id);
  
  // If the status hasn't been initialized yet, set it from the job
  if (job && !status) {
    setStatus(job.details.status);
  }

  const handlePrint = useReactToPrint({
    content: () => jobCardRef.current,
    documentTitle: `Job Card ${job?.job_card_number}`,
    onAfterPrint: () => toast.success("Job card printed successfully"),
  });

  const handleStatusChange = async (newStatus: JobStatus) => {
    if (!id) return;
    
    setLoading(true);
    setStatus(newStatus);
    
    try {
      await updateJobStatus(id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishAndInvoice = () => {
    if (!id) return;
    
    // First update status to finished
    handleStatusChange("Finished");
    
    // Then navigate to create invoice page (to be implemented)
    toast.success("Job marked as finished");
    toast("Redirecting to invoice creation...", {
      duration: 2000,
      onAutoClose: () => {
        // This would navigate to an invoice creation page in the future
        toast.info("Invoice functionality will be implemented soon");
      }
    });
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Finished":
        return "bg-green-100 text-green-800";
      case "Waiting for Parts":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!job) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/job-cards")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Job Cards
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Job Not Found</CardTitle>
            <CardDescription>
              The job you're looking for does not exist or has been deleted.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/job-cards")}>
              Return to Job Cards
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate("/job-cards")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Job Cards
      </Button>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Job Actions Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Job Actions</CardTitle>
            <CardDescription>Manage this job card</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={status || ""} 
                onValueChange={(value) => handleStatusChange(value as JobStatus)}
                disabled={loading}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Waiting for Parts">Waiting for Parts</SelectItem>
                  <SelectItem value="Finished">Finished</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-2">
            <Button 
              className="w-full" 
              onClick={handlePrint}
              variant="outline"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Job Card
            </Button>
            <Button 
              className="w-full" 
              onClick={handleFinishAndInvoice}
              disabled={job.details.status === "Finished" || loading}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as Finished & Create Invoice
            </Button>
          </CardFooter>
        </Card>

        {/* Job Details Card */}
        <div className="md:col-span-2" ref={jobCardRef}>
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Job Card #{job.job_card_number}</CardTitle>
                <CardDescription>
                  Created on {format(new Date(job.created_at!), "MMMM d, yyyy")}
                </CardDescription>
              </div>
              <Badge className={getStatusColor(job.details.status)}>
                {job.details.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Details */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Customer Details</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-medium">{job.customer.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{job.customer.phone}</p>
                  </div>
                  {job.customer.email && (
                    <div className="sm:col-span-2">
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium">{job.customer.email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Device Details */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Device Details</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">Device</Label>
                    <p className="font-medium">{job.device.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Model</Label>
                    <p className="font-medium">{job.device.model}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-muted-foreground">Condition</Label>
                    <p className="font-medium">{job.device.condition}</p>
                  </div>
                </div>
              </div>

              {/* Problem Details */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Problem Description</h3>
                <p>{job.details.problem}</p>
              </div>

              {/* Fees */}
              <div>
                <Label className="text-muted-foreground">Handling Fees</Label>
                <p className="text-xl font-bold">R{job.details.handling_fees.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
