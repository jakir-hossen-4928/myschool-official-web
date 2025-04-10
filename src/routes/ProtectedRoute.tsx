
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '@/lib/auth';
import Loading from '@/components/loader/Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'staff' | 'student';
}

interface User {
  id: string;
  email: string | null;
  name: string | null;
  role: 'admin' | 'staff' | 'student';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasRequiredRole, setHasRequiredRole] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser() as User | null;
        
        if (user) {
          setIsAuthenticated(true);
          
          // If no specific role is required or the user has the required role
          if (!requiredRole || user.role === requiredRole) {
            setHasRequiredRole(true);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [requiredRole]);

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !hasRequiredRole) {
    // Redirect based on role
    if (requiredRole === 'admin') {
      return <Navigate to="/unauthorized" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
