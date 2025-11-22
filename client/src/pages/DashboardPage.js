// client/src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';

const DashboardPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [summary, setSummary] = useState({
        totalDepartments: 0,
        totalCandidates: 0,
        todayPresent: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Fetch Dashboard Summary Data ---
    useEffect(() => {
        const fetchSummary = async () => {
            try {
                // Fetches summary data scoped to the user's role (Institution or Department)
                const res = await axios.get(`${API_BASE_URL}/reports/summary`);
                
                setSummary(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError("Failed to load dashboard summary.");
                setLoading(false);
            }
        };

        fetchSummary();
    }, [user.role]); 

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) return <div className="loading-container">Loading Dashboard...</div>;
    if (error) return <div className="error-container">{error}</div>;

    // --- Render UI ---
    return (
        <div className="dashboard-page">
            <header className="dashboard-header">
                <h1>Welcome, {user.role === 'authority' ? 'Authority' : 'Department Manager'}! 👋</h1>
                <nav className="header-nav">
                    <button onClick={handleLogout} className="logout-button">Logout</button>
                </nav>
            </header>

            <main className="dashboard-content">
                <section className="summary-metrics">
                    <h2>Key Metrics (Scope: **{user.role === 'authority' ? 'Institution' : 'Your Department'}**)</h2>
                    <div className="metrics-grid">
                        <div className="metric-card">
                            <h3>Total Departments</h3>
                            <p>{summary.totalDepartments}</p>
                        </div>
                        <div className="metric-card">
                            <h3>Total Candidates</h3>
                            <p>{summary.totalCandidates}</p>
                        </div>
                        <div className="metric-card">
                            <h3>Today Present</h3>
                            <p className="highlight-metric">{summary.todayPresent}</p>
                        </div>
                    </div>
                </section>

                <section className="actions-and-navigation">
                    <h2>Quick Actions</h2>
                    <div className="action-links-grid">
                        {/* 1. Core Attendance Marking */}
                        <Link to="/attendance" className="action-link portal-link">
                            <h3>⏱️ Go to Attendance Portal</h3>
                            <p>Start live face scanning for attendance.</p>
                        </Link>

                        {/* 2. Enrollment/Management */}
                        <Link to="/enroll" className="action-link enroll-link">
                            <h3>➕ Enroll New Candidate</h3>
                            <p>Register new users and capture face encodings.</p>
                        </Link>
                        
                        {/* 3. Authority-Specific Action: Department Management */}
                        {user.role === 'authority' && (
                            <Link to="/manage-departments" className="action-link manage-link">
                                <h3>🏛️ Manage Departments</h3>
                                <p>Add, edit, or view department accounts and managers.</p>
                            </Link>
                        )}

                        {/* 4. Reporting/History View */}
                        <Link to="/reports" className="action-link report-link">
                            <h3>📜 View Reports & History</h3>
                            <p>Access attendance history and filtered reports.</p>
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default DashboardPage;