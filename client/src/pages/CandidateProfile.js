// client/src/pages/CandidateProfile.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://localhost:5000/api';

const CandidateProfile = () => {
    const { user, logout } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Fetch Data ---
    useEffect(() => {
        if (!user || user.role !== 'candidate') return;

        const fetchCandidateData = async () => {
            try {
                // 1. Fetch Candidate Profile (The backend ensures only the user's data is returned)
                const profileRes = await axios.get(`${API_BASE_URL}/candidates/`);
                
                // Since the API returns an array, take the first element (the logged-in candidate)
                const profile = profileRes.data[0];
                setProfileData(profile);
                
                // 2. Fetch Attendance Records for this Candidate
                const attendanceRes = await axios.get(`${API_BASE_URL}/attendance/records?candidateId=${profile._id}`);
                setAttendanceRecords(attendanceRes.data);

                setLoading(false);

            } catch (err) {
                console.error("Error fetching candidate data:", err);
                setError("Failed to load profile or attendance data.");
                setLoading(false);
            }
        };

        fetchCandidateData();
    }, [user]);
    
    // --- Placeholder/Missing Attendance Records API ---
    /* NOTE: We need to implement the /api/attendance/records endpoint on the backend. 
    This is required to fetch the historical data displayed in the table below.
    */

    if (loading) return <div className="loading-container">Loading Candidate Profile...</div>;
    if (error) return <div className="error-container">{error}</div>;
    if (!profileData) return <div className="error-container">Profile data not found.</div>;

    // --- Render UI ---
    return (
        <div className="candidate-profile-page">
            <header className="profile-header">
                <h1>Welcome, {profileData.name} 👋</h1>
                <button onClick={logout} className="logout-button">Logout</button>
            </header>
            
            <section className="profile-details-card">
                <h2>📋 My Details</h2>
                <div className="details-grid">
                    <p><strong>Username:</strong> {profileData.candidate_username}</p>
                    <p><strong>Enrollment ID:</strong> {profileData.enrollment_id}</p>
                    <p><strong>Department:</strong> {profileData.department_id.name || 'N/A'}</p>
                </div>
            </section>

            <section className="attendance-history">
                <h2>🗓️ Attendance History</h2>
                
                {attendanceRecords.length === 0 ? (
                    <p>No attendance records found yet.</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendanceRecords.map((record) => (
                                <tr key={record._id} className={record.status.toLowerCase()}>
                                    <td>{new Date(record.timestamp).toLocaleDateString()}</td>
                                    <td>{new Date(record.timestamp).toLocaleTimeString()}</td>
                                    <td>{record.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
};

export default CandidateProfile;