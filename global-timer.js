// Global Rest Timer Monitoring System
// This script should be included on all pages to enable cross-page notifications

class GlobalRestTimer {
    constructor() {
        this.checkInterval = null;
        this.notificationPermission = null;
        this.hasShownNotification = false;
        this.serviceWorkerRegistration = null;
        this.audioContext = null; // Add audio context for sound
        this.isPageVisible = !document.hidden;
        this.backgroundStartTime = null;
        this.init();
    }

    async init() {
        // Only request notification permission if not already handled
        await this.checkNotificationPermission();
        
        // Get service worker registration
        if ('serviceWorker' in navigator) {
            this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
        }
        
        // Set up service worker communication
        this.setupServiceWorkerCommunication();
        
        // Start monitoring for active timers
        this.startMonitoring();
        
        // Listen for storage changes
        window.addEventListener('storage', (e) => {
            if (e.key === 'activeRestTimer') {
                this.handleTimerUpdate();
                this.sendTimerDataToServiceWorker();
            }
        });
        
        // **NEW: Add Page Visibility API handling**
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
        
        // **NEW: Add focus/blur handling for additional reliability**
        window.addEventListener('focus', () => {
            this.handlePageFocus();
        });
        
        window.addEventListener('blur', () => {
            this.handlePageBlur();
        });
        
        // Send initial timer data to service worker
        this.sendTimerDataToServiceWorker();
        
        // Also check immediately when page loads
        this.handleTimerUpdate();
        
        // Initialize audio context on first user interaction
        this.initializeAudioOnUserInteraction();
    }

    // **NEW: Handle visibility changes**
    handleVisibilityChange() {
        if (document.hidden) {
            // Page is going to background
            this.handlePageBlur();
        } else {
            // Page is coming to foreground
            this.handlePageFocus();
        }
    }

    // **NEW: Handle page going to background**
    handlePageBlur() {
        this.isPageVisible = false;
        this.backgroundStartTime = Date.now();
        
        // Update timer state before going to background
        this.updateTimerStateBeforeBackground();
        
        // Ensure service worker has latest data
        this.sendTimerDataToServiceWorker();
        
        console.log('Page going to background, timer state updated');
    }

    // **NEW: Handle page coming to foreground**
    handlePageFocus() {
        this.isPageVisible = true;
        
        // Calculate time spent in background
        const backgroundDuration = this.backgroundStartTime ? 
            Date.now() - this.backgroundStartTime : 0;
        
        console.log(`Page returning to foreground after ${backgroundDuration}ms`);
        
        // Update timer state after returning from background
        this.updateTimerStateAfterBackground(backgroundDuration);
        
        // Force immediate timer check
        this.checkTimerStatus();
        
        this.backgroundStartTime = null;
    }

    // **NEW: Update timer state before going to background**
    updateTimerStateBeforeBackground() {
        const savedTimer = localStorage.getItem('activeRestTimer');
        if (savedTimer) {
            try {
                const timerData = JSON.parse(savedTimer);
                // Update the lastUpdateTime to current time
                timerData.lastUpdateTime = Date.now();
                localStorage.setItem('activeRestTimer', JSON.stringify(timerData));
            } catch (e) {
                console.error('Error updating timer state before background:', e);
            }
        }
    }

    // **NEW: Update timer state after returning from background**
    updateTimerStateAfterBackground(backgroundDuration) {
        const savedTimer = localStorage.getItem('activeRestTimer');
        if (savedTimer) {
            try {
                const timerData = JSON.parse(savedTimer);
                const now = Date.now();
                
                // Calculate elapsed time including background time
                const totalElapsed = Math.floor((now - timerData.lastUpdateTime) / 1000);
                const newRemainingTime = Math.max(0, timerData.remainingSeconds - totalElapsed);
                
                // Update timer data
                timerData.remainingSeconds = newRemainingTime;
                timerData.lastUpdateTime = now;
                
                // If timer expired while in background, mark it
                if (newRemainingTime <= 0 && !timerData.notificationShown) {
                    console.log('Timer expired while in background');
                    // Don't show notification here - let the normal check handle it
                }
                
                localStorage.setItem('activeRestTimer', JSON.stringify(timerData));
                
                // Send updated data to service worker
                this.sendTimerDataToServiceWorker();
                
            } catch (e) {
                console.error('Error updating timer state after background:', e);
            }
        }
    }

    async checkNotificationPermission() {
        if ('Notification' in window) {
            // Always check current permission status
            this.notificationPermission = Notification.permission;
            
            // For iOS PWA, we need to be more aggressive about requesting permission
            if (this.notificationPermission === 'default') {
                // Show a more iOS-friendly permission request
                const userWantsNotifications = confirm(
                    '🔔 Enable Rest Timer Notifications?\n\nGet notified when your rest timer finishes, even when the app is in the background.\n\n⚠️ Important: Make sure you\'ve added this app to your Home Screen for notifications to work on iOS.'
                );
                
                if (userWantsNotifications) {
                    try {
                        this.notificationPermission = await Notification.requestPermission();
                        
                        // For iOS, also show instructions if permission granted
                        if (this.notificationPermission === 'granted') {
                            console.log('✅ Notifications enabled! Make sure the app is added to your Home Screen.');
                            
                            // Test notification to verify it works
                            setTimeout(() => {
                                this.showTestNotification();
                            }, 1000);
                        }
                    } catch (error) {
                        console.error('Error requesting notification permission:', error);
                        this.notificationPermission = 'denied';
                    }
                } else {
                    this.notificationPermission = 'denied';
                }
            }
            
            // Store permission result
            localStorage.setItem('notification-permission-result', this.notificationPermission);
            
            console.log('Notification permission:', this.notificationPermission);
            
            // Show iOS-specific instructions if needed
            if (this.notificationPermission === 'denied') {
                console.warn('❌ Notifications blocked. To enable:\n1. Add app to Home Screen\n2. Go to Settings > Notifications > [App Name]\n3. Enable notifications');
            }
        } else {
            console.warn('Notifications not supported in this browser');
            this.notificationPermission = 'denied';
        }
    }
    
    // Add test notification method
    showTestNotification() {
        if (this.notificationPermission === 'granted' && this.serviceWorkerRegistration) {
            this.serviceWorkerRegistration.showNotification('🎉 Notifications Enabled!', {
                body: 'You\'ll now receive rest timer alerts even when the app is in the background.',
                icon: './icon-3.png',
                badge: './icon-3.png',
                tag: 'test-notification',
                requireInteraction: false,
                vibrate: [200, 100, 200]
            });
        }
    }
    initializeAudioOnUserInteraction() {
        const initAudio = async () => {
            if (!this.audioContext) {
                try {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    
                    // Test the audio context immediately
                    if (this.audioContext.state === 'suspended') {
                        await this.audioContext.resume();
                    }
                    
                    console.log('AudioContext initialized successfully, state:', this.audioContext.state);
                    
                    // Remove the event listeners once audio context is created and working
                    document.removeEventListener('click', initAudio);
                    document.removeEventListener('touchstart', initAudio);
                    document.removeEventListener('keydown', initAudio);
                    document.removeEventListener('touchend', initAudio);
                    
                } catch (error) {
                    console.warn('Could not create audio context:', error);
                }
            }
        };
        
        // Listen for any user interaction to initialize audio
        document.addEventListener('click', initAudio);
        document.addEventListener('touchstart', initAudio);
        document.addEventListener('touchend', initAudio);
        document.addEventListener('keydown', initAudio);
    }

    // New method to send timer data to service worker
    sendTimerDataToServiceWorker() {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            const timerData = this.getTimerDataForServiceWorker();
            navigator.serviceWorker.controller.postMessage({
                type: 'UPDATE_TIMER_DATA',
                timerData: timerData
            });
        }
    }

    startMonitoring() {
        // Check every second for timer updates
        this.checkInterval = setInterval(() => {
            this.checkTimerStatus();
            // Also send updated data to service worker
            this.sendTimerDataToServiceWorker();
        }, 1000);
    }

    setupServiceWorkerCommunication() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'GET_TIMER_DATA') {
                    // Send timer data to service worker
                    const timerData = this.getTimerDataForServiceWorker();
                    if (event.ports && event.ports[0]) {
                        event.ports[0].postMessage(timerData);
                    }
                } else if (event.data.type === 'MARK_NOTIFICATION_SHOWN') {
                    // Mark notification as shown in localStorage
                    const savedTimer = localStorage.getItem('activeRestTimer');
                    if (savedTimer) {
                        try {
                            const timerData = JSON.parse(savedTimer);
                            timerData.notificationShown = true;
                            localStorage.setItem('activeRestTimer', JSON.stringify(timerData));
                            console.log('Marked notification as shown via SW message');
                        } catch (e) {
                            console.error('Error updating notification status:', e);
                        }
                    }
                }
            });
        }
    }

    getTimerDataForServiceWorker() {
        const savedTimer = localStorage.getItem('activeRestTimer');
        const isWorkoutActive = localStorage.getItem('isWorkoutActive') === '1';
        
        if (!savedTimer || !isWorkoutActive) {
            return null;
        }
        
        try {
            const timerData = JSON.parse(savedTimer);
            return {
                ...timerData,
                isWorkoutActive: isWorkoutActive
            };
        } catch (e) {
            return null;
        }
    }

    startMonitoring() {
        // Check every second for timer updates
        this.checkInterval = setInterval(() => {
            this.checkTimerStatus();
        }, 1000);
    }

    handleTimerUpdate() {
        // Reset notification flag when timer data changes
        this.hasShownNotification = false;
        this.checkTimerStatus();
    }

    checkTimerStatus() {
        const savedTimer = localStorage.getItem('activeRestTimer');
        const isWorkoutActive = localStorage.getItem('isWorkoutActive') === '1';
        
        if (!savedTimer || !isWorkoutActive) {
            this.hasShownNotification = false;
            return;
        }

        try {
            const timerData = JSON.parse(savedTimer);
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - timerData.lastUpdateTime) / 1000);
            const remainingTime = Math.max(0, timerData.remainingSeconds - elapsedSeconds);

            // **ENHANCED: Better notification logic**
            if (remainingTime <= 0 && !this.hasShownNotification && !timerData.notificationShown) {
                console.log('Timer expired, showing notification. Page visible:', this.isPageVisible);
                
                if (this.isPageVisible && this.isOnWorkoutPage()) {
                    // Show in-page notification if on workout page and visible
                    this.showCrossPageNotification(timerData);
                } else {
                    // Show background notification via service worker
                    this.showBackgroundNotification(timerData);
                }
                
                // Mark notification as shown
                timerData.notificationShown = true;
                localStorage.setItem('activeRestTimer', JSON.stringify(timerData));
                
                this.hasShownNotification = true;
            }
        } catch (e) {
            console.error('Error checking timer status:', e);
        }
    }

    async showBackgroundNotification(timerData) {
        if (this.serviceWorkerRegistration && this.notificationPermission === 'granted') {
            const exerciseName = timerData.exerciseName || 'Exercise';
            const setNumber = (timerData.setIndex || 0) + 1;
            
            await this.serviceWorkerRegistration.showNotification('Rest Timer Complete! 💪', {
                body: `Time for your next set of ${exerciseName} (Set ${setNumber})`,
                icon: './icon-3.png',
                badge: './icon-3.png',
                tag: 'rest-timer',
                requireInteraction: true,
                vibrate: [200, 100, 200, 100, 200],
                actions: [
                    {
                        action: 'open-workout',
                        title: 'Go to Workout'
                    },
                    {
                        action: 'dismiss',
                        title: 'Dismiss'
                    }
                ],
                data: {
                    exerciseName: exerciseName,
                    setNumber: setNumber,
                    url: './workout.html'
                }
            });
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
                icon: '/icon-3.png',
                badge: '/icon-3.png',
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
            // Ensure we have an audio context
            if (!this.audioContext) {
                console.warn('AudioContext not initialized - sound may not play');
                return;
            }
            
            // Check if audio context is suspended and try to resume
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    this.playActualSound();
                }).catch(error => {
                    console.warn('Could not resume audio context:', error);
                    this.tryFallbackSound();
                });
            } else if (this.audioContext.state === 'running') {
                this.playActualSound();
            } else {
                console.warn('AudioContext in unexpected state:', this.audioContext.state);
                this.tryFallbackSound();
            }
            
        } catch (error) {
            console.warn('Could not play notification sound:', error);
            this.tryFallbackSound();
        }
    }

    playActualSound() {
        try {
            // Create a more pleasant notification sound (two-tone chime)
            const playTone = (frequency, startTime, duration) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(frequency, startTime);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05); // Increased volume
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                
                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            };
            
            // Play a pleasant two-tone chime
            const now = this.audioContext.currentTime;
            playTone(800, now, 0.4);      // First tone (longer)
            playTone(1000, now + 0.2, 0.4); // Second tone (slightly delayed and higher)
            
            console.log('Notification sound played successfully');
        } catch (error) {
            console.warn('Could not play Web Audio sound:', error);
            this.tryFallbackSound();
        }
    }

    tryFallbackSound() {
        try {
            // Enhanced fallback with multiple attempts
            const audio = new Audio();
            audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
            audio.volume = 0.7;
            
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('Fallback audio played successfully');
                }).catch(error => {
                    console.warn('Fallback audio failed:', error);
                    // Try system beep as last resort
                    this.trySystemBeep();
                });
            }
        } catch (fallbackError) {
            console.warn('All audio methods failed:', fallbackError);
            this.trySystemBeep();
        }
    }

    trySystemBeep() {
        try {
            // Try to trigger system notification sound
            if ('vibrate' in navigator) {
                navigator.vibrate([200, 100, 200]);
            }
            console.log('Using vibration as audio fallback');
        } catch (error) {
            console.warn('Even vibration failed:', error);
        }
    }
    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        
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
    // Make it globally accessible for other scripts
    window.globalRestTimer = globalRestTimer;
});

window.addEventListener('beforeunload', () => {
    if (globalRestTimer) {
        globalRestTimer.destroy();
    }
});