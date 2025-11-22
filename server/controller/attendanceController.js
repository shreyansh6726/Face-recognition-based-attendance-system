// server/controllers/attendanceController.js
const Attendance = require('../models/Attendance');
const Candidate = require('../models/Candidate');
const Department = require('../models/Department');

/**
 * Calculates the Euclidean distance between two 128-dimensional vectors.
 * The smaller the distance, the more similar the faces are.
 * The formula for Euclidean distance between two points (vectors) a and b in n-dimensional space is:
 * $$ \text{Distance} = \sqrt{\sum_{i=1}^{n} (a_i - b_i)^2} $$
 * @param {number[]} a - The reference 128-vector
 * @param {number[]} b - The query 128-vector
 * @returns {number} - The distance
 */
const euclideanDistance = (a, b) => {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += (a[i] - b[i]) ** 2;
    }
    return Math.sqrt(sum);
};

// Define a threshold: Faces closer than this are considered the same person.
const RECOGNITION_THRESHOLD = 0.6; 


// ----------------------------------------------------------------------
// 1. MARK ATTENDANCE (POST /api/attendance/mark)
// ----------------------------------------------------------------------
exports.markAttendance = async (req, res) => {
    const { encoding } = req.body;
    // req.user data comes from the JWT payload via authMiddleware
    const { departmentId, institutionId, role } = req.user; 
    let filter = {};

    if (!encoding || encoding.length !== 128) {
        return res.status(400).json({ message: 'Invalid face encoding provided.' });
    }

    try {
        // 1. Determine the search scope based on the user's role
        if (role === 'department') {
            // Manager: Only look up candidates in their department
            filter = { department_id: departmentId };
        } else if (role === 'authority') {
            // Authority: Look up candidates in all departments under the institution
            const departments = await Department.find({ institution_id: institutionId }).select('_id');
            const departmentIds = departments.map(d => d._id);
            filter = { department_id: { $in: departmentIds } };
        } else {
            return res.status(403).json({ message: 'Forbidden: Attendance can only be marked by Authority or Department users.' });
        }

        // 2. Fetch all candidate encodings within the scope
        const candidates = await Candidate.find(filter).select('name enrollment_id department_id face_encoding');
        
        let recognizedCandidate = null;
        let bestMatchDistance = Infinity;

        // 3. Compare the detected encoding against all stored encodings
        for (const candidate of candidates) {
            const distance = euclideanDistance(encoding, candidate.face_encoding);
            
            if (distance < bestMatchDistance) {
                bestMatchDistance = distance;
                recognizedCandidate = candidate;
            }
        }
        

        // 4. Check for successful recognition
        if (recognizedCandidate && bestMatchDistance <= RECOGNITION_THRESHOLD) {
            
            // 5. Check if attendance has already been marked today
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Set to start of day
            
            const existingAttendance = await Attendance.findOne({
                candidate_id: recognizedCandidate._id,
                timestamp: { $gte: today } // Check if a record exists today
            });

            if (existingAttendance) {
                // Already marked today
                return res.json({ 
                    success: true, 
                    message: `${recognizedCandidate.name}'s attendance was already marked today.`, 
                    candidate: { name: recognizedCandidate.name, enrollment_id: recognizedCandidate.enrollment_id }
                });
            }

            // 6. Mark the Attendance
            const newAttendance = await Attendance.create({
                candidate_id: recognizedCandidate._id,
                department_id: recognizedCandidate.department_id,
                status: 'Present'
            });

            return res.status(201).json({
                success: true,
                message: `Attendance marked successfully for ${recognizedCandidate.name}.`,
                candidate: { name: recognizedCandidate.name, enrollment_id: recognizedCandidate.enrollment_id },
                attendance_id: newAttendance._id
            });
        
        } else {
            // No match found
            return res.status(404).json({
                success: false,
                message: `Face not recognized. Distance: ${bestMatchDistance.toFixed(4)}`
            });
        }

    } catch (error) {
        console.error("Attendance Marking Error:", error);
        res.status(500).json({ message: 'Server error during attendance marking.' });
    }
};


// ----------------------------------------------------------------------
// 2. GET ATTENDANCE RECORDS (GET /api/attendance/records)
// ----------------------------------------------------------------------
exports.getAttendanceRecords = async (req, res) => {
    const { role, id: userId, departmentId, institutionId } = req.user;
    const { candidateId, startDate, endDate } = req.query; // Query parameters for filtering
    
    let filter = {};

    try {
        // --- Security Check & Scoping ---
        if (role === 'candidate') {
            // Candidate: Can ONLY see their own records.
            filter.candidate_id = userId; 
        } else if (role === 'department') {
            // Department Manager: Can ONLY see records for their department.
            filter.department_id = departmentId;
        } else if (role === 'authority') {
             // Authority: The most flexible role.
            if (candidateId) {
                 // If the Authority specifies a candidate ID, use it.
                filter.candidate_id = candidateId;
            } else {
                // Otherwise, get all department IDs under the institution
                const departments = await Department.find({ institution_id: institutionId }).select('_id');
                const departmentIds = departments.map(d => d._id);
                filter.department_id = { $in: departmentIds };
            }
        }
        
        // --- Additional Scoping Check for Managers/Authority querying a specific candidate ---
        if (candidateId && role !== 'candidate') {
            const candidate = await Candidate.findById(candidateId).select('department_id');
            if (!candidate) {
                return res.status(404).json({ message: "Candidate not found." });
            }
            // If the user is a manager, ensure the queried candidate is in their department
            if (role === 'department' && candidate.department_id.toString() !== departmentId.toString()) {
                return res.status(403).json({ message: "Forbidden: Cannot view records for candidates outside your department." });
            }
            // Filter is confirmed safe and set to the queried candidate's ID
            filter.candidate_id = candidateId; 
        }


        // --- Apply Time Filtering ---
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) {
                filter.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                // Set the end of the range to the start of the next day to include the full end date
                const end = new Date(endDate);
                end.setDate(end.getDate() + 1); 
                filter.timestamp.$lt = end;
            }
        }

        const records = await Attendance.find(filter)
            .sort({ timestamp: -1 }) // Latest records first
            .limit(200) // Limit results for performance/reporting view
            .populate('candidate_id', 'name enrollment_id') // Join with candidate name
            .select('-__v');

        res.status(200).json(records);

    } catch (error) {
        console.error("Error retrieving attendance records:", error);
        res.status(500).json({ message: 'Server error retrieving attendance records.' });
    }
};