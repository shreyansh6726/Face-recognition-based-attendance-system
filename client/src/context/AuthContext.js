// client/src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const API_URL = 'http://localhost:5000/api/auth'; // Ensure this matches your server URL

export const AuthProvider = ({ children }) => {
    // Attempt to load user from localStorage on initial load
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('faceStampUser');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    // Save user data to localStorage whenever the user state changes
    useEffect(() => {
        if (user) {
            localStorage.setItem('faceStampUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('faceStampUser');
        }
    }, [user]);

    const login = async (username, password) => {
        try {
            const res = await axios.post(`${API_URL}/login`, { username, password });
            
            // The API returns the user object with token and scope (e.g., institutionId or departmentId)
            const userData = res.data; 
            setUser(userData);
            return userData;

        } catch (error) {
            // Use optional chaining for safe access
            const message = error.response?.data?.message || 'Login failed.';
            throw new Error(message);
        }
    };

    const logout = () => {
        setUser(null);
    };

    // Axios interceptor to attach JWT to all requests after login
    // This is crucial for accessing protected routes!
    useEffect(() => {
        const interceptor = axios.interceptors.request.use((config) => {
            if (user && user.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
            return config;
        });
        
        return () => {
            axios.interceptors.request.eject(interceptor);
        };
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);