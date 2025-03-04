
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useJobs } from "@/hooks/use-jobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import type { Job, JobStatus } from "@/lib/types";

export default function CreateJobCard() {
  const { createJob } = useJobs();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer information
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  // Device information
  const [deviceName, setDeviceName] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [deviceCondition, setDeviceCondition] = useState("");

  // Job details
  const [problem, setProblem] = useState("");
  const [handlingFees, setHandlingFees] = useState<number>(0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!customerName || !customerPhone || !deviceName || !deviceModel || !deviceCondition || !problem) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const newJobData: Omit<Job, 'id' | 'job_card_number' | 'created_at' | 'updated_at'> = {
        customer: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail || undefined
        },
        device: {
          name: deviceName,
          model: deviceModel,
          condition: deviceCondition
        },
        details: {
          problem,
          status: "In Progress" as JobStatus,
          handling_fees: handlingFees
        }
      };

      const result = await createJob(newJobData);
      
      if (result) {
        toast.success(`Job card created successfully: ${result.job_card_number}`);
        navigate("/job-cards");
      } else {
        toast.error("Failed to create job card");
      }
    } catch (error) {
      console.error("Error creating job:", error);
      toast.error("An error occurred while creating the job card");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-5xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate("/job-cards")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Job Cards
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Job Card</h1>
        <p className="text-gray-500">Enter details for the new repair job</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>Enter the customer's contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Name *</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone *</Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Phone number"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email (optional)</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Email address"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Device Information</CardTitle>
              <CardDescription>Enter details about the device being repaired</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deviceName">Device Name *</Label>
                  <Input
                    id="deviceName"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="e.g. iPhone, Samsung TV"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deviceModel">Model *</Label>
                  <Input
                    id="deviceModel"
                    value={deviceModel}
                    onChange={(e) => setDeviceModel(e.target.value)}
                    placeholder="e.g. 13 Pro, QN90B"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deviceCondition">Condition *</Label>
                <Input
                  id="deviceCondition"
                  value={deviceCondition}
                  onChange={(e) => setDeviceCondition(e.target.value)}
                  placeholder="e.g. Good, Fair, Poor"
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Problem Details</CardTitle>
              <CardDescription>Describe the issue with the device</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="problem">Description of Problem *</Label>
                <Textarea
                  id="problem"
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="Describe the issue with the device..."
                  className="min-h-[100px]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="handlingFees">Handling Fees (R)</Label>
                <Input
                  id="handlingFees"
                  type="number"
                  min="0"
                  step="0.01"
                  value={handlingFees}
                  onChange={(e) => setHandlingFees(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  "Creating..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Job Card
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}
