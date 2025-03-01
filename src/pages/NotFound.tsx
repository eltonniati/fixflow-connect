
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 rounded-full bg-fixflow-50 flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="h-12 w-12 text-fixflow-500" />
        </div>
        <h1 className="text-4xl font-bold mb-2 text-gray-900">Page not found</h1>
        <p className="text-xl text-gray-600 mb-6">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="space-y-3">
          <Button 
            className="w-full bg-fixflow-500 hover:bg-fixflow-600" 
            onClick={() => navigate("/")}
          >
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
