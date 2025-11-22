// client/src/pages/EnrollmentPage.js
import React, { useState, useEffect, useRef } from 'react';
import { loadModels, getFaceEncoding } from '../utils/faceRecognition';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/candidates/enroll';

const EnrollmentPage = () => {
    const { user } = useAuth();
    const videoRef = useRef();
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [cameraStatus, setCameraStatus] = useState('Initializing...');
    
    // State to hold form data and pre-fill department ID for managers
    const [formData, setFormData] = useState({ 
        name: '', 
        enrollment_id: '', 
        candidate_username: '', 
        password: '', 
        departmentId: user.role === 'department' ? user.departmentId : '' 
    });
    
    const [statusMessage, setStatusMessage] = useState('');
    const [loading, setLoading] = useState(false);
    
    // --- 1. Load Models and Start Camera ---
    useEffect(() => {
        // Load face-api.js models (detection, landmark, recognition nets)
        loadModels().then(loaded => {
            setModelsLoaded(loaded);
            if (loaded) {
                startCamera();
            }
        });
        
        // Cleanup on unmount: stop the camera stream
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startCamera = async () => {
        try {
            // Request access to the user's camera
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraStatus('Camera Ready. Center your face.');
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            setCameraStatus('Error: Cannot access camera. Check permissions.');
        }
    };
    
    // --- 2. Handle Form and Enrollment Submission ---
    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEnrollment = async (e) => {
        e.preventDefault();
        
        if (!modelsLoaded || !videoRef.current || !videoRef.current.srcObject) {
            setStatusMessage('Error: Models or camera not ready.');
            return;
        }

        setLoading(true);
        setStatusMessage('Scanning face and computing encoding...');
        
        try {
            // Get the 128-dimensional vector from the current video frame
            const faceEncoding = await getFaceEncoding(videoRef.current);
            
            if (!faceEncoding) {
                setStatusMessage('Face not detected! Please ensure clear lighting and try again.');
                setLoading(false);
                return;
            }

            // Combine form data with the face encoding
            const enrollmentData = { ...formData, face_encoding: faceEncoding };
            
            setStatusMessage('Face captured. Sending data to secure server...');
            
            // Send the request to the protected API endpoint
            await axios.post(API_URL, enrollmentData);

            setStatusMessage(`✅ Enrollment successful for ${formData.name}!`);
            
            // Clear form fields
            setFormData({ 
                name: '', 
                enrollment_id: '', 
                candidate_username: '', 
                password: '', 
                departmentId: user.role === 'department' ? user.departmentId : '' 
            });
            
        } catch (error) {
            // Catch and display specific error messages from the backend (e.g., username exists)
            const message = error.response?.data?.message || 'Enrollment failed due to server error.';
            setStatusMessage(`❌ Error: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    // --- 3. Render UI ---
    return (
        <div className="enrollment-page">
            <h2>➕ Candidate Enrollment</h2>
            <p>Role: **{user.role === 'authority' ? 'Authority' : 'Department Manager'}**. Enroll new candidates by capturing their face and details.</p>
            
            <form onSubmit={handleEnrollment} className="enrollment-form-grid">
                
                {/* Form Data Section */}
                <div className="enroll-form-card">
                    <h3>Candidate Details</h3>

                    {/* Department ID Input: Authority can set, Manager's is fixed */}
                    {(user.role === 'authority' || user.role === 'department') && (
                        <div className="form-group">
                             <label htmlFor="departmentId">Department ID:</label>
                             {/* Authority can change this, Manager cannot */}
                             <input
                                type="text"
                                name="departmentId"
                                value={formData.departmentId}
                                onChange={handleFormChange}
                                placeholder={user.role === 'authority' ? 'Enter Department ID' : 'Your Department ID'}
                                required
                                disabled={user.role === 'department'}
                            />
                            {user.role === 'department' && <small>Assigned to your department automatically.</small>}
                        </div>
                    )}

                    <div className="form-group"><label htmlFor="name">Full Name:</label><input type="text" name="name" value={formData.name} onChange={handleFormChange} required/></div>
                    <div className="form-group"><label htmlFor="enrollment_id">Enrollment ID:</label><input type="text" name="enrollment_id" value={formData.enrollment_id} onChange={handleFormChange} required/></div>
                    <div className="form-group"><label htmlFor="candidate_username">Login Username:</label><input type="text" name="candidate_username" value={formData.candidate_username} onChange={handleFormChange} required/></div>
                    <div className="form-group"><label htmlFor="password">Login Password:</label><input type="password" name="password" value={formData.password} onChange={handleFormChange} required/></div>
                </div>
                
                {/* Video Capture Section */}
                <div className="camera-capture-card">
                    <h3>Face Capture:</h3>
                    <p className="camera-status">{cameraStatus}</p>
                    <div className="video-container">
                        <video 
                            ref={videoRef} 
                            width="100%" 
                            height="auto" 
                            autoPlay 
                            muted
                            style={{ maxWidth: '400px', margin: '0 auto', display: 'block' }} 
                        ></video>
                    </div>
                    <p id="statusMessage" className={statusMessage.startsWith('❌') ? 'error-message' : statusMessage.startsWith('✅') ? 'success-message' : ''}>{statusMessage}</p>
                    
                    <button type="submit" disabled={loading || !modelsLoaded || !videoRef.current?.srcObject}>
                        {loading ? 'Processing...' : 'Capture Face & Enroll Candidate'}
                    </button>
                    {!modelsLoaded && <small>Loading Face-API Models...</small>}
                </div>

            </form>
        </div>
    );
};

export default EnrollmentPage;