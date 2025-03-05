
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useJobs } from "@/hooks/use-jobs";
import { useCompany } from "@/hooks/use-company";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon, PlusCircle, ClipboardList, Settings, ShoppingBag, Clock, CheckCircle } from "lucide-react";
import SignOutButton from "@/components/auth/SignOutButton";

export default function Dashboard() {
  const { session } = useAuth();
  const { jobs, loading: jobsLoading } = useJobs();
  const { company, loading: companyLoading } = useCompany();
  const [jobsByStatus, setJobsByStatus] = useState<{ [key: string]: number }>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!jobsLoading && jobs) {
      const statusCounts: { [key: string]: number } = {
        "In Progress": 0,
        "Finished": 0,
        "Waiting for Parts": 0,
      };

      jobs.forEach((job) => {
        if (statusCounts[job.details.status] !== undefined) {
          statusCounts[job.details.status]++;
        }
      });

      setJobsByStatus(statusCounts);
    }
  }, [jobs, jobsLoading]);

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "In Progress":
        return <Clock className="h-4 w-4" />;
      case "Finished":
        return <CheckCircle className="h-4 w-4" />;
      case "Waiting for Parts":
        return <ShoppingBag className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const isLoading = jobsLoading || companyLoading;

  const recentJobs = jobs.slice(0, 5);

  if (!session) {
    navigate("/");
    return null;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome {company?.name ? `to ${company.name}` : "back"}
          </p>
        </div>
        <div className="flex gap-4">
          {!company && (
            <Button 
              onClick={() => navigate("/company-profile")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Setup Company
            </Button>
          )}
          <Button 
            onClick={() => navigate("/job-cards")}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            New Job
          </Button>
          <SignOutButton />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{jobs.length}</div>
            </CardContent>
          </Card>
          
          {Object.entries(jobsByStatus).map(([status, count]) => (
            <Card key={status}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    <span>{status}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{count}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Recent Jobs</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate("/job-cards")}
                  className="text-gray-500 hover:text-gray-900"
                >
                  View all
                </Button>
              </div>
              <CardDescription>
                Your 5 most recent job cards
              </CardDescription>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-md"></div>
                  ))}
                </div>
              ) : recentJobs.length > 0 ? (
                <div className="space-y-4">
                  {recentJobs.map((job) => (
                    <div 
                      key={job.id} 
                      className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/job-cards/${job.id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900">
                            {job.job_card_number}
                          </span>
                          <Badge className={`${getStatusColor(job.details.status)}`}>
                            {job.details.status}
                          </Badge>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {job.customer.name} • {job.device.name} {job.device.model}
                        </div>
                      </div>
                      <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">No jobs yet</h3>
                  <p className="text-gray-500 mt-1">
                    Create your first job card to get started
                  </p>
                  <Button 
                    onClick={() => navigate("/job-cards")}
                    className="mt-4"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Job
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Company Info</CardTitle>
              <CardDescription>
                Your business details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {companyLoading ? (
                <div className="space-y-4">
                  <div className="h-8 bg-gray-100 animate-pulse rounded-md"></div>
                  <div className="h-8 bg-gray-100 animate-pulse rounded-md"></div>
                </div>
              ) : company ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Company Name</h3>
                    <p className="text-gray-900">{company.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Address</h3>
                    <p className="text-gray-900">{company.address}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Contact</h3>
                    <p className="text-gray-900">{company.phone}</p>
                    <p className="text-gray-900">{company.email}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Settings className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-gray-900 font-medium">Setup your company</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    Add your business details to get started
                  </p>
                  <Button 
                    onClick={() => navigate("/company-profile")}
                    className="mt-4"
                    variant="outline"
                  >
                    Setup now
                  </Button>
                </div>
              )}
            </CardContent>
            {company && (
              <CardFooter>
                <Button 
                  onClick={() => navigate("/company-profile")}
                  variant="outline"
                  className="w-full"
                >
                  Edit details
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
