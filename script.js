// ---------------------------
//  Load face-api.js models
// ---------------------------
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("models")
]).then(startVideo);

const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const ctx = overlay.getContext("2d");

// ------------------------------------------------
// Start webcam
// ------------------------------------------------
function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => video.srcObject = stream)
        .catch(err => console.error(err));
}

// ------------------------------------------------
// Load labeled face images (training data)
// ------------------------------------------------
async function loadLabeledImages() {
    const labels = ["Shreyansh", "Person2"]; // <-- Your known faces

    return Promise.all(
        labels.map(async label => {
            const imgUrl = `known_faces/${label}.jpg`;
            const img = await faceapi.fetchImage(imgUrl);

            const detections = await faceapi
                .detectSingleFace(img)
                .withFaceLandmarks()
                .withFaceDescriptor();

            return new faceapi.LabeledFaceDescriptors(label, [detections.descriptor]);
        })
    );
}

let faceMatcher;

// ------------------------------------------------
// Attendance Table Logic
// ------------------------------------------------
const attendanceTable = document.querySelector("#attendanceTable tbody");

function markAttendance(name) {
    const time = new Date().toLocaleTimeString();

    const row = `
        <tr>
            <td>${name}</td>
            <td>${time}</td>
        </tr>
    `;

    attendanceTable.innerHTML += row;
}

// ------------------------------------------------
// Start Attendance Button
// ------------------------------------------------
document.getElementById("startBtn").addEventListener("click", async () => {
    const labeledImages = await loadLabeledImages();
    faceMatcher = new faceapi.FaceMatcher(labeledImages, 0.6);

    setInterval(async () => {
        const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();

        ctx.clearRect(0, 0, overlay.width, overlay.height);

        detections.forEach(detection => {
            const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
            const { label } = bestMatch;

            const box = detection.detection.box;
            ctx.strokeStyle = "lime";
            ctx.lineWidth = 3;
            ctx.strokeRect(box.x, box.y, box.width, box.height);

            ctx.fillStyle = "lime";
            ctx.fillText(label, box.x, box.y - 5);

            if (label !== "unknown") {
                markAttendance(label);
            }
        });
    }, 500);
});

// ------------------------------------------------
// Download Attendance CSV
// ------------------------------------------------
document.getElementById("downloadBtn").addEventListener("click", () => {
    let csv = "Name,Time\n";

    document.querySelectorAll("#attendanceTable tbody tr").forEach(row => {
        const cols = row.querySelectorAll("td");
        csv += `${cols[0].innerText},${cols[1].innerText}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance.csv";
    a.click();
});
