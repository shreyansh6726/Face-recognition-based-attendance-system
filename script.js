document.addEventListener('DOMContentLoaded', () => {
    // --- Determine Current Page and Run Relevant Setup ---
    
    if (document.body.classList.contains('teacher-dashboard')) {
        setupTeacherDashboard();
    } else if (document.body.classList.contains('dashboard-body')) {
        setupDashboard();
    } else if (document.body.classList.contains('login-body') && document.getElementById('teacher-login-form')) {
        setupTeacherLogin();
    } else if (document.body.classList.contains('login-body')) {
        setupStudentLogin();
    } else {
        setupLandingPage();
    }
});

// --- CORE FUNCTION: CSV to JSON Parser ---
// Simple parser that assumes header row and comma delimiter
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length === headers.length) {
            const entry = {};
            headers.forEach((header, index) => {
                // Normalize header keys for easy access (e.g., 'college ID' -> 'college-id')
                entry[header.toLowerCase().replace(/\s/g, '-')] = values[index].trim();
            });
            data.push(entry);
        }
    }
    return data;
}


// --- LANDING PAGE SETUP (Updated Redirect) ---
function setupLandingPage() {
    const getStartedBtn = document.getElementById('get-started-btn');
    const roleModal = document.getElementById('role-modal');
    const roleButtons = document.querySelectorAll('.role-button');
    const closeModalBtn = document.querySelector('.close-modal');

    if (getStartedBtn) {
        function showModal() { roleModal.classList.add('active'); }
        function hideModal() { roleModal.classList.remove('active'); }

        getStartedBtn.addEventListener('click', showModal);
        closeModalBtn.addEventListener('click', hideModal);
        roleModal.addEventListener('click', (event) => {
            if (event.target === roleModal) { hideModal(); }
        });

        roleButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const role = event.target.getAttribute('data-role');
                hideModal();

                if (role === 'teacher') {
                    console.log('Redirecting to Teacher Login Page...');
                    // REDIRECT TO THE NEW TEACHER LOGIN PAGE
                    window.location.href = 'teacher-login.html'; 
                } else if (role === 'student') {
                    console.log('Redirecting to Student Login Page...');
                    window.location.href = 'student-login.html'; 
                }
            });
        });
    }
}


// --- STUDENT LOGIN SETUP (No Change) ---
let studentCredentials = [];

async function setupStudentLogin() {
    const loginForm = document.getElementById('student-login-form');
    const loginMessage = document.getElementById('login-message');

    try {
        const response = await fetch('students.csv');
        if (!response.ok) throw new Error(`Failed to load CSV: ${response.statusText}`);
        const csvText = await response.text();
        studentCredentials = parseCSV(csvText);
    } catch (error) {
        console.error("Error fetching or parsing students.csv:", error);
        loginMessage.textContent = 'Error: Could not load user data.';
        loginMessage.classList.add('error');
    }

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const collegeIdInput = document.getElementById('college-id').value.trim();
        const passwordInput = document.getElementById('password').value.trim();

        const user = studentCredentials.find(
            c => c['college-id'] === collegeIdInput && c['password'] === passwordInput
        );

        if (user) {
            loginMessage.textContent = `Login successful! Redirecting...`;
            loginMessage.classList.add('success');
            loginMessage.classList.remove('error');
            setTimeout(() => {
                window.location.href = 'student-dashboard.html';
            }, 1000);
        } else {
            loginMessage.textContent = 'Invalid College ID or Password. Please try again.';
            loginMessage.classList.add('error');
            loginMessage.classList.remove('success');
        }
    });
}


// --- TEACHER LOGIN SETUP (NEW) ---
let teacherCredentials = [];

async function setupTeacherLogin() {
    const loginForm = document.getElementById('teacher-login-form');
    const loginMessage = document.getElementById('login-message');

    // 1. Fetch the Teacher CSV file
    try {
        const response = await fetch('teachers.csv');
        if (!response.ok) throw new Error(`Failed to load CSV: ${response.statusText}`);
        const csvText = await response.text();
        teacherCredentials = parseCSV(csvText);
    } catch (error) {
        console.error("Error fetching or parsing teachers.csv:", error);
        loginMessage.textContent = 'Error: Could not load teacher data.';
        loginMessage.classList.add('error');
    }

    // 2. Handle form submission
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const collegeIdInput = document.getElementById('college-id').value.trim();
        const passwordInput = document.getElementById('password').value.trim();

        const user = teacherCredentials.find(
            c => c['college-id'] === collegeIdInput && c['password'] === passwordInput
        );

        if (user) {
            // Success: Store user details temporarily (e.g., in localStorage)
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            loginMessage.textContent = `Login successful! Redirecting...`;
            loginMessage.classList.add('success');
            loginMessage.classList.remove('error');
            
            setTimeout(() => {
                window.location.href = 'teacher-dashboard.html';
            }, 1000);

        } else {
            loginMessage.textContent = 'Invalid College ID or Password. Please try again.';
            loginMessage.classList.add('error');
            loginMessage.classList.remove('success');
        }
    });
}


// --- TEACHER DASHBOARD SETUP (NEW) ---
// Sample data for the teacher dashboard to display
const TEACHER_STUDENT_DATA = [
    { id: 'S1001', name: 'Alice Johnson', attended: 14, total: 15 },
    { id: 'S1002', name: 'Bob Smith', attended: 10, total: 15 },
    { id: 'S1003', name: 'Charlie Brown', attended: 15, total: 15 },
    { id: 'S1004', name: 'Diana Prince', attended: 12, total: 15 },
    { id: 'S1005', name: 'Ethan Hunt', attended: 8, total: 15 },
];

function setupTeacherDashboard() {
    const tableBody = document.querySelector('#attendance-table tbody');
    const teacherNameEl = document.getElementById('teacher-name');
    const courseNameEl = document.getElementById('course-name');
    const totalStudentsEl = document.getElementById('total-students');
    const avgAttendanceEl = document.getElementById('avg-attendance');

    // Retrieve logged-in teacher's info
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    // Set Header Info
    teacherNameEl.textContent = currentUser.name || 'Faculty';
    courseNameEl.textContent = currentUser.course || 'Unknown Course';

    // Populate Table and calculate totals
    let totalAttended = 0;
    let totalClasses = 0;

    TEACHER_STUDENT_DATA.forEach(student => {
        const percentage = ((student.attended / student.total) * 100).toFixed(1);
        totalAttended += student.attended;
        totalClasses += student.total;
        
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.attended}</td>
            <td>${student.total}</td>
            <td><strong>${percentage}%</strong></td>
            <td><button class="action-button" data-student-id="${student.id}">View Details</button></td>
        `;
    });
    
    // Calculate and set Summary Stats
    const totalStudents = TEACHER_STUDENT_DATA.length;
    const avgAttendance = totalClasses > 0 ? ((totalAttended / totalClasses) * 100).toFixed(1) : 0;

    totalStudentsEl.textContent = totalStudents;
    avgAttendanceEl.textContent = avgAttendance;

    // Add event listener for action buttons
    tableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('action-button')) {
            const studentId = event.target.getAttribute('data-student-id');
            alert(`Viewing detailed attendance record for Student ID: ${studentId}. (Future feature: detailed student history)`);
        }
    });

    // Logout cleanup
    document.querySelector('.logout-link').addEventListener('click', () => {
        localStorage.removeItem('currentUser');
    });
}


// --- STUDENT DASHBOARD SETUP (No Change) ---
function setupDashboard() {
    // ... (Your existing Chart.js, webcam, and markAttendance logic goes here) ...
    // Note: The full code is too long to include again, but the logic remains the same. 
    // Ensure you use the complete script from Step 4 in the final script.js file.
    
    // START of student dashboard code (just for reference, ensure full script is used)
    const attendanceData = { /* ... */ };
    const overallPercentage = 87.7; // Example value
    document.getElementById('attendance-percent-value').textContent = `${overallPercentage}%`;
    
    const video = document.getElementById('webcam-video');
    const message = document.getElementById('attendance-message');
    const markBtn = document.getElementById('mark-attendance-btn');

    if (video) {
        // Simplified webcam check for deployment
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => { video.srcObject = stream; video.play(); message.textContent = "Webcam active."; })
                .catch(error => { message.textContent = "Error: Camera access denied."; markBtn.disabled = true; });
        } else {
             message.textContent = "Error: Browser does not support webcam."; markBtn.disabled = true;
        }
        
        // Mark Attendance Handler
        markBtn.addEventListener('click', () => {
             // Re-using the stub function for mark attendance
             markAttendance(video, message, markBtn);
        });
    }

    // Re-declare markAttendance function stub if needed for completeness
    function markAttendance(videoElement, messageElement, markBtn) {
        const now = new Date();
        const attendanceTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        messageElement.classList.remove('error', 'success');
        messageElement.textContent = `Processing attendance at ${attendanceTime}...`;
        markBtn.disabled = true;
        
        setTimeout(() => {
            const success = Math.random() < 0.8;
            if (success) {
                messageElement.textContent = `✅ Attendance Marked Successfully at ${attendanceTime}!`;
                document.getElementById('last-marked-time').textContent = attendanceTime;
                messageElement.classList.add('success');
            } else {
                messageElement.textContent = "❌ Face Not Recognized. Try again.";
                messageElement.classList.add('error');
            }
            markBtn.disabled = false;
        }, 2000); 
    }
}