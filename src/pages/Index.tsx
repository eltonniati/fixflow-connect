
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";

export default function Index() {
  const [activeTab, setActiveTab] = useState("login");
  const { session } = useAuth();
  const navigate = useNavigate();

  // If user is already authenticated, redirect to dashboard
  if (session) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="py-6 bg-white shadow-sm">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">FixFlow Connect</h1>
          <p className="text-gray-600 mt-1">Repair shop management simplified</p>
        </div>
      </header>
      
      <main className="flex-1">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1 space-y-6">
              <h2 className="text-4xl font-bold tracking-tight text-gray-900">
                Streamline your repair shop operations
              </h2>
              <p className="text-xl text-gray-600">
                Track jobs, manage customers, and handle invoices all in one place.
                FixFlow Connect helps you run your repair business efficiently.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Easy job card creation and management
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Customer information tracking
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Simple invoice generation
                </li>
              </ul>
            </div>
            
            <div className="w-full md:w-auto md:min-w-[400px]">
              <Tabs 
                defaultValue="login" 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                  <LoginForm />
                </TabsContent>
                <TabsContent value="register">
                  <RegisterForm />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-gray-100 py-6">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-gray-500 text-center">© 2023 FixFlow Connect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
