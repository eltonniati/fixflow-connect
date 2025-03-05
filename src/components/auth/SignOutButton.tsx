
import { Button, ButtonProps } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignOutButtonProps extends ButtonProps {
  showIcon?: boolean;
}

export default function SignOutButton({ showIcon = true, className, ...props }: SignOutButtonProps) {
  const { signOut, loading } = useAuth();

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={signOut} 
      disabled={loading}
      className={cn("text-gray-700 hover:text-gray-900", className)}
      {...props}
    >
      {showIcon && <LogOut className="h-4 w-4 mr-2" />}
      Sign out
    </Button>
  );
}
