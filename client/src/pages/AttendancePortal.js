// client/src/pages/AttendancePortal.js
import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import { loadModels, getFaceEncoding } from '../utils/faceRecognition';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:5000/api/attendance/mark';
// Define the interval (in milliseconds) for scanning faces (e.g., scan every 1 second)
const SCAN_INTERVAL = 1000; 

const AttendancePortal = () => {
    const { user } = useAuth();
    const videoRef = useRef();
    const canvasRef = useRef();
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [status, setStatus] = useState('Initializing...');
    const [isScanning, setIsScanning] = useState(false);
    const [matchData, setMatchData] = useState(null); // Stores successful match info
    const [lastScanTime, setLastScanTime] = useState(0);

    // --- 1. Setup: Load Models and Start Camera ---
    useEffect(() => {
        // Load models first
        loadModels().then(loaded => {
            setModelsLoaded(loaded);
            if (loaded) {
                setStatus('Models loaded. Starting camera...');
                startCamera();
            }
        });

        // Cleanup function: stop camera and scanning loop
        return () => {
            setIsScanning(false);
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Once the video starts playing, we can start the scanning loop
                videoRef.current.onloadedmetadata = () => {
                    setIsScanning(true);
                    setStatus('Camera feed active. Scanning for faces...');
                };
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            setStatus('Error: Cannot access camera. Check permissions.');
        }
    };

    // --- 2. Scanning Loop (Core Recognition Logic) ---
    useEffect(() => {
        let interval;
        
        if (isScanning && modelsLoaded && videoRef.current) {
            
            // Set up the interval for continuous scanning
            interval = setInterval(async () => {
                const now = Date.now();
                
                // Ensure we don't spam the server. Only mark attendance once every few seconds.
                if (now - lastScanTime < SCAN_INTERVAL) {
                    return; 
                }

                // Get face encoding from the video element
                const faceEncoding = await getFaceEncoding(videoRef.current);
                
                // If a face is detected, send the encoding to the server
                if (faceEncoding) {
                    setLastScanTime(now); // Update last scan time
                    
                    // We only send the encoding if a face is detected
                    handleRecognition(faceEncoding);
                    
                } else {
                    // No face detected, update status on the UI
                    setMatchData(null);
                    setStatus('Scanning: Face not found. Please center your face.');
                }
            }, SCAN_INTERVAL);
        }

        // Cleanup interval
        return () => clearInterval(interval);
    }, [isScanning, modelsLoaded, lastScanTime]); 
    // Dependencies include isScanning and modelsLoaded to start/stop the loop

    // --- 3. Communication with Backend API ---
    const handleRecognition = async (encoding) => {
        try {
            setStatus('Face detected. Checking database...');
            
            const res = await axios.post(API_URL, { encoding });
            const { message, candidate, success } = res.data;

            if (success) {
                // Successful match and attendance marked (or already marked)
                setMatchData({ 
                    name: candidate.name, 
                    message: message, 
                    success: true 
                });
                setStatus('Attendance operation completed.');
                // Optionally stop scanning or pause for a moment
                
            } else {
                // Should not happen if server responds 200/201, but a safeguard
                setMatchData({ name: null, message: message, success: false });
            }

        } catch (error) {
            // Error: Face not recognized (404) or Server error (500)
            const message = error.response?.data?.message || 'Unrecognized face or connection error.';
            setMatchData({ name: null, message: message, success: false });
            setStatus('Recognition failed.');
        }
    };

    // --- 4. Render UI ---
    return (
        <div className="attendance-portal-container">
            <h1>⏱️ Face Stamp Attendance Portal</h1>
            <p className="scan-status">
                **Portal Status:** {status}
            </p>

            <div className="attendance-area">
                <div className="camera-feed-box">
                    {/* The video element displays the live feed */}
                    <video ref={videoRef} width="640" height="480" autoPlay muted style={{ display: modelsLoaded ? 'block' : 'none' }}></video>
                    {/* Canvas for drawing detection boxes could be added here later */}
                    <canvas ref={canvasRef} style={{ position: 'absolute' }} />
                    {!modelsLoaded && <div className="loading-overlay">Loading Models...</div>}
                </div>
                
                <div className="attendance-status-box">
                    <p className="time-display">{new Date().toLocaleTimeString()}</p>
                    
                    <div className={`result-card ${matchData ? (matchData.success ? 'success' : 'failure') : 'pending'}`}>
                        {/* Display message based on recognition outcome */}
                        {matchData === null && <h2>Awaiting scan...</h2>}
                        
                        {matchData && (
                            <>
                                <h2>{matchData.success ? '✅ SUCCESS' : '❌ FAILED'}</h2>
                                {matchData.name && <h3>{matchData.name}</h3>}
                                <p>{matchData.message}</p>
                                <small>Last Scan: {new Date(lastScanTime).toLocaleTimeString()}</small>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendancePortal;