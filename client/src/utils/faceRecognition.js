// client/src/utils/faceRecognition.js
import * as faceapi from 'face-api.js';

// Define the relative path where the face-api.js models must be stored.
// Ensure you have a 'models' folder in your 'client/public' directory 
// containing the .json and .bin files for the necessary nets.
const MODEL_URL = '/models';

// List of models required for the entire process:
// 1. ssdMobilenetv1: Used for highly accurate face detection (locating the face).
// 2. faceLandmark68Net: Used for finding 68 specific points on the face (landmarks).
// 3. faceRecognitionNet: Used to compute the 128-vector descriptor (the unique fingerprint).
const modelsToLoad = [
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
];

/**
 * Loads all required face-api.js models asynchronously.
 * This should be called once when the application (or a camera page) starts.
 * @returns {Promise<boolean>} True if models loaded successfully, false otherwise.
 */
export const loadModels = async () => {
    console.log('Loading face recognition models...');
    try {
        await Promise.all(modelsToLoad);
        console.log('Models loaded successfully.');
        return true;
    } catch (error) {
        console.error('CRITICAL ERROR: Failed to load face models.', error);
        alert('Face recognition models failed to load. Check console and ensure /public/models folder is present.');
        return false;
    }
};

/**
 * Captures a face from a media element (like a <video> stream) and computes its encoding.
 * * @param {HTMLMediaElement} mediaElement - The DOM element containing the live video feed.
 * @returns {Array<number> | null} - The 128-dimensional face encoding vector (number array) 
 * or null if no face is detected.
 */
export const getFaceEncoding = async (mediaElement) => {
    if (!mediaElement) return null;

    try {
        // Detect a single face, compute the landmarks, and then compute the descriptor (encoding)
        const detectionWithDescriptors = await faceapi.detectSingleFace(mediaElement)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (detectionWithDescriptors && detectionWithDescriptors.descriptor) {
            // The descriptor is a Float32Array, which needs to be converted to a standard 
            // JavaScript number Array for easy storage and transmission to the Node.js backend.
            return Array.from(detectionWithDescriptors.descriptor);
        }
        
        // Return null if detection failed or no descriptor was computed
        return null;
        
    } catch (error) {
        // Log error, but generally safe to return null if this happens during continuous scanning
        // console.error('Error getting face encoding in utility:', error);
        return null; 
    }
};