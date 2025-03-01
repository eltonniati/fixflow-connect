
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Job, JobStatus } from "@/lib/types";
import {
  ClipboardList,
  PlusCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  BarChart2
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulate loading fake data
  useEffect(() => {
    // Mock data
    const mockJobs: Job[] = [
      {
        id: "1",
        job_card_number: "JC-0001",
        customer: {
          name: "Thandi Mokoena",
          phone: "082-123-4567",
          email: "thandi@email.com"
        },
        device: {
          name: "iPhone 12",
          model: "A2172",
          condition: "Cracked screen, powers on"
        },
        details: {
          problem: "Replace screen",
          status: "In Progress",
          handling_fees: 200
        },
        created_at: "2023-03-01T08:30:00Z",
        updated_at: "2023-03-01T08:30:00Z"
      },
      {
        id: "2",
        job_card_number: "JC-0002",
        customer: {
          name: "Sipho Nkosi",
          phone: "073-456-7890",
          email: "sipho@email.com"
        },
        device: {
          name: "Samsung TV",
          model: "UE50TU8500",
          condition: "No power"
        },
        details: {
          problem: "Fix power supply",
          status: "Waiting for Parts",
          handling_fees: 150
        },
        created_at: "2023-03-02T10:15:00Z",
        updated_at: "2023-03-02T16:30:00Z"
      },
      {
        id: "3",
        job_card_number: "JC-0003",
        customer: {
          name: "Lerato Khumalo",
          phone: "061-789-0123",
          email: "lerato@email.com"
        },
        device: {
          name: "HP Laptop",
          model: "Pavilion 15",
          condition: "Overheating, slows down"
        },
        details: {
          problem: "Clean fans, replace thermal paste",
          status: "Finished",
          handling_fees: 250
        },
        created_at: "2023-03-03T09:45:00Z",
        updated_at: "2023-03-05T14:20:00Z"
      }
    ];

    setTimeout(() => {
      setJobs(mockJobs);
      setLoading(false);
    }, 800);
  }, []);

  const getJobsByStatus = (status: JobStatus) => {
    return jobs.filter(job => job.details.status === status);
  };

  const jobStatusCounts = {
    inProgress: getJobsByStatus("In Progress").length,
    finished: getJobsByStatus("Finished").length,
    waitingForParts: getJobsByStatus("Waiting for Parts").length
  };

  const totalJobs = jobs.length;
  const totalHandlingFees = jobs.reduce((sum, job) => sum + job.details.handling_fees, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Header
          title="Dashboard"
          description="Overview of your repair business"
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <ClipboardList className="h-8 w-8 text-fixflow-500 mr-4" />
                <div>
                  <div className="text-3xl font-bold text-gray-900">{totalJobs}</div>
                  <p className="text-xs text-gray-500">All time</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-amber-500 mr-4" />
                <div>
                  <div className="text-3xl font-bold text-gray-900">{jobStatusCounts.inProgress}</div>
                  <p className="text-xs text-gray-500">Active jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500 mr-4" />
                <div>
                  <div className="text-3xl font-bold text-gray-900">{jobStatusCounts.finished}</div>
                  <p className="text-xs text-gray-500">Finished jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Handling Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-indigo-500 mr-4" />
                <div>
                  <div className="text-3xl font-bold text-gray-900">R{totalHandlingFees.toFixed(2)}</div>
                  <p className="text-xs text-gray-500">Total collected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-1 lg:col-span-2 hover-lift">
            <CardHeader>
              <CardTitle>Recent Jobs</CardTitle>
              <CardDescription>Your most recent repair jobs</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-pulse text-gray-400">Loading jobs...</div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500">
                      <div className="col-span-3">JOB NUMBER</div>
                      <div className="col-span-3">CUSTOMER</div>
                      <div className="col-span-3">DEVICE</div>
                      <div className="col-span-3">STATUS</div>
                    </div>
                  </div>
                  <div className="divide-y">
                    {jobs.map((job) => (
                      <div 
                        key={job.id} 
                        className="px-4 py-3 grid grid-cols-12 gap-2 items-center text-sm hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/job-cards/${job.id}`)}
                      >
                        <div className="col-span-3 font-medium text-gray-900">{job.job_card_number}</div>
                        <div className="col-span-3 truncate">{job.customer.name}</div>
                        <div className="col-span-3 truncate">{job.device.name}</div>
                        <div className="col-span-3">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            job.details.status === "In Progress" 
                              ? "bg-amber-100 text-amber-700" 
                              : job.details.status === "Finished" 
                                ? "bg-green-100 text-green-700" 
                                : "bg-blue-100 text-blue-700"
                          }`}>
                            <span className={`flex-shrink-0 h-1.5 w-1.5 rounded-full mr-1.5 ${
                              job.details.status === "In Progress" 
                                ? "bg-amber-500" 
                                : job.details.status === "Finished" 
                                  ? "bg-green-500" 
                                  : "bg-blue-500"
                            }`}></span>
                            {job.details.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!loading && jobs.length > 0 && (
                <div className="mt-4 text-center">
                  <Button 
                    variant="outline" 
                    className="text-fixflow-600 hover:text-fixflow-700 border-fixflow-200 hover:border-fixflow-300 hover:bg-fixflow-50"
                    onClick={() => navigate("/job-cards")}
                  >
                    View All Jobs
                  </Button>
                </div>
              )}
              {!loading && jobs.length === 0 && (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <ClipboardList className="h-12 w-12" />
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No jobs</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new job card.</p>
                  <div className="mt-6">
                    <Button
                      onClick={() => navigate("/job-cards/new")}
                      className="bg-fixflow-500 hover:bg-fixflow-600"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      New Job Card
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="col-span-1 hover-lift">
            <CardHeader>
              <CardTitle>Status Breakdown</CardTitle>
              <CardDescription>Current job status distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-pulse text-gray-400">Loading data...</div>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart2 className="h-8 w-8 mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                        <span>In Progress</span>
                      </div>
                      <span className="font-medium">{jobStatusCounts.inProgress}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-amber-500 h-2 rounded-full"
                        style={{
                          width: totalJobs === 0 ? "0%" : `${(jobStatusCounts.inProgress / totalJobs) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                        <span>Waiting for Parts</span>
                      </div>
                      <span className="font-medium">{jobStatusCounts.waitingForParts}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: totalJobs === 0 ? "0%" : `${(jobStatusCounts.waitingForParts / totalJobs) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                        <span>Finished</span>
                      </div>
                      <span className="font-medium">{jobStatusCounts.finished}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: totalJobs === 0 ? "0%" : `${(jobStatusCounts.finished / totalJobs) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
