import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useJobs } from "@/hooks/use-jobs";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, PlusCircle, Search, Calendar, Printer } from "lucide-react";
import { format } from "date-fns";
import type { JobStatus } from "@/lib/types";

const PrintableJobCards = ({ jobs }: { jobs: any[] }) => {
  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('en-ZA', {
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

  return (
    <div className="p-4 hidden print:block">
      <div className="grid grid-cols-2 gap-4 print:grid-cols-2">
        {jobs.map((job) => (
          <div key={job.id} className="print-card">
            <h2 className="text-xl font-bold mb-2">Job Card #{job.job_card_number}</h2>
            <div className="space-y-1">
              <p><strong>Customer:</strong> {job.customer.name}</p>
              <p><strong>Device:</strong> {job.device.name} {job.device.model}</p>
              <p><strong>Date:</strong> {format(new Date(job.created_at!), "MMM d, yyyy")}</p>
              <p><strong>Price:</strong> {formatCurrency(job.details.handling_fees)}</p>
              <p><strong>Status:</strong> 
                <Badge className={`${getStatusColor(job.details.status as JobStatus)} ml-2`}>
                  {job.details.status}
                </Badge>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function JobCards() {
  const { jobs, loading } = useJobs();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");
  const componentRef = useRef(null);

  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const handlePrint = useReactToPrint({
    documentTitle: "Job Cards Report",
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
        }
        .print-card {
          break-inside: avoid;
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }
      }
    `,
  });

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      searchTerm === "" ||
      job.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_card_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.device.model.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || job.details.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

  const printJobs = () => {
    if (componentRef.current) {
      handlePrint();
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate("/dashboard")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Cards</h1>
          <p className="text-gray-500">Manage and track all your repair jobs</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/job-cards/new")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Job Card
          </Button>
          <Button 
            onClick={printJobs} 
            variant="outline"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print All
          </Button>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle>Job Search</CardTitle>
          <CardDescription>
            Filter and search through your job cards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by customer, job number or device..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value: JobStatus | "all") => setStatusFilter(value)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Finished">Finished</SelectItem>
                <SelectItem value="Waiting for Parts">Waiting for Parts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Jobs</CardTitle>
          <CardDescription>
            Showing {filteredJobs.length} of {jobs.length} jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-md"></div>
              ))}
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Card #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map((job) => (
                    <TableRow
                      key={job.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/job-cards/${job.id}`)}
                    >
                      <TableCell className="font-medium">{job.job_card_number}</TableCell>
                      <TableCell>{job.customer.name}</TableCell>
                      <TableCell>
                        {job.device.name} {job.device.model}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-2 text-gray-400" />
                          {format(new Date(job.created_at!), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(job.details.handling_fees)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(job.details.status as JobStatus)}>
                          {job.details.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {jobs.length === 0
                  ? "Get started by creating a new job card"
                  : "Try adjusting your search or filter"}
              </p>
              {jobs.length === 0 && (
                <div className="mt-6">
                  <Button onClick={() => navigate("/job-cards/new")}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Job Card
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div style={{ display: "none" }}>
        <div ref={componentRef}>
          <PrintableJobCards jobs={filteredJobs} />
        </div>
      </div>
    </div>
  );
}
