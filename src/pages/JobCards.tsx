
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Job, JobStatus } from "@/lib/types";
import { 
  PlusCircle, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Printer,
  Trash2
} from "lucide-react";

const JobCards = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "All">("All");

  // Simulate loading fake data
  useEffect(() => {
    // Mock data
    const mockJobs: Job[] = Array.from({ length: 10 }, (_, i) => {
      const id = String(i + 1);
      const statuses: JobStatus[] = ["In Progress", "Finished", "Waiting for Parts"];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      return {
        id,
        job_card_number: `JC-000${id}`,
        customer: {
          name: ["Thandi Mokoena", "Sipho Nkosi", "Lerato Khumalo", "John Smith", "Maria Naidoo"][i % 5],
          phone: `07${Math.floor(Math.random() * 10)}-${Math.floor(Math.random() * 1000)}-${Math.floor(Math.random() * 10000)}`,
          email: `customer${i}@example.com`
        },
        device: {
          name: ["iPhone 12", "Samsung TV", "HP Laptop", "Dell Monitor", "Sony PlayStation"][i % 5],
          model: `Model-${Math.floor(Math.random() * 1000)}`,
          condition: "Good condition with minor issues"
        },
        details: {
          problem: ["Screen repair", "Power issue", "Software update", "Hardware replacement", "Diagnostic check"][i % 5],
          status: randomStatus,
          handling_fees: Math.floor(Math.random() * 300) + 100
        },
        created_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    setTimeout(() => {
      setJobs(mockJobs);
      setLoading(false);
    }, 800);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value as JobStatus | "All");
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.job_card_number?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      job.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.device.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || job.details.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handlePrintJobCard = (jobId: string) => {
    // Simulate printing
    console.log(`Printing job card: ${jobId}`);
    // In a real app, this would generate and open a PDF
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case "In Progress":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "Finished":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Waiting for Parts":
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Header
          title="Job Cards"
          description="Manage and track your repair job cards"
          rightContent={
            <Button 
              onClick={() => navigate("/job-cards/new")}
              className="bg-fixflow-500 hover:bg-fixflow-600"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              New Job Card
            </Button>
          }
        />
        
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by job number or customer name..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              <div className="w-full md:w-60">
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Waiting for Parts">Waiting for Parts</SelectItem>
                    <SelectItem value="Finished">Finished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Job Card</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Problem</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fixflow-500"></div>
                      </div>
                      <p className="mt-2">Loading job cards...</p>
                    </td>
                  </tr>
                ) : filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex justify-center">
                        <FileText className="h-12 w-12 text-gray-400" />
                      </div>
                      <p className="mt-2 text-lg font-semibold">No job cards found</p>
                      <p className="mt-1">Try adjusting your search or filter criteria</p>
                      <Button 
                        className="mt-4 bg-fixflow-500 hover:bg-fixflow-600"
                        onClick={() => {
                          setSearchTerm("");
                          setStatusFilter("All");
                        }}
                      >
                        Clear Filters
                      </Button>
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map(job => (
                    <tr 
                      key={job.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/job-cards/${job.id}`)}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-fixflow-600">
                        {job.job_card_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>{job.customer.name}</div>
                        <div className="text-xs text-gray-500">{job.customer.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>{job.device.name}</div>
                        <div className="text-xs text-gray-500">{job.device.model}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {job.details.problem}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          job.details.status === "In Progress" 
                            ? "bg-amber-100 text-amber-700" 
                            : job.details.status === "Finished" 
                              ? "bg-green-100 text-green-700" 
                              : "bg-blue-100 text-blue-700"
                        }`}>
                          {getStatusIcon(job.details.status)}
                          <span className="ml-1">{job.details.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(job.created_at || '')}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right">
                        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-fixflow-600 hover:text-fixflow-700 hover:bg-fixflow-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintJobCard(job.id as string);
                            }}
                          >
                            <span className="sr-only">Print</span>
                            <Printer className="h-4 w-4" />
                          </Button>
                          {job.details.status === "Finished" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/invoices/new?jobId=${job.id}`);
                              }}
                            >
                              <span className="sr-only">Invoice</span>
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JobCards;
