
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/hooks/use-company";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Building } from "lucide-react";
import { toast } from "sonner";

export default function CompanyProfile() {
  const { company, loading, updateCompany } = useCompany();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    logo_url: ""
  });
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        address: company.address || "",
        phone: company.phone || "",
        email: company.email || "",
        logo_url: company.logo_url || ""
      });
    }
  }, [company]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.address || !formData.phone || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    // Phone validation - simple check for now
    if (formData.phone.length < 5) {
      toast.error("Please enter a valid phone number");
      return;
    }
    
    setSubmitting(true);
    
    try {
      await updateCompany(formData);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving company profile:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-4xl mx-auto">
      <Button 
        variant="ghost" 
        onClick={() => navigate("/dashboard")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="h-6 w-6 text-gray-500" />
            <CardTitle>{company ? "Edit Company Profile" : "Setup Company Profile"}</CardTitle>
          </div>
          <CardDescription>
            {company 
              ? "Update your company details shown on invoices and job cards" 
              : "Add your company details to get started"}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 bg-gray-100 animate-pulse rounded-md"></div>
                ))}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input 
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your Company Name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea 
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Company Address"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input 
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Phone Number"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input 
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="company@example.com"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logo_url">Logo URL (Optional)</Label>
                  <Input 
                    id="logo_url"
                    name="logo_url"
                    value={formData.logo_url}
                    onChange={handleChange}
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-xs text-gray-500">
                    Enter a URL to your company logo (we'll add proper image upload later)
                  </p>
                </div>
              </>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard")}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || submitting}
            >
              {submitting ? "Saving..." : (company ? "Update Profile" : "Save Profile")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
