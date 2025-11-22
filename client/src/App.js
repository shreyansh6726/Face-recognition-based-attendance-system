// client/src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
// Import component placeholders for the next steps
import DashboardPage from './pages/DashboardPage'; 
import EnrollmentPage from './pages/EnrollmentPage';
import AttendancePortal from './pages/AttendancePortal';
import CandidateProfile from './pages/CandidateProfile'; // For the Candidate role

// --- Component to handle protected routing ---
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user } = useAuth();
    
    if (!user) {
        // Not logged in -> redirect to login
        return <Navigate to="/login" replace />;
    }
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Logged in but wrong role -> redirect to unauthorized view or dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};


const App = () => {
    return (
        <div className="App">
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Authority/Department Manager Routes */}
                <Route path="/dashboard" element={
                    <ProtectedRoute allowedRoles={['authority', 'department']}>
                        <DashboardPage />
                    </ProtectedRoute>
                } />
                
                <Route path="/enroll" element={
                    <ProtectedRoute allowedRoles={['authority', 'department']}>
                        <EnrollmentPage />
                    </ProtectedRoute>
                } />
                
                <Route path="/attendance" element={
                    <ProtectedRoute allowedRoles={['authority', 'department']}>
                        <AttendancePortal />
                    </ProtectedRoute>
                } />

                {/* Candidate Self-Service Route */}
                <Route path="/profile" element={
                    <ProtectedRoute allowedRoles={['candidate']}>
                        <CandidateProfile />
                    </ProtectedRoute>
                } />
            </Routes>
        </div>
    );
};

export default App;