
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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Printer, CheckCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { JobStatus, Job } from "@/lib/types";

// Helper functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-ZA", {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
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

// PrintOptions interface
interface PrintOptions {
  includeCustomer: boolean;
  includeDevice: boolean;
  includeProblem: boolean;
  includeFees: boolean;
  orientation: "portrait" | "landscape";
  customNotes: string;
}

// Printable Job Card component
const PrintableJobCard = ({ 
  job, 
  options 
}: { 
  job: Job; 
  options: PrintOptions;
}) => {
  return (
    <div className={`p-6 ${options.orientation === "landscape" ? "landscape" : ""}`}>
      <div className="border-2 border-black p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">JOB CARD</h1>
            <p className="text-sm">#{job.job_card_number}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">
              Date: {format(new Date(job.created_at!), "MMMM d, yyyy")}
            </p>
            <p className="font-semibold">Status: {job.details.status}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {options.includeCustomer && (
            <div>
              <h2 className="text-lg font-semibold border-b mb-2">Customer Details</h2>
              <p><strong>Name:</strong> {job.customer.name}</p>
              <p><strong>Phone:</strong> {job.customer.phone}</p>
              {job.customer.email && <p><strong>Email:</strong> {job.customer.email}</p>}
            </div>
          )}
          {options.includeDevice && (
            <div>
              <h2 className="text-lg font-semibold border-b mb-2">Device Details</h2>
              <p><strong>Device:</strong> {job.device.name}</p>
              <p><strong>Model:</strong> {job.device.model}</p>
              <p><strong>Condition:</strong> {job.device.condition}</p>
            </div>
          )}
        </div>

        {options.includeProblem && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold border-b mb-2">Problem Description</h2>
            <p>{job.details.problem}</p>
          </div>
        )}

        {options.includeFees && (
          <div className="flex justify-end mb-6">
            <div className="text-right">
              <p className="text-lg font-semibold">Handling Fees</p>
              <p className="text-2xl font-bold">
                {formatCurrency(job.details.handling_fees)}
              </p>
            </div>
          </div>
        )}

        {options.customNotes && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold border-b mb-2">Additional Notes</h2>
            <p>{options.customNotes}</p>
          </div>
        )}

        <div className="mt-6 text-sm text-center border-t pt-2">
          <p>Generated on: {format(new Date(), "MMMM d, yyyy HH:mm")}</p>
        </div>
      </div>
    </div>
  );
};

// Job Actions component
const JobActions = ({ 
  job, 
  onStatusChange, 
  onPrint, 
  onFinish, 
  loading 
}: { 
  job: Job;
  onStatusChange: (status: JobStatus) => void; 
  onPrint: () => void;
  onFinish: () => void;
  loading: boolean;
}) => {
  return (
    <Card className="md:col-span-1">
      <CardHeader>
        <CardTitle>Job Actions</CardTitle>
        <CardDescription>Manage this job card</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={job.details.status}
            onValueChange={(value) => onStatusChange(value as JobStatus)}
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
        <Button className="w-full" variant="outline" onClick={onPrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print Job Card
        </Button>
        <Button
          className="w-full"
          onClick={onFinish}
          disabled={job.details.status === "Finished" || loading}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Mark as Finished & Create Invoice
        </Button>
      </CardFooter>
    </Card>
  );
};

// Job Info component
const JobInfo = ({ job }: { job: Job }) => {
  return (
    <Card className="mb-4 no-print">
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
        <div>
          <h3 className="text-lg font-semibold mb-2">Problem Description</h3>
          <p>{job.details.problem}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">Handling Fees</Label>
          <p className="text-xl font-bold">
            {formatCurrency(job.details.handling_fees)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Print Dialog Component
const PrintDialog = ({ 
  open, 
  onOpenChange, 
  options, 
  setOptions, 
  onPrint, 
  onPDF 
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: PrintOptions;
  setOptions: (options: PrintOptions) => void;
  onPrint: () => void;
  onPDF: () => void;
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Print Options</DialogTitle>
          <DialogDescription>Customize the job card output</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Include Sections</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="customer"
                  checked={options.includeCustomer}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeCustomer: !!checked })
                  }
                />
                <Label htmlFor="customer">Customer Details</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="device"
                  checked={options.includeDevice}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeDevice: !!checked })
                  }
                />
                <Label htmlFor="device">Device Details</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="problem"
                  checked={options.includeProblem}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeProblem: !!checked })
                  }
                />
                <Label htmlFor="problem">Problem Description</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fees"
                  checked={options.includeFees}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeFees: !!checked })
                  }
                />
                <Label htmlFor="fees">Handling Fees</Label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="orientation">Orientation</Label>
            <Select
              value={options.orientation}
              onValueChange={(value) =>
                setOptions({
                  ...options,
                  orientation: value as "portrait" | "landscape",
                })
              }
            >
              <SelectTrigger id="orientation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Portrait</SelectItem>
                <SelectItem value="landscape">Landscape</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Custom Notes</Label>
            <Input
              id="notes"
              value={options.customNotes}
              onChange={(e) =>
                setOptions({ ...options, customNotes: e.target.value })
              }
              placeholder="Additional notes for the job card"
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button onClick={onPrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button 
              onClick={onPDF}
              variant="secondary"
            >
              <FileText className="mr-2 h-4 w-4" />
              Save as PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// NotFound component
const JobNotFound = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <Button variant="ghost" onClick={onBack} className="mb-6">
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
          <Button onClick={onBack}>Return to Job Cards</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

// Main component
export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { jobs, updateJobStatus } = useJobs();
  const [loading, setLoading] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isPrintReady, setIsPrintReady] = useState(false);
  const jobCardRef = useRef<HTMLDivElement>(null);

  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    includeCustomer: true,
    includeDevice: true,
    includeProblem: true,
    includeFees: true,
    orientation: "portrait",
    customNotes: "",
  });

  const job = jobs.find((job) => job.id === id);

  const handlePrintOrPDF = useReactToPrint({
    documentTitle: `Job_Card_${job?.job_card_number || "unknown"}`,
    pageStyle: `
      @page {
        size: A4 ${printOptions.orientation};
        margin: 15mm;
      }
      body {
        -webkit-print-color-adjust: exact;
      }
      .print-content {
        visibility: visible !important;
        position: relative !important;
      }
      .no-print {
        display: none !important;
      }
    `,
    onPrintError: (errorLocation, error) => {
      console.error('Print error:', errorLocation, error);
      toast.error('Printing failed. Please try again.');
    },
    onAfterPrint: () => {
      setIsPrintReady(false);
    },
  });

  const handleStatusChange = async (newStatus: JobStatus) => {
    if (!id) return;
    setLoading(true);
    
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
    handleStatusChange("Finished");
    toast.success("Job marked as finished");
    toast("Redirecting to invoice creation...", {
      duration: 2000,
      onAutoClose: () => {
        toast.info("Invoice functionality coming soon");
      },
    });
  };

  const handlePrintClick = () => {
    setIsPrintDialogOpen(true);
  };

  const executePrint = () => {
    setIsPrintReady(true);
    setTimeout(() => {
      if (jobCardRef.current) {
        handlePrintOrPDF();
      }
    }, 200);
  };

  const handlePrint = () => {
    setIsPrintDialogOpen(false);
    executePrint();
  };

  const handlePDF = () => {
    setIsPrintDialogOpen(false);
    executePrint();
    toast.info("Select 'Save as PDF' in your print dialog");
  };

  if (!job) {
    return <JobNotFound onBack={() => navigate("/job-cards")} />;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <Button variant="ghost" onClick={() => navigate("/job-cards")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Job Cards
      </Button>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Job Actions Card */}
        <JobActions 
          job={job} 
          onStatusChange={handleStatusChange}
          onPrint={handlePrintClick}
          onFinish={handleFinishAndInvoice}
          loading={loading}
        />

        {/* Job Details */}
        <div className="md:col-span-2">
          {/* Visible Card */}
          <JobInfo job={job} />

          {/* Print Dialog */}
          <PrintDialog 
            open={isPrintDialogOpen}
            onOpenChange={setIsPrintDialogOpen}
            options={printOptions}
            setOptions={setPrintOptions}
            onPrint={handlePrint}
            onPDF={handlePDF}
          />

          {/* Printable Content */}
          <div 
            ref={jobCardRef} 
            className={isPrintReady ? "print-content" : "hidden print-content"}
          >
            {isPrintReady && <PrintableJobCard job={job} options={printOptions} />}
          </div>
        </div>
      </div>
    </div>
  );
}
