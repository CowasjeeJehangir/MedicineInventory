import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Get user data from localStorage - FIXED: using 'userData' not 'user'
        const userData = localStorage.getItem('userData');
        const authToken = localStorage.getItem('authToken');

        

        if (!userData || !authToken) {

          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        const parsedUser = JSON.parse(userData);

        
        // Validate that user object has required fields
        if (!parsedUser.staff_id || !parsedUser.designation || !parsedUser.account_id) {

          localStorage.removeItem('userData');
          localStorage.removeItem('authToken');
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // If we get here, user is authenticated
        setUser(parsedUser);
        setIsAuthenticated(true);

        
      } catch (error) {
        console.error('ProtectedRoute - Authentication check failed:', error);
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div style={{ 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid var(--color-primary)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 2s linear infinite'
        }}></div>
        <p style={{ marginTop: '20px', color: '#666' }}>Verifying authentication...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If authentication failed, redirect to login
  if (!isAuthenticated || !user) {

    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (requiredRole) {

    
    // Case-insensitive role comparison
    const userRole = user.designation?.toLowerCase();
    const requiredRoleLower = requiredRole?.toLowerCase();

    if (userRole !== requiredRoleLower) {

      // Redirect to dashboard with access denied message
      return <Navigate to="/dashboard" replace />;
    }
  }

  // User is authenticated and authorized
  return children;
};

export default ProtectedRoute;