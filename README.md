# ✨ FaceAttend: Smart Attendance System

## 🌟 Overview

**FaceAttend** is a web-based prototype designed to streamline and modernize the traditional classroom attendance process using facial recognition technology (simulated via webcam access). It provides separate, secure portals for **Students** to mark their attendance and **Teachers** to manage the roster and monitor detailed attendance reports.

## 🚀 Key Features

* **Role-Based Access:** Dedicated login pages for Students and Teachers, authenticated via CSV data (`students.csv`, `teachers.csv`).
* **Student Dashboard:**
    * Displays a personalized **overall attendance percentage** and per-subject attendance graph.
    * **Simulated Webcam Access** for attendance marking, mimicking a real-world facial recognition check-in.
* **Teacher Dashboard:**
    * Dynamically loads the **current student roster** from `students.csv`.
    * Provides **summary statistics** (total students, average attendance).
    * Allows teachers to view **detailed attendance records** (tabular and graphical) for individual students in their respective subjects.
* **Data Driven:** Credentials and student rosters are managed using simple `.csv` files for easy updates and maintenance.

## 🛠️ Setup and Installation

This is a front-end only application and requires no complex server-side setup.

### Prerequisites

You only need a modern web browser (Chrome, Firefox, Edge, Safari).

### Running Locally

1.  **Clone or Download:** Get all the project files (`index.html`, `style.css`, `script.js`, `students.csv`, etc.).
2.  **Open:** Open the main file, **`index.html`**, in your web browser.

> **Note:** Due to browser security restrictions (CORS), some browsers may block the `fetch` request for the local `.csv` files (`students.csv`, `teachers.csv`) when opened directly via `file:///`. If you encounter issues, you should run the project using a simple local web server (like Python's `http.server` or VS Code's Live Server extension).

## 🔑 Default Credentials

The system uses data found in the `students.csv` and `teachers.csv` files.

| Role | College ID | Password |
| :--- | :--- | :--- |
| **Student (Alice)** | `S1001` | `pass123` |
| **Student (Bob)** | `S1002` | `attend` |
| **Teacher (Dr. Smith)** | `T2001` | `teach` |

## 📂 Project Structure

| File/Folder | Description |
| :--- | :--- |
| `index.html` | The landing page for role selection. |
| `student-login.html` | Student login page. |
| `teacher-login.html` | Teacher login page. |
| `student-dashboard.html` | Student's main attendance dashboard (graph/webcam). |
| `teacher-dashboard.html` | Teacher's main roster and summary dashboard. |
| **`student-details.html`** | **NEW!** Detailed, per-student attendance report (tabulated and graphed). |
| **`script.js`** | **Core Logic:** Handles CSV parsing, login authentication, dashboard setup, graph generation, and navigation. |
| **`style.css`** | **Styling:** Provides the clean, dark-theme aesthetic and responsive layout. |
| `students.csv` | List of all student IDs, passwords, and names. |
| `teachers.csv` | List of all teacher IDs, passwords, and course names. |

---

## 💡 Future Enhancements

* Integration with a **real face recognition API** (e.g., Face++ or AWS Rekognition) to move beyond simulation.
* Persistent storage (Database/Local Storage) for daily attendance records instead of simulation.
* Filtering/Sorting options on the Teacher Roster table.
* PDF generation for detailed attendance reports.

---
<img width="1856" height="917" alt="Screenshot 2025-11-28 133546" src="https://github.com/user-attachments/assets/47ae1013-bf7d-47dc-aacb-45255e67c69e" />

