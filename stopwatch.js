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

function saveStopwatchState() {
    const now = Date.now();
    localStorage.setItem('stopwatchState', JSON.stringify({
        pausedElapsed,
        isStopwatchRunning,
        stopwatchStartTimestamp,
        lastSaved: now
    }));
}

function loadStopwatchState() {
    const state = JSON.parse(localStorage.getItem('stopwatchState') || '{}');
    pausedElapsed = state.pausedElapsed || 0;
    isStopwatchRunning = state.isStopwatchRunning || false;
    stopwatchStartTimestamp = state.stopwatchStartTimestamp || null;
    const lastSaved = state.lastSaved || null;
    if (isStopwatchRunning && lastSaved) {
        // Add the time elapsed while away
        pausedElapsed += Math.floor((Date.now() - lastSaved) / 1000);
        stopwatchStartTimestamp = Date.now();
        startStopwatch();
    } else {
        updateStopwatchDisplay();
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