
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Edit, Printer, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { useJobs } from "@/hooks/use-jobs";
import { useCompanies } from "@/hooks/use-companies";
import { JobStatus } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from 'react-router-dom';

// Helper function for currency formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-ZA", {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
};

// Printable Job Card Component
const PrintableJobCard = ({ 
  job, 
  customerName, 
  customerPhone, 
  customerEmail, 
  deviceName, 
  deviceModel, 
  deviceCondition, 
  problem,
  handlingFees,
  companyName
}: { 
  job: any, 
  customerName: string,
  customerPhone: string,
  customerEmail: string,
  deviceName: string,
  deviceModel: string,
  deviceCondition: string,
  problem: string,
  handlingFees: number,
  companyName: string
}) => (
  <div className="p-6 bg-white">
    <div className="border-2 border-gray-200 p-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">JOB CARD</h1>
          <p className="text-lg font-medium">#{job?.job_card_number}</p>
        </div>
        <div className="text-right">
          <p><strong>Created Date:</strong> {format(new Date(job?.created_at || new Date()), "MMMM d, yyyy")}</p>
          <p><strong>Status:</strong> {job?.details.status}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-lg font-semibold border-b mb-2">Company</h2>
          <p>{companyName}</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold border-b mb-2">Customer</h2>
          <p>{customerName}</p>
          <p>{customerPhone}</p>
          <p>{customerEmail}</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold border-b mb-2">Device</h2>
        <p><strong>Name:</strong> {deviceName}</p>
        <p><strong>Model:</strong> {deviceModel}</p>
        <p><strong>Condition:</strong> {deviceCondition}</p>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold border-b mb-2">Details</h2>
        <p><strong>Problem:</strong> {problem}</p>
        <p><strong>Handling Fees:</strong> {formatCurrency(handlingFees)}</p>
      </div>

      <div className="mt-6 text-sm text-center border-t pt-2">
        <p>Generated on: {format(new Date(), "MMMM d, yyyy HH:mm")}</p>
      </div>
    </div>
  </div>
);

// Input change handler component to fix TypeScript errors
type InputChangeHandlerProps = {
  value: string;
  onChange: (value: string) => void;
  id: string;
  placeholder?: string;
  type?: string;
};

const TextInput = ({ value, onChange, id, placeholder, type = "text" }: InputChangeHandlerProps) => (
  <Input
    id={id}
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
  />
);

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { job, loading, getJob, updateJob, deleteJob } = useJobs();
  const { companies, fetchCompanies } = useCompanies();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editedProblem, setEditedProblem] = useState("");
  const [editedStatus, setEditedStatus] = useState<JobStatus>("In Progress");
  const [editedHandlingFees, setEditedHandlingFees] = useState(0);
  const [editedCompanyName, setEditedCompanyName] = useState("");
  const [editedCustomerName, setEditedCustomerName] = useState("");
  const [editedCustomerPhone, setEditedCustomerPhone] = useState("");
  const [editedCustomerEmail, setEditedCustomerEmail] = useState("");
  const [editedDeviceName, setEditedDeviceName] = useState("");
  const [editedDeviceModel, setEditedDeviceModel] = useState("");
  const [editedDeviceCondition, setEditedDeviceCondition] = useState("");
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isPrintReady, setIsPrintReady] = useState(false);
  const jobCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      getJob(id);
    }
    fetchCompanies();
  }, [id]);

  useEffect(() => {
    if (job) {
      setEditedProblem(job.details.problem);
      setEditedStatus(job.details.status);
      setEditedHandlingFees(job.details.handling_fees);
      setEditedCompanyName(job.customer.name);
      setEditedCustomerName(job.customer.name);
      setEditedCustomerPhone(job.customer.phone);
      setEditedCustomerEmail(job.customer.email || "");
      setEditedDeviceName(job.device.name);
      setEditedDeviceModel(job.device.model);
      setEditedDeviceCondition(job.device.condition);
    }
  }, [job]);

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
  };

  const handleStatusChange = (status: JobStatus) => {
    setEditedStatus(status);
  };

  const handleSave = async () => {
    if (!job) return;

    const updatedJob = {
      ...job,
      customer: {
        name: editedCustomerName,
        phone: editedCustomerPhone,
        email: editedCustomerEmail,
      },
      device: {
        name: editedDeviceName,
        model: editedDeviceModel,
        condition: editedDeviceCondition,
      },
      details: {
        problem: editedProblem,
        status: editedStatus,
        handling_fees: editedHandlingFees,
      },
    };

    const success = await updateJob(job.id!, updatedJob);

    if (success) {
      toast.success("Job card updated successfully");
      setIsEditMode(false);
    } else {
      toast.error("Failed to update job card");
    }
  };

  const handleDelete = async () => {
    if (!job) return;

    const success = await deleteJob(job.id!);

    if (success) {
      toast.success("Job card deleted successfully");
      navigate("/job-cards");
    } else {
      toast.error("Failed to delete job card");
    }

    setIsDeleteDialogOpen(false);
  };

  const handlePrint = () => {
    setIsPrintDialogOpen(false);
    setIsPrintReady(true);
    
    setTimeout(() => {
      if (jobCardRef.current) {
        handlePrintOrPDF();
      }
    }, 200);
  };

  const handlePrintOrPDF = useReactToPrint({
    documentTitle: `JobCard_${job?.job_card_number || "unknown"}`,
    onAfterPrint: () => {
      setIsPrintReady(false);
    },
  });

  if (loading || !job) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading job card...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <Button variant="ghost" onClick={() => navigate("/job-cards")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Job Cards
      </Button>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Job Card Details */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Job Card #{job.job_card_number}</CardTitle>
              <CardDescription>
                Created on {format(new Date(job.created_at!), "MMMM d, yyyy")}
              </CardDescription>
            </div>
            <div>
              {isEditMode ? (
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleSave}>
                    Save
                  </Button>
                  <Button variant="ghost" onClick={handleEditToggle}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button onClick={handleEditToggle}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Company */}
              <div className="space-y-2">
                <Label htmlFor="company-name">Company</Label>
                {isEditMode ? (
                  <TextInput
                    id="company-name"
                    value={editedCompanyName}
                    onChange={setEditedCompanyName}
                  />
                ) : (
                  <p>{editedCompanyName}</p>
                )}
              </div>

              {/* Customer */}
              <div className="space-y-2">
                <Label htmlFor="customer-name">Customer Name</Label>
                {isEditMode ? (
                  <TextInput
                    id="customer-name"
                    value={editedCustomerName}
                    onChange={setEditedCustomerName}
                  />
                ) : (
                  <p>{editedCustomerName}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Customer Phone */}
              <div className="space-y-2">
                <Label htmlFor="customer-phone">Customer Phone</Label>
                {isEditMode ? (
                  <TextInput
                    id="customer-phone"
                    value={editedCustomerPhone}
                    onChange={setEditedCustomerPhone}
                  />
                ) : (
                  <p>{editedCustomerPhone}</p>
                )}
              </div>

              {/* Customer Email */}
              <div className="space-y-2">
                <Label htmlFor="customer-email">Customer Email</Label>
                {isEditMode ? (
                  <TextInput
                    id="customer-email"
                    type="email"
                    value={editedCustomerEmail}
                    onChange={setEditedCustomerEmail}
                  />
                ) : (
                  <p>{editedCustomerEmail || "N/A"}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Device Name */}
              <div className="space-y-2">
                <Label htmlFor="device-name">Device Name</Label>
                {isEditMode ? (
                  <TextInput
                    id="device-name"
                    value={editedDeviceName}
                    onChange={setEditedDeviceName}
                  />
                ) : (
                  <p>{editedDeviceName}</p>
                )}
              </div>

              {/* Device Model */}
              <div className="space-y-2">
                <Label htmlFor="device-model">Device Model</Label>
                {isEditMode ? (
                  <TextInput
                    id="device-model"
                    value={editedDeviceModel}
                    onChange={setEditedDeviceModel}
                  />
                ) : (
                  <p>{editedDeviceModel}</p>
                )}
              </div>
            </div>

            {/* Device Condition */}
            <div className="space-y-2">
              <Label htmlFor="device-condition">Device Condition</Label>
              {isEditMode ? (
                <TextInput
                  id="device-condition"
                  value={editedDeviceCondition}
                  onChange={setEditedDeviceCondition}
                />
              ) : (
                <p>{editedDeviceCondition}</p>
              )}
            </div>

            {/* Problem Description */}
            <div className="space-y-2">
              <Label htmlFor="problem-description">Problem Description</Label>
              {isEditMode ? (
                <Textarea
                  id="problem-description"
                  value={editedProblem}
                  onChange={(e) => setEditedProblem(e.target.value)}
                />
              ) : (
                <p>{editedProblem}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Job Card Actions */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Job Card Actions</CardTitle>
            <CardDescription>Manage this job card</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              {isEditMode ? (
                <Select value={editedStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Finished">Finished</SelectItem>
                    <SelectItem value="Waiting for Parts">Waiting for Parts</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge>{editedStatus}</Badge>
              )}
            </div>

            {/* Handling Fees */}
            <div>
              <Label htmlFor="handling-fees">Handling Fees</Label>
              {isEditMode ? (
                <Input
                  id="handling-fees"
                  type="number"
                  value={editedHandlingFees}
                  onChange={(e) =>
                    setEditedHandlingFees(Number(e.target.value))
                  }
                />
              ) : (
                <p>{formatCurrency(editedHandlingFees)}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-2">
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={() => setIsPrintDialogOpen(true)}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Job Card
            </Button>
            <Link to={`/invoices/new/${job.id}`} className="w-full">
              <Button className="w-full">
                Create Invoice
              </Button>
            </Link>
            <Button
              className="w-full"
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Job Card
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Job Card</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this job card? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between space-x-2">
            <Button variant="secondary" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print Job Card</DialogTitle>
            <DialogDescription>Print or save this job card as PDF</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setIsPrintDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Printable Job Card (hidden) */}
      <div ref={jobCardRef} className={isPrintReady ? "print-content" : "hidden print-content"}>
        {isPrintReady && (
          <PrintableJobCard 
            job={job}
            customerName={editedCustomerName}
            customerPhone={editedCustomerPhone}
            customerEmail={editedCustomerEmail}
            deviceName={editedDeviceName}
            deviceModel={editedDeviceModel}
            deviceCondition={editedDeviceCondition}
            problem={editedProblem}
            handlingFees={editedHandlingFees}
            companyName={editedCompanyName}
          />
        )}
      </div>
    </div>
  );
};

export default JobDetail;
