// --- Stopwatch Functions ---
let stopwatchInterval = null;
let stopwatchSeconds = 0;
let isStopwatchRunning = false;

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateStopwatchDisplay() {
    const stopwatchEl = document.getElementById('stopwatch');
    if (stopwatchEl) {
        stopwatchEl.textContent = formatTime(stopwatchSeconds);
    }
}

function startStopwatch() {
    if (!isStopwatchRunning) {
        stopwatchInterval = setInterval(() => {
            stopwatchSeconds++;
            updateStopwatchDisplay();
        }, 1000);
        isStopwatchRunning = true;
    }
}

function stopStopwatch() {
    if (stopwatchInterval) {
        clearInterval(stopwatchInterval);
        stopwatchInterval = null;
        isStopwatchRunning = false;
    }
}

function resetStopwatch() {
    stopStopwatch();
    stopwatchSeconds = 0;
    updateStopwatchDisplay();
}

function autoStartStopwatch() {
    if (!isStopwatchRunning) {
        startStopwatch();
    }
}

// Make functions accessible globally if needed
window.formatTime = formatTime;
window.updateStopwatchDisplay = updateStopwatchDisplay;
window.startStopwatch = startStopwatch;
window.stopStopwatch = stopStopwatch;
window.resetStopwatch = resetStopwatch;
window.autoStartStopwatch = autoStartStopwatch;
window.stopwatchSeconds = stopwatchSeconds;
window.isStopwatchRunning = isStopwatchRunning;