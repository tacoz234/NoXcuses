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
        } else {
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

    createCustomNotificationModal(timerData) {
        // Remove any existing notification modal
        const existingModal = document.getElementById('restTimerNotificationModal');
        if (existingModal) {
            existingModal.remove();
        }

        const exerciseName = timerData.exerciseName || 'Exercise';
        const setNumber = (timerData.setIndex || 0) + 1;

        // Create the modal HTML
        const modalHTML = `
            <div id="restTimerNotificationModal" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[200] animate-fadeIn">
                <div class="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 transform animate-slideUp">
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-lg">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="bg-white bg-opacity-20 rounded-full p-2 mr-3">
                                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-lg font-bold">Rest Timer Complete!</h3>
                                    <p class="text-blue-100 text-sm">Time for your next set</p>
                                </div>
                            </div>
                            <button id="closeRestNotification" class="text-white hover:text-gray-200 text-2xl font-bold">&times;</button>
                        </div>
                    </div>
                    
                    <!-- Body -->
                    <div class="p-6">
                        <div class="text-center mb-6">
                            <div class="bg-gray-100 rounded-lg p-4 mb-4">
                                <h4 class="text-xl font-semibold text-gray-800 mb-1">${exerciseName}</h4>
                                <p class="text-gray-600">Set ${setNumber}</p>
                            </div>
                            <p class="text-gray-700">Ready to continue your workout?</p>
                        </div>
                        
                        <!-- Action Buttons -->
                        <div class="flex space-x-3">
                            <button id="goToWorkoutBtn" class="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 transform hover:scale-105">
                                Go to Workout
                            </button>
                            <button id="dismissNotificationBtn" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200">
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add CSS animations if not already present
        if (!document.getElementById('restTimerNotificationStyles')) {
            const styles = document.createElement('style');
            styles.id = 'restTimerNotificationStyles';
            styles.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                .animate-slideUp {
                    animation: slideUp 0.3s ease-out;
                }
            `;
            document.head.appendChild(styles);
        }

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add event listeners
        const modal = document.getElementById('restTimerNotificationModal');
        const closeBtn = document.getElementById('closeRestNotification');
        const goToWorkoutBtn = document.getElementById('goToWorkoutBtn');
        const dismissBtn = document.getElementById('dismissNotificationBtn');

        const closeModal = () => {
            modal.style.animation = 'fadeIn 0.2s ease-out reverse';
            setTimeout(() => {
                modal.remove();
            }, 200);
        };

        closeBtn.onclick = closeModal;
        dismissBtn.onclick = closeModal;
        
        goToWorkoutBtn.onclick = () => {
            window.location.href = 'workout.html';
        };

        // Close on background click
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal();
            }
        };

        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Auto-close after 15 seconds
        setTimeout(() => {
            if (document.getElementById('restTimerNotificationModal')) {
                closeModal();
            }
        }, 15000);

        return modal;
    }

    showCrossPageNotification(timerData) {
        const exerciseName = timerData.exerciseName || 'Exercise';
        const setNumber = (timerData.setIndex || 0) + 1;
        
        
        // Play notification sound
        this.playNotificationSound();
        
        // Show custom in-page notification modal
        this.createCustomNotificationModal(timerData);
        
        // Also show browser notification if permission granted (as backup)
        if (this.notificationPermission === 'granted') {
            const notification = new Notification('Rest Timer Complete!', {
                body: `Time for your next set of ${exerciseName} (Set ${setNumber})`,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                tag: 'rest-timer',
                requireInteraction: false // Don't require interaction since we have custom modal
            });

            notification.onclick = () => {
                window.focus();
                window.location.href = 'workout.html';
                notification.close();
            };

            // Auto-close browser notification quickly since we have custom modal
            setTimeout(() => {
                notification.close();
            }, 3000);
        }
    }

    playNotificationSound() {
        try {
            // Create an audio context and play a pleasant notification sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create a more pleasant notification sound (two-tone chime)
            const playTone = (frequency, startTime, duration) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(frequency, startTime);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                
                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            };
            
            // Play a pleasant two-tone chime
            const now = audioContext.currentTime;
            playTone(800, now, 0.3);      // First tone
            playTone(1000, now + 0.15, 0.3); // Second tone (slightly delayed and higher)
            
        } catch (error) {
        }
    }

    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        
        // Remove any existing notification modal
        const existingModal = document.getElementById('restTimerNotificationModal');
        if (existingModal) {
            existingModal.remove();
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