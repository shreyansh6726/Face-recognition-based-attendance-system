document.addEventListener('DOMContentLoaded', () => {
    // --- Determine Current Page and Run Relevant Setup ---
    
    // Check if we are on the new student-details page
    if (document.body.querySelector('#details-table')) {
        // We use the direct call in student-details.html to ensure it runs
        // setupStudentDetailsPage(); // This is called via inline script in HTML
        return; 
    }
    
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


// --- STUDENT DASHBOARD SETUP (Attendance Graph and Webcam) ---
function setupDashboard() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const studentName = currentUser.name || 'Student';
    
    const nameDisplayEl = document.getElementById('student-name-display');
    if (nameDisplayEl) {
        nameDisplayEl.textContent = studentName; 
    }

    // 1. Attendance Data and Graph Setup (Uses simulated data)
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


// --- TEACHER DASHBOARD SETUP (Links to Details Page) ---
async function setupTeacherDashboard() {
    const tableBody = document.querySelector('#attendance-table tbody');
    const teacherNameEl = document.getElementById('teacher-name');
    const courseNameEl = document.getElementById('course-name');
    const totalStudentsEl = document.getElementById('total-students');
    const avgAttendanceEl = document.getElementById('avg-attendance');

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const teacherCourse = currentUser.course || 'Advanced Programming'; // Default course name for URL

    // Set Header Info
    teacherNameEl.textContent = currentUser.name || 'Faculty';
    courseNameEl.textContent = teacherCourse;

    let studentRoster = [];
    
    try {
        const response = await fetch('students.csv');
        if (!response.ok) throw new Error(`Failed to load students.csv: ${response.statusText}`);
        const csvText = await response.text();
        
        // Augment data with simulated attendance
        const totalClassesHeld = 15;
        studentRoster = parseCSV(csvText).map(student => {
            const attendedCount = Math.floor(Math.random() * 11) + 5; 
            return {
                id: student['college-id'],
                name: student.name, 
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

    let totalAttended = 0;
    let totalClassesSum = 0;

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
            <td><button class="action-button" data-student-id="${student.id}" data-student-name="${student.name}" data-teacher-course="${teacherCourse}">View Details</button></td>
        `;
    });
    
    const totalStudents = studentRoster.length;
    const avgAttendance = totalClassesSum > 0 ? ((totalAttended / totalClassesSum) * 100).toFixed(1) : 0;

    totalStudentsEl.textContent = totalStudents;
    avgAttendanceEl.textContent = avgAttendance;

    // 4. Add event listener for action buttons (Redirect to new details page)
    if (tableBody) {
        tableBody.addEventListener('click', (event) => {
            if (event.target.classList.contains('action-button')) {
                const studentId = event.target.getAttribute('data-student-id');
                const studentName = event.target.getAttribute('data-student-name');
                const courseName = event.target.getAttribute('data-teacher-course');
                
                // Redirecting to the details page with parameters
                window.location.href = `student-details.html?id=${studentId}&name=${encodeURIComponent(studentName)}&course=${encodeURIComponent(courseName)}`;
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


// --- NEW FUNCTION: STUDENT DETAILS PAGE SETUP ---
function setupStudentDetailsPage() {
    // Helper function to parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('id');
    const studentName = urlParams.get('name') ? decodeURIComponent(urlParams.get('name')) : 'Unknown Student';
    const courseName = urlParams.get('course') ? decodeURIComponent(urlParams.get('course')) : 'Subject';

    // Update Header
    document.getElementById('report-student-name').textContent = studentName;
    document.getElementById('report-student-id').textContent = studentId;
    document.getElementById('report-course-name').textContent = courseName;


    // --- 1. SIMULATE DETAILED ATTENDANCE DATA ---
    const totalDays = 20;
    let attendedCount = 0;
    let dailyRecords = [];
    let dailyAttendanceStatus = []; // 1 for Present, 0 for Absent
    let dates = [];

    // Simulate 20 days of data
    for (let i = 1; i <= totalDays; i++) {
        const status = (Math.random() < 0.75) ? 'Present' : 'Absent'; // 75% chance of being present
        const date = `Oct ${i}`;
        const checkinTime = status === 'Present' ? `09:0${Math.floor(Math.random() * 6)}:10` : 'N/A';

        if (status === 'Present') {
            attendedCount++;
            dailyAttendanceStatus.push(1);
        } else {
             dailyAttendanceStatus.push(0);
        }
        dates.push(date);

        dailyRecords.push({ date, status, checkinTime });
    }

    const overallPercentage = ((attendedCount / totalDays) * 100).toFixed(1);

    // --- 2. POPULATE HTML ELEMENTS ---
    document.getElementById('course-attendance-percent-value').textContent = `${overallPercentage}%`;
    document.querySelector('.percentage-display p').textContent = `${attendedCount} Attended / ${totalDays} Total Classes in Subject`;

    const tableBody = document.querySelector('#details-table tbody');
    tableBody.innerHTML = ''; // Clear existing content

    dailyRecords.forEach(record => {
        const row = tableBody.insertRow();
        const statusColor = record.status === 'Present' ? 'style="color: #4CAF50; font-weight: bold;"' : 'style="color: #f95959; font-weight: bold;"';
        row.innerHTML = `
            <td>${record.date}</td>
            <td ${statusColor}>${record.status}</td>
            <td>${record.checkinTime}</td>
        `;
    });

    // --- 3. GENERATE ATTENDANCE CHART (Line Graph) ---
    const ctx = document.getElementById('dailyAttendanceChart');
    if (ctx) {
        new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Attendance Status (1=Present, 0=Absent)',
                    data: dailyAttendanceStatus,
                    backgroundColor: 'rgba(249, 89, 89, 0.2)',
                    borderColor: '#f95959',
                    borderWidth: 2,
                    pointRadius: 5,
                    pointBackgroundColor: dailyAttendanceStatus.map(status => status === 1 ? '#4CAF50' : '#f95959'),
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 1,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return value === 1 ? 'Present' : 'Absent';
                            },
                            color: '#e3e3e3'
                        },
                        grid: { color: 'rgba(227, 227, 227, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#e3e3e3' },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Daily Attendance Status',
                        color: '#e3e3e3'
                    },
                    tooltip: {
                         callbacks: {
                            label: function(context) {
                                return context.raw === 1 ? 'Present' : 'Absent';
                            }
                        }
                    }
                }
            }
        });
    }
}