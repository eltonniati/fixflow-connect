
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CardHoverEffect } from "@/components/ui/card-hover-effect";
import AuthForm from "@/components/auth/AuthForm";
import { ClipboardList, FileText, PieChart, Clock } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "Job Card Management",
      description: "Create and manage repair job cards with customer details, device information, and repair status.",
      icon: <ClipboardList className="h-6 w-6 text-fixflow-500" />,
    },
    {
      title: "Invoicing",
      description: "Generate professional invoices in ZAR with handling fees, repair costs, and automatically calculated totals.",
      icon: <FileText className="h-6 w-6 text-fixflow-500" />,
    },
    {
      title: "Progress Tracking",
      description: "Track repair progress from start to finish with status updates and search functionality.",
      icon: <Clock className="h-6 w-6 text-fixflow-500" />,
    },
    {
      title: "Business Insights",
      description: "Get insights into your repair business with reports and analytics to help you make better decisions.",
      icon: <PieChart className="h-6 w-6 text-fixflow-500" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-fixflow-200 to-fixflow-500 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }}></div>
        </div>
        
        <div className="mx-auto max-w-7xl py-8 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-6">
                Streamlined Repair Job Management & Invoicing
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                A complete solution for South African repair businesses to manage repair jobs, track progress, and generate professional invoices in ZAR.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  className="bg-gradient-to-r from-fixflow-500 to-fixflow-600 hover:from-fixflow-600 hover:to-fixflow-700 text-white font-medium py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                  onClick={() => navigate("/dashboard")}
                >
                  Get Started
                </Button>
                <Button 
                  variant="outline"
                  className="border-fixflow-500 text-fixflow-600 hover:bg-fixflow-50"
                >
                  Learn More
                </Button>
              </div>
            </div>
            
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md">
                <AuthForm />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage repair jobs and keep your business running smoothly.
            </p>
          </div>
          
          <CardHoverEffect items={features} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to streamline your repair business?</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Join FixFlow today and start managing your repair jobs more efficiently.
          </p>
          <Button 
            className="bg-gradient-to-r from-fixflow-500 to-fixflow-600 hover:from-fixflow-600 hover:to-fixflow-700 text-white font-medium py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            onClick={() => navigate("/dashboard")}
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} FixFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
