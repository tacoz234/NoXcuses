// Global Rest Timer Monitoring System
// This script should be included on all pages to enable cross-page notifications

class GlobalRestTimer {
    constructor() {
        this.checkInterval = null;
        this.notificationPermission = null;
        this.hasShownNotification = false; // Flag to prevent repeated notifications
        this.init();
    }

    async init() {
        // Request notification permission
        await this.requestNotificationPermission();
        
        // Start monitoring for active timers
        this.startMonitoring();
        
        // Listen for storage changes (when timer is updated from workout page)
        window.addEventListener('storage', (e) => {
            if (e.key === 'activeRestTimer') {
                this.handleTimerUpdate();
            }
        });
        
        // Also check immediately when page loads
        this.handleTimerUpdate();
    }

    async requestNotificationPermission() {
        if ('Notification' in window) {
            this.notificationPermission = await Notification.requestPermission();
            console.log('Notification permission:', this.notificationPermission);
        } else {
            console.log('Browser does not support notifications');
        }
    }

    startMonitoring() {
        // Check every second for timer updates
        this.checkInterval = setInterval(() => {
            this.checkTimerStatus();
        }, 1000);
    }

    handleTimerUpdate() {
        // Reset notification flag when timer data changes (new timer started)
        this.hasShownNotification = false;
        this.checkTimerStatus();
    }

    checkTimerStatus() {
        const savedTimer = localStorage.getItem('activeRestTimer');
        const isWorkoutActive = localStorage.getItem('isWorkoutActive') === '1';
        
        if (!savedTimer || !isWorkoutActive) {
            // Reset notification flag when no timer is active
            this.hasShownNotification = false;
            return;
        }

        try {
            const timerData = JSON.parse(savedTimer);
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - timerData.lastUpdateTime) / 1000);
            const remainingTime = Math.max(0, timerData.remainingSeconds - elapsedSeconds);

            // If timer has expired and we're not on the workout page and haven't shown notification yet
            if (remainingTime <= 0 && !this.isOnWorkoutPage() && !this.hasShownNotification) {
                this.showCrossPageNotification(timerData);
                // Clean up the expired timer
                localStorage.removeItem('activeRestTimer');
                // Mark that we've shown the notification
                this.hasShownNotification = true;
            }
        } catch (e) {
            console.error('Error checking timer status:', e);
        }
    }

    isOnWorkoutPage() {
        return window.location.pathname.includes('workout.html');
    }

    showCrossPageNotification(timerData) {
        const exerciseName = timerData.exerciseName || 'Exercise';
        const setNumber = (timerData.setIndex || 0) + 1;
        
        console.log('Showing cross-page notification for:', exerciseName, 'Set', setNumber);
        
        // Play notification sound
        this.playNotificationSound();
        
        // Show browser notification if permission granted
        if (this.notificationPermission === 'granted') {
            const notification = new Notification('Rest Timer Complete!', {
                body: `Time for your next set of ${exerciseName} (Set ${setNumber})`,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                tag: 'rest-timer', // Prevents duplicate notifications
                requireInteraction: true // Keeps notification visible until user interacts
                // Removed actions property - not supported in regular notifications
            });

            notification.onclick = () => {
                window.focus();
                window.location.href = 'workout.html';
                notification.close();
            };

            // Auto-close after 10 seconds if user doesn't interact
            setTimeout(() => {
                notification.close();
            }, 10000);
        }
        
        // Also show an in-page alert as fallback
        if (typeof showAlert === 'function') {
            showAlert(`Rest timer finished! Time for your next set of ${exerciseName}.`, 'Rest Complete');
        } else {
            // Fallback alert
            alert(`Rest timer finished! Time for your next set of ${exerciseName}.`);
        }
    }

    playNotificationSound() {
        try {
            // Create an audio context and play a beep sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800 Hz tone
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Audio not supported or failed:', error);
        }
    }

    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
}

// Initialize global timer monitoring when page loads
let globalRestTimer;
document.addEventListener('DOMContentLoaded', () => {
    globalRestTimer = new GlobalRestTimer();
});

// Clean up when page unloads
window.addEventListener('beforeunload', () => {
    if (globalRestTimer) {
        globalRestTimer.destroy();
    }
});