
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Company } from "@/lib/types";

export function useCompany() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchCompany = async () => {
      try {
        const { data, error } = await supabase
          .from("companies")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        setCompany(data);
      } catch (error: any) {
        console.error("Error fetching company:", error);
        toast.error(error.message || "Failed to fetch company data");
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [user]);

  const updateCompany = async (companyData: Partial<Company>) => {
    if (!user) return null;

    try {
      setLoading(true);

      if (company) {
        // Update existing company
        const { data, error } = await supabase
          .from("companies")
          .update(companyData)
          .eq("id", company.id)
          .select()
          .single();

        if (error) throw error;
        
        setCompany(data);
        toast.success("Company information updated successfully");
        return data;
      } else {
        // Create new company - ensure all required fields are present
        const newCompany = {
          name: companyData.name || "",
          address: companyData.address || "",
          phone: companyData.phone || "",
          email: companyData.email || "",
          logo_url: companyData.logo_url,
          user_id: user.id
        };

        const { data, error } = await supabase
          .from("companies")
          .insert(newCompany)
          .select()
          .single();

        if (error) throw error;
        
        setCompany(data);
        toast.success("Company created successfully");
        return data;
      }
    } catch (error: any) {
      console.error("Error updating company:", error);
      toast.error(error.message || "Failed to update company");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { company, loading, updateCompany };
}
