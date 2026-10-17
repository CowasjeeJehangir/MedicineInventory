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
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (loginData) => {
    setIsLoading(true);
    setError('');
    
    
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
      
      const { data } = await apiFetch(ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({
          account_id: loginData.username,
          password: loginData.password
        }),
      });


      if (data.access_token) {
        localStorage.setItem('authToken', data.access_token);
        const { data: profile } = await apiFetch(ENDPOINTS.CURRENT_USER);
        const user = {
          ...profile,
          staff_id: profile.id,
          account_id: loginData.username,
        };
        
        localStorage.setItem('userData', JSON.stringify(user));
        
        
        // Small delay to ensure localStorage is written
        setTimeout(() => {
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
