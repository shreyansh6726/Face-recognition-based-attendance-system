// client/src/pages/ReportsPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:5000/api/attendance/records';

const ReportsPage = () => {
    const { user } = useAuth();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState({
        startDate: '',
        endDate: '',
        candidateId: '', // For Authority/Manager to search specific candidate
    });
    
    // --- Fetch Data on Load and Filter Change ---
    useEffect(() => {
        // Prevent candidates from accessing this page (though routing should also handle this)
        if (user.role === 'candidate') {
            setError('Access Denied: Only Authority and Managers can view reports.');
            return;
        }
        
        // Initial fetch when the component mounts
        fetchRecords();
    }, [user.role]); // Dependency on user.role ensures refetch if context somehow changes

    const handleFilterChange = (e) => {
        setFilter({ ...filter, [e.target.name]: e.target.value });
    };

    const fetchRecords = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            // Construct query string from filter state
            const params = new URLSearchParams(filter).toString();
            
            // The backend controller handles the scope (departmentId/institutionId) based on the JWT
            const res = await axios.get(`${API_URL}?${params}`);
            
            setRecords(res.data);
            
        } catch (err) {
            console.error("Error fetching reports:", err);
            setError('Failed to load attendance reports.');
        } finally {
            setLoading(false);
        }
    };

    // --- Render Helpers ---
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
    };

    const getStatusClass = (status) => {
        return status === 'Present' ? 'status-present' : 'status-absent';
    };

    // --- Render UI ---
    return (
        <div className="reports-page">
            <header className="page-header">
                <h1>📊 Attendance Reports & History</h1>
                <p>Viewing attendance records scoped to your {user.role === 'authority' ? 'Institution' : 'Department'}.</p>
            </header>

            <section className="report-filter-card">
                <h2>Filter Records</h2>
                <form onSubmit={fetchRecords} className="filter-form-grid">
                    <div className="form-group">
                        <label htmlFor="startDate">Start Date:</label>
                        <input type="date" name="startDate" value={filter.startDate} onChange={handleFilterChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="endDate">End Date:</label>
                        <input type="date" name="endDate" value={filter.endDate} onChange={handleFilterChange} />
                    </div>
                    {/* Only show Candidate ID search if the user is Authority or Manager */}
                    <div className="form-group">
                        <label htmlFor="candidateId">Candidate ID (Optional):</label>
                        <input type="text" name="candidateId" placeholder="MongoDB ID" value={filter.candidateId} onChange={handleFilterChange} />
                    </div>
                    <div className="form-group submit-group">
                        <button type="submit" disabled={loading}>
                            {loading ? 'Searching...' : 'Apply Filters'}
                        </button>
                    </div>
                </form>
            </section>
            
            {error && <div className="error-message">{error}</div>}

            <section className="attendance-data-table">
                <h2>Attendance History ({records.length} records)</h2>

                {records.length === 0 && !loading ? (
                    <p>No records found matching your criteria.</p>
                ) : (
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Candidate Name</th>
                                <th>Enrollment ID</th>
                                <th>Timestamp (Marked At)</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((record) => (
                                <tr key={record._id}>
                                    <td>{record.candidate_id?.name || 'Unknown Candidate'}</td>
                                    <td>{record.candidate_id?.enrollment_id || 'N/A'}</td>
                                    <td>{formatTimestamp(record.timestamp)}</td>
                                    <td className={getStatusClass(record.status)}>
                                        {record.status}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
};

export default ReportsPage;