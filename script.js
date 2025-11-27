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
                // IMPORTANT: Normalize header keys for consistent access (e.g., 'college ID' -> 'college-id')
                entry[header.toLowerCase().replace(/\s/g, '-')] = values[index].trim();
            });
            data.push(entry);
        }
    }
    return data;
}


// --- LANDING PAGE SETUP ---
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
                    window.location.href = 'teacher-login.html'; 
                } else if (role === 'student') {
                    window.location.href = 'student-login.html'; 
                }
            });
        });
    }
}


// --- STUDENT LOGIN SETUP (Credential Fix Applied) ---
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
        loginMessage.textContent = 'Error: Could not load user data.';
        loginMessage.classList.add('error');
    }

    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const collegeIdInput = document.getElementById('college-id').value.trim();
            const passwordInput = document.getElementById('password').value.trim();

            // *** FIX: Use normalized keys 'college-id' and 'password' ***
            const user = studentCredentials.find(
                c => c['college-id'] === collegeIdInput && c['password'] === passwordInput
            );

            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user)); 

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
}


// --- TEACHER LOGIN SETUP (Credential Fix Applied) ---
let teacherCredentials = [];

async function setupTeacherLogin() {
    const loginForm = document.getElementById('teacher-login-form');
    const loginMessage = document.getElementById('login-message');

    try {
        const response = await fetch('teachers.csv');
        if (!response.ok) throw new Error(`Failed to load CSV: ${response.statusText}`);
        const csvText = await response.text();
        teacherCredentials = parseCSV(csvText);
    } catch (error) {
        loginMessage.textContent = 'Error: Could not load teacher data.';
        loginMessage.classList.add('error');
    }

    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const collegeIdInput = document.getElementById('college-id').value.trim();
            const passwordInput = document.getElementById('password').value.trim();

            // *** FIX: Use normalized keys 'college-id' and 'password' ***
            const user = teacherCredentials.find(
                c => c['college-id'] === collegeIdInput && c['password'] === passwordInput
            );

            if (user) {
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
}


// --- STUDENT DASHBOARD SETUP ---
function setupDashboard() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const studentName = currentUser.name || 'Student';
    
    const nameDisplayEl = document.getElementById('student-name-display');
    if (nameDisplayEl) {
        nameDisplayEl.textContent = studentName; 
    }

    // 1. Attendance Data and Graph Setup
    const attendanceData = {
        classes: ['Physics', 'Math', 'History', 'English'],
        attended: [12, 14, 9, 15],
        total: [15, 15, 12, 15],
        overallAttended: 50, 
        overallTotal: 57 
    };

    const percentages = attendanceData.attended.map((attended, index) => 
        (attended / attendanceData.total[index] * 100).toFixed(0)
    );

    const overallPercentage = ((attendanceData.overallAttended / attendanceData.overallTotal) * 100).toFixed(1);
    
    const percentValueEl = document.getElementById('attendance-percent-value');
    if (percentValueEl) {
        percentValueEl.textContent = `${overallPercentage}%`;
    }

    // Chart Initialization
    const ctx = document.getElementById('attendanceBarChart');
    if (ctx) {
        new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: attendanceData.classes,
                datasets: [{
                    label: 'Attendance Percentage (%)',
                    data: percentages,
                    backgroundColor: 'rgba(249, 89, 89, 0.8)', 
                    borderColor: '#f95959',
                    borderWidth: 1,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, 
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { color: '#e3e3e3' },
                        grid: { color: 'rgba(227, 227, 227, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#e3e3e3' },
                        grid: { color: 'rgba(227, 227, 227, 0.1)' }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) { label += ': '; }
                                label += `${context.raw}% (${attendanceData.attended[context.dataIndex]}/${attendanceData.total[context.dataIndex]} classes)`;
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // 2. Camera and Attendance Logic Setup (Reused)
    const video = document.getElementById('webcam-video');
    const timeDisplay = document.getElementById('current-time-display');
    const markBtn = document.getElementById('mark-attendance-btn');
    const message = document.getElementById('attendance-message');

    if (video) {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    video.srcObject = stream;
                    video.play();
                    message.textContent = "Webcam active. Look straight into the camera.";
                    message.classList.remove('error');
                })
                .catch(error => {
                    message.textContent = "Error: Could not access camera. Please check permissions.";
                    message.classList.add('error');
                    if (markBtn) markBtn.disabled = true;
                });
        } else {
            message.textContent = "Error: Browser does not support webcam access.";
            message.classList.add('error');
            if (markBtn) markBtn.disabled = true;
        }

        setInterval(() => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { hour12: false });
            if (timeDisplay) timeDisplay.textContent = `Current Time: ${timeString}`;
        }, 1000);

        if (markBtn) {
             markBtn.addEventListener('click', () => {
                markAttendance(video, message, markBtn);
            });
        }
    }
}

/**
 * Simulates the attendance marking process
 */
function markAttendance(videoElement, messageElement, markBtn) {
    const now = new Date();
    const attendanceTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const canvas = document.getElementById('snapshot-canvas');
    if (canvas && videoElement.videoWidth > 0) {
         const context = canvas.getContext('2d');
         canvas.width = videoElement.videoWidth;
         canvas.height = videoElement.videoHeight;
         context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    }
    
    messageElement.classList.remove('error', 'success');
    messageElement.textContent = `Processing attendance at ${attendanceTime}...`;
    if (markBtn) markBtn.disabled = true;

    // Simulate Backend Call (2 seconds delay)
    setTimeout(() => {
        const success = Math.random() < 0.8; 

        if (success) {
            messageElement.textContent = `✅ Attendance Marked Successfully at ${attendanceTime}!`;
            messageElement.classList.add('success');
            const lastMarkedEl = document.getElementById('last-marked-time');
            if (lastMarkedEl) lastMarkedEl.textContent = attendanceTime;
        } else {
            messageElement.textContent = "❌ Face Not Recognized or Time Slot Expired. Please try again.";
            messageElement.classList.add('error');
        }

        if (markBtn) markBtn.disabled = false;
    }, 2000); 
}


// --- TEACHER DASHBOARD SETUP (Student Name Fix Verified) ---
async function setupTeacherDashboard() {
    const tableBody = document.querySelector('#attendance-table tbody');
    const teacherNameEl = document.getElementById('teacher-name');
    const courseNameEl = document.getElementById('course-name');
    const totalStudentsEl = document.getElementById('total-students');
    const avgAttendanceEl = document.getElementById('avg-attendance');

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    // Set Header Info
    teacherNameEl.textContent = currentUser.name || 'Faculty';
    courseNameEl.textContent = currentUser.course || 'Unknown Course';

    let studentRoster = [];
    
    // 1. Fetch Students.csv
    try {
        const response = await fetch('students.csv');
        if (!response.ok) throw new Error(`Failed to load students.csv: ${response.statusText}`);
        const csvText = await response.text();
        
        // 2. Augment data with simulated attendance
        const totalClassesHeld = 15;
        studentRoster = parseCSV(csvText).map(student => {
            const attendedCount = Math.floor(Math.random() * 11) + 5; // Attendance between 5 and 15
            return {
                id: student['college-id'],
                name: student.name, // Accessing the 'name' attribute from the CSV data
                attended: attendedCount,
                total: totalClassesHeld
            };
        });
    } catch (error) {
        console.error("Error fetching or parsing students.csv for dashboard:", error);
        const errorCard = document.querySelector('.student-list-card');
        if(errorCard) {
            errorCard.innerHTML = `<h2 style="color:red;">Error: Could not load student roster.</h2><p>Check console for details.</p>`;
        }
        return; 
    }

    // 3. Populate Table and calculate totals
    let totalAttended = 0;
    let totalClassesSum = 0;

    // Clear existing table contents before populating
    if (tableBody) tableBody.innerHTML = ''; 

    studentRoster.forEach(student => {
        const percentage = ((student.attended / student.total) * 100).toFixed(1);
        totalAttended += student.attended;
        totalClassesSum += student.total;
        
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
    
    // 4. Calculate and set Summary Stats
    const totalStudents = studentRoster.length;
    const avgAttendance = totalClassesSum > 0 ? ((totalAttended / totalClassesSum) * 100).toFixed(1) : 0;

    totalStudentsEl.textContent = totalStudents;
    avgAttendanceEl.textContent = avgAttendance;

    // Add event listener for action buttons
    if (tableBody) {
        tableBody.addEventListener('click', (event) => {
            if (event.target.classList.contains('action-button')) {
                const studentId = event.target.getAttribute('data-student-id');
                alert(`Viewing detailed attendance record for Student ID: ${studentId}.`);
            }
        });
    }

    // Logout cleanup
    const logoutLink = document.querySelector('.logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
        });
    }
}