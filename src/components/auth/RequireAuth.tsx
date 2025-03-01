
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  // Show a loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fixflow-500"></div>
      </div>
    );
  }

  // Redirect to home page if not authenticated
  if (!session) {
    return <Navigate to="/" replace />;
  }

  // Render the protected children
  return <>{children}</>;
}
