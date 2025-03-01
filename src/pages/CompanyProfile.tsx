
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Company } from "@/lib/types";
import { Save, Upload, Building, User } from "lucide-react";

const CompanyProfile = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock company data - in a real app, this would come from an API
  const [company, setCompany] = useState<Company>({
    name: "Sipho's Tech Fixes",
    address: "45 Main Rd, Johannesburg",
    phone: "011-555-6789",
    email: "sipho@repairshop.co.za",
    logo_url: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompany(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!company.name || !company.address || !company.phone || !company.email) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success("Company profile saved successfully");
      setIsLoading(false);
    }, 1000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.includes('image/')) {
      toast.error("Please upload an image file");
      return;
    }
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }
    
    // In a real app, we would upload this to a server/storage
    // For now, create a temporary URL for the image
    const logoUrl = URL.createObjectURL(file);
    setCompany(prev => ({
      ...prev,
      logo_url: logoUrl
    }));
    
    toast.success("Logo uploaded successfully");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Header
          title="Company Profile"
          description="Manage your company information"
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-1 hover-lift">
            <CardHeader>
              <CardTitle>Logo</CardTitle>
              <CardDescription>Upload your company logo</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center mb-4 overflow-hidden">
                {company.logo_url ? (
                  <img 
                    src={company.logo_url} 
                    alt="Company logo" 
                    className="w-full h-full object-contain" 
                  />
                ) : (
                  <Building className="h-12 w-12 text-gray-400" />
                )}
              </div>
              
              <div className="flex items-center justify-center">
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Logo
                  </div>
                  <input
                    id="logo-upload"
                    name="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="sr-only"
                  />
                </label>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1 lg:col-span-2 hover-lift">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
                <CardDescription>This information will appear on job cards and invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={company.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    name="address"
                    value={company.address}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={company.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={company.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={isLoading} className="bg-fixflow-500 hover:bg-fixflow-600">
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </span>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
          
          <Card className="col-span-1 lg:col-span-3 hover-lift">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center p-4 bg-fixflow-50 rounded-lg">
                <User className="h-5 w-5 text-fixflow-500 mr-3" />
                <div>
                  <p className="text-sm font-medium">Logged in as:</p>
                  <p className="text-fixflow-600">sipho@repairshop.co.za</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CompanyProfile;
