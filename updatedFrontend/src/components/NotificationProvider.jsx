import React, { createContext, useContext, useEffect, useState } from 'react';
import '../styles/Notifications.css';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(() => setNotification(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type, id: Date.now() });
  };

  return (
    <NotificationContext.Provider value={showNotification}>
      {children}
      {notification && (
        <div className={`notification notification--${notification.type}`} role="status">
          <span>{notification.message}</span>
          <button aria-label="Dismiss notification" onClick={() => setNotification(null)}>×</button>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const showNotification = useContext(NotificationContext);
  if (!showNotification) throw new Error('useNotification must be used within NotificationProvider');
  return showNotification;
};
