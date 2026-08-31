// components/SearchAndFilters.js
import React from 'react';

const SearchAndFilters = ({
  searchTerm,
  setSearchTerm,
  stockFilter,
  setStockFilter,
  sortConfig,
  setSortConfig
}) => {
  const handleSortChange = (e) => {
    const [field, direction] = e.target.value.split('-');
    setSortConfig({ field, direction });
  };

  return (
    <div className="controls">
      <input
        type="text"
        className="search-box"
        placeholder="Search by medicine name, pharmacy ID..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      <select
        className="filter-select"
        value={stockFilter}
        onChange={(e) => setStockFilter(e.target.value)}
      >
        <option value="all">All Stock Levels</option>
        <option value="instock">In Stock</option>
        <option value="low">Low Stock</option>
        <option value="expired">Expired</option>
      </select>

      <select
        className="sort-select"
        value={`${sortConfig.field}-${sortConfig.direction}`}
        onChange={handleSortChange}
      >
        <option value="name-asc">Name (A-Z)</option>
        <option value="name-desc">Name (Z-A)</option>
        <option value="price-asc">Price (Low-High)</option>
        <option value="price-desc">Price (High-Low)</option>
        <option value="quantity-asc">Quantity (Low-High)</option>
        <option value="quantity-desc">Quantity (High-Low)</option>
        <option value="expiry-asc">Expiry (Earliest)</option>
        <option value="expiry-desc">Expiry (Latest)</option>
      </select>
    </div>
  );
};

export default SearchAndFilters;