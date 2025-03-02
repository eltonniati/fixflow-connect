import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useJobs } from "@/hooks/use-jobs";
import { useInvoices } from "@/hooks/use-invoices";
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
import { ArrowLeft, Printer, CheckCircle, FileText, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { JobStatus, Job, Invoice } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

interface PrintOptions {
  includeCustomer: boolean;
  includeDevice: boolean;
  includeProblem: boolean;
  includeFees: boolean;
  orientation: "portrait" | "landscape";
  customNotes: string;
}

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

const JobActions = ({ 
  job, 
  invoices,
  onStatusChange, 
  onPrint, 
  onFinish, 
  onCreateInvoice,
  loading 
}: { 
  job: Job;
  invoices: Invoice[];
  onStatusChange: (status: JobStatus) => void; 
  onPrint: () => void;
  onFinish: () => void;
  onCreateInvoice: () => void;
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
        <Button
          className="w-full"
          variant="secondary"
          onClick={onCreateInvoice}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Invoice
        </Button>
      </CardFooter>
    </Card>
  );
};

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

const JobInvoices = ({ 
  invoices, 
  onViewInvoice 
}: { 
  invoices: Invoice[];
  onViewInvoice: (invoiceId: string) => void;
}) => {
  if (invoices.length === 0) {
    return (
      <Card className="mb-4 no-print">
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>No invoices yet for this job</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No invoices have been created for this job yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "Sent":
        return "bg-blue-100 text-blue-800";
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="mb-4 no-print">
      <CardHeader>
        <CardTitle>Invoices</CardTitle>
        <CardDescription>Invoices created for this job</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow 
                key={invoice.id}
                className="cursor-pointer"
                onClick={() => onViewInvoice(invoice.id!)}
              >
                <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                <TableCell>{format(new Date(invoice.issue_date), "MMM d, yyyy")}</TableCell>
                <TableCell>
                  <Badge className={getInvoiceStatusColor(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewInvoice(invoice.id!);
                    }}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

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

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { jobs, updateJobStatus } = useJobs();
  const { getInvoicesForJob } = useInvoices();
  const [loading, setLoading] = useState(false);
  const [jobInvoices, setJobInvoices] = useState<Invoice[]>([]);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isPrintReady, setIsPrintReady] = useState(false);
  const jobCardRef = useRef<HTMLDivElement>(null);

  const [printOptions, setPrintOptions] = useState({
    includeCustomer: true,
    includeDevice: true,
    includeProblem: true,
    includeFees: true,
    orientation: "portrait" as "portrait" | "landscape",
    customNotes: "",
  });

  const job = jobs.find((job) => job.id === id);

  useEffect(() => {
    const loadInvoices = async () => {
      if (id) {
        const invoices = await getInvoicesForJob(id);
        setJobInvoices(invoices);
      }
    };
    
    loadInvoices();
  }, [id]);

  const handlePrintOrPDF = useReactToPrint({
    content: () => jobCardRef.current,
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
    navigate(`/invoices/new/${id}`);
  };

  const handleCreateInvoice = () => {
    if (!id) return;
    navigate(`/invoices/new/${id}`);
  };

  const handleViewInvoice = (invoiceId: string) => {
    navigate(`/invoices/${invoiceId}`);
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
        <JobActions 
          job={job} 
          invoices={jobInvoices}
          onStatusChange={handleStatusChange}
          onPrint={handlePrintClick}
          onFinish={handleFinishAndInvoice}
          onCreateInvoice={handleCreateInvoice}
          loading={loading}
        />

        <div className="md:col-span-2">
          <JobInfo job={job} />
          <JobInvoices 
            invoices={jobInvoices} 
            onViewInvoice={handleViewInvoice} 
          />
          <PrintDialog 
            open={isPrintDialogOpen}
            onOpenChange={setIsPrintDialogOpen}
            options={printOptions}
            setOptions={setPrintOptions}
            onPrint={handlePrint}
            onPDF={handlePDF}
          />
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
