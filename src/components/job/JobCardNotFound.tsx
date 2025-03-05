
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface JobCardNotFoundProps {
  onBack: () => void;
}

export const JobCardNotFound = ({ onBack }: JobCardNotFoundProps) => {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Job Cards
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Job Card Not Found</CardTitle>
          <CardDescription>
            The job card you're looking for does not exist or has been deleted.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={onBack}>Return to Job Cards</Button>
        </CardFooter>
      </Card>
    </div>
  );
};
