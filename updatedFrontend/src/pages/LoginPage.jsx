import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import LoginForm from '../components/LoginForm';
import Footer from '../components/Footer';
import '../styles/Login.css';
import { ENDPOINTS, apiFetch } from '../config/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    const authToken = localStorage.getItem('authToken');
    
    if (userData && authToken) {
      console.log('User already logged in, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (loginData) => {
    setIsLoading(true);
    setError('');
    
    console.log('LoginPage - Attempting login with:', loginData);
    console.log('LoginPage - Data type:', typeof loginData);
    console.log('LoginPage - Data keys:', Object.keys(loginData || {}));
    console.log('LoginPage - Username:', loginData?.username);
    console.log('LoginPage - Password:', loginData?.password ? '[PROVIDED]' : '[MISSING]');
    
    // Validate the data structure
    if (!loginData || typeof loginData !== 'object') {
      setError('Invalid login data format');
      setIsLoading(false);
      return;
    }
    
    if (!loginData.username || !loginData.password) {
      setError('Username and password are required');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('LoginPage - Sending request to server...');
      
      const { data } = await apiFetch(ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({
          account_id: loginData.username,
          password: loginData.password
        }),
      });

      console.log('LoginPage - Response data:', data);

      if (data.access_token) {
        localStorage.setItem('authToken', data.access_token);
        const { data: profile } = await apiFetch(ENDPOINTS.CURRENT_USER);
        const user = {
          ...profile,
          staff_id: profile.id,
          account_id: loginData.username,
        };
        console.log('LoginPage - Login successful, storing user data:', user);
        
        localStorage.setItem('userData', JSON.stringify(user));
        
        // Verify it was saved
        const saved = localStorage.getItem('userData');
        console.log('LoginPage - Verified saved data:', saved);
        
        // Small delay to ensure localStorage is written
        setTimeout(() => {
          console.log('LoginPage - Navigating to dashboard');
          navigate('/dashboard');
        }, 100);
        
      } else {
        setError('Login failed - no access token returned');
      }
    } catch (error) {
      console.error('LoginPage - Login error:', error);
      setError(error.message || 'Failed to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <Header />
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        <LoginForm 
          onSubmit={handleLogin} 
          isLoading={isLoading}
        />
        <Footer />
      </div>
    </div>
  );
};

export default LoginPage;
