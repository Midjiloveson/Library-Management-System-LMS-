import React, { useState, useEffect } from 'react';

import API from '../api/axiosInstance'; 

const AdminReports = () => {
  // 1. Set up the state to hold the numbers from your backend
  const [reports, setReports] = useState({
    totalBooks: 0,
    totalUsers: 0,
    activeCheckouts: 0
  });
  const [loading, setLoading] = useState(true);

  // 2. Use useEffect to fetch the data as soon as the component loads
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await API.get('/books/admin/reports');
        setReports(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching reports:", error);
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // 3. Show a loading message while fetching from the database
  if (loading) return <div className="p-4 text-gray-500 font-semibold">Loading analytics...</div>;

  // 4. Render the metric cards using Tailwind CSS
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Library Analytics</h2>
      
      {/* Grid layout for the 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Inventory Card */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm uppercase tracking-wider font-semibold">Total Inventory</h3>
          <p className="text-4xl font-bold text-blue-600 mt-2">{reports.totalBooks}</p>
        </div>

        {/* Active Checkouts Card */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm uppercase tracking-wider font-semibold">Active Checkouts</h3>
          <p className="text-4xl font-bold text-green-600 mt-2">{reports.activeCheckouts}</p>
        </div>

        {/* Total Users Card */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-sm uppercase tracking-wider font-semibold">Registered Users</h3>
          <p className="text-4xl font-bold text-purple-600 mt-2">{reports.totalUsers}</p>
        </div>

      </div>
    </div>
  );
};

export default AdminReports;