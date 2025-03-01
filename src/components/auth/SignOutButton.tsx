
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  const { signOut, loading } = useAuth();

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={signOut} 
      disabled={loading}
      className="text-gray-700 hover:text-gray-900"
    >
      <LogOut className="h-4 w-4 mr-2" />
      Sign out
    </Button>
  );
}
