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
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
          setIsAuthenticated(true);
          console.log(`ProtectedRoute - User: ${JSON.stringify(currentUser)}, Required Role: ${requiredRole}`);

          if (!requiredRole || currentUser.role === requiredRole) {
            setHasRequiredRole(true);
          } else {
            console.log(`Role mismatch - User Role: ${currentUser.role}, Required: ${requiredRole}`);
          }
        } else {
          console.log('No user authenticated');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [requiredRole]);

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    console.log('Redirecting to /login - User not authenticated');
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !hasRequiredRole) {
    console.log(`Redirecting - User Role: ${user?.role}, Required Role: ${requiredRole}`);
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user?.role === 'staff') {
      return <Navigate to="/staff" replace />;
    } else if (user?.role === 'student') {
      return <Navigate to="/student" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;