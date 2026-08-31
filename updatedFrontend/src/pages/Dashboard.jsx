import React, { useState, useEffect } from 'react';
import Header from '../components/Header'; 
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem('userData');
    const authToken = localStorage.getItem('authToken');
    
    console.log('Raw userData from localStorage:', storedUserData);
    console.log('Auth token:', authToken);
    
    if (storedUserData && authToken) {
      try {
        const user = JSON.parse(storedUserData);
        console.log('Parsed user data:', user);
        console.log('Available keys:', Object.keys(user));
        
        setUserData(user);
        
        // Check for role in both 'designation' and 'role' fields
        const role = user.designation || user.role;
        console.log('Extracted role:', role);
        console.log('Role type:', typeof role);
        
        if (role) {
          setUserRole(role.toLowerCase().trim()); // Normalize the role
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Redirect to login if data is corrupted
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
        setLoading(false);
        navigate('/login');
      }
    } else {
      console.log('No userData or authToken found - redirecting to login');
      setLoading(false);
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    // Clear all stored data
    localStorage.removeItem('userData');
    localStorage.removeItem('authToken');
    
    // Navigate to login
    navigate('/login');
  };

  // Regular cards available to all users with icons
  const regularCards = [
    {
      title: 'View Patient List',
      description: 'Manage and view registered patients',
      icon: '👥',
      route: '/pharmacy-patientlist',
      gradient: 'linear-gradient(135deg, #59f1aa, #41d7a8)'
    },
    {
      title: 'Stock Register',
      description: 'Track stock levels and expiry dates',
      icon: '📦',
      route: '/medicine-stock',
      gradient: 'linear-gradient(135deg, #f59fee, #e84393)'
    }
  ];

  // Admin card
  const adminCard = {
    title: 'Admin Panel',
    description: 'Manage users and system settings',
    icon: '⚙️',
    route: '/admin-screen',
    gradient: 'linear-gradient(135deg, #ff6b6b, #ee5a24)'
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Show loading state with spinner
  if (loading) {
    return (
      <div className="dashboard-page">
        <Header />
        <div className="dashboard-wrapper">
          <div className="loading-message">
            <div className="loading-spinner"></div>
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = userRole === 'admin';

  return (
    <div className="dashboard-page">
      <Header />
    
      <div className="dashboard-wrapper">
        {/* Enhanced Welcome Section */}
        <div className="welcome-section">
          <h2>{getGreeting()}, {userData?.name || 'User'}! 👋</h2>
          <p>Role: {userData?.designation || userData?.role || 'Unknown'}</p>
          <p>{currentTime.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
          {isAdmin && <div className="admin-badge">Administrator Access</div>}
        </div>

        <div className="cards-container">
          {/* Regular cards for all users */}
          {regularCards.map((card, index) => (
            <div
              key={index}
              className="dashboard-card"
              style={{ '--card-gradient': card.gradient }}
              onClick={() => navigate(card.route)}
              tabIndex="0"
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate(card.route);
                }
              }}
            >
              <div className="card-icon" style={{ background: card.gradient }}>
                {card.icon}
              </div>
              <div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
            </div>
          ))}

          {/* Admin card - Only show if user is admin */}
          {isAdmin && (
            <div
              className="dashboard-card admin-card"
              style={{ '--card-gradient': adminCard.gradient }}
              onClick={() => {
                console.log('Admin card clicked - navigating to:', adminCard.route);
                navigate(adminCard.route);
              }}
              tabIndex="0"
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate(adminCard.route);
                }
              }}
            >
              <div className="card-icon" style={{ background: adminCard.gradient }}>
                {adminCard.icon}
              </div>
              <div>
                <h3>{adminCard.title}</h3>
                <p>{adminCard.description}</p>
              </div>
              <div className="admin-indicator">Admin Only</div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Logout button */}
      <button
        className="logout-button"
        onClick={handleLogout}
        aria-label="Logout"
      >
        Logout 🚪
      </button>
    </div>
  );
};

export default Dashboard;