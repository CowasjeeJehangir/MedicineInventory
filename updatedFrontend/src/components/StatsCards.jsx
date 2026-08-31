// components/StatsCards.js
import React from 'react';

const StatCard = ({ number, label, className = '' }) => (
  <div className={`stat-card ${className}`}>
    <div className="stat-number">{number}</div>
    <div className="stat-label">{label}</div>
  </div>
);

const StatsCards = ({ stats }) => {
  return (
    <div className="stats-container">
      <StatCard number={stats.total} label="Total Items" />
      <StatCard 
        number={stats.lowStock} 
        label="Low Stock" 
        className={stats.lowStock > 0 ? 'warning' : ''} 
      />
      <StatCard 
        number={stats.expired} 
        label="Expired" 
        className={stats.expired > 0 ? 'danger' : ''} 
      />
    </div>
  );
};

export default StatsCards;