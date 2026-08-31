// // Update your LoginForm.jsx
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import InputField from './InputField';
// import SecurityNotice from './SecurityNotice';

// const LoginForm = ({ onSubmit }) => {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const navigate = useNavigate(); // For navigation

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');

//     try {
//       const response = await fetch('http://localhost:8000/api/login', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ username, password })
//       });

//       const result = await response.json();

//       if (result.success) {
//         // Store user data in localStorage
//         localStorage.setItem('user', JSON.stringify(result.user));
        
//         // Call the parent component's onSubmit with user data
//         onSubmit(result.user);
        
//         // Navigate based on user role
//         if (result.user.designation === 'Admin') {
//           navigate('/dashboard');
//         } else if (result.user.designation === 'Pharmacist') {
//           navigate('/dashboard');
//         } else {
//           navigate('/dashboard'); // Default route for other roles
//         }
//       } else {
//         setError(result.message);
//       }
//     } catch (err) {
//       setError('Unable to connect to server. Please try again.');
//       console.error('Login error:', err);
//     } finally {
//       setLoading(false);
//     }
//   };
//   return (
//     <div className="form-container">
//       <div className="form-header">
//         <div className="shield-icon">
//           <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
//             <path 
//               d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" 
//               stroke="currentColor" 
//               strokeWidth="2" 
//               strokeLinecap="round" 
//               strokeLinejoin="round"
//             />
//           </svg>
//         </div>
//         <span className="form-title">Secure Login</span>
//       </div>
      
//       {error && (
//         <div className="error-message">
//           {error}
//         </div>
//       )}
      
//       <form onSubmit={handleSubmit}>
//         <InputField
//           label="Username"
//           type="text"
//           placeholder="Enter your username"
//           value={username}
//           onChange={(e) => setUsername(e.target.value)}
//           icon="user"
//           disabled={loading}
//         />

//         <InputField
//           label="Password"
//           type="password"
//           placeholder="Enter your password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           icon="lock"
//           showPasswordToggle
//           disabled={loading}
//         />

//         <button type="submit" className="sign-in-btn" disabled={loading}>
//           {loading ? 'Signing In...' : 'Sign In'}
//         </button>
//       </form>

//       <SecurityNotice />
//     </div>
//   );
// };

// export default LoginForm;

import React, { useState } from 'react';
import InputField from './InputField';
import SecurityNotice from './SecurityNotice';

const LoginForm = ({ onSubmit, isLoading }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate inputs
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    // Pass the login credentials to the parent component
    // The parent (LoginPage) will handle the API call
    const loginData = {
      username: username.trim(),
      password: password.trim()
    };

    console.log('LoginForm - Submitting credentials:', {
      username: loginData.username,
      password: '[PROVIDED]'
    });

    // Call the parent's onSubmit with login credentials
    onSubmit(loginData);
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <div className="shield-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path 
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="form-title">Secure Login</span>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <InputField
          label="Username"
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          icon="user"
          disabled={isLoading}
        />

        <InputField
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon="lock"
          showPasswordToggle
          disabled={isLoading}
        />

        <button type="submit" className="sign-in-btn" disabled={isLoading}>
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <SecurityNotice />
    </div>
  );
};

export default LoginForm;