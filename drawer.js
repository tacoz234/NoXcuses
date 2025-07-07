// --- Drawer Logic ---
const drawer = document.getElementById('workoutDrawer');
const drawerContent = document.getElementById('drawerContent');
const drawerTab = document.getElementById('drawerTab');
let isOpen = false, startY = 0, currentY = 0, isDragging = false;
const NAVBAR_HEIGHT = 150;
const PULL_TAB_HEIGHT = 32;

function openDrawer() {
    drawer.style.pointerEvents = 'auto';
    drawer.style.backgroundColor = 'rgba(16,24,40,0.85)';
    drawerContent.style.transform = 'translateY(0)';
    drawerContent.style.position = 'fixed';
    drawerContent.style.bottom = '0';
    drawerContent.style.maxHeight = '95vh';
    drawerContent.style.overflowY = 'auto';
    isOpen = true;
    drawerContent.style.pointerEvents = 'auto';
    drawerTab.style.pointerEvents = 'auto';
}

function closeDrawer() {
    drawer.style.pointerEvents = 'none';
    drawer.style.backgroundColor = 'transparent';
    drawerContent.style.transform = `translateY(calc(100vh - ${NAVBAR_HEIGHT}px - ${PULL_TAB_HEIGHT}px))`;
    drawerContent.style.position = 'fixed';
    drawerContent.style.bottom = '0';
    drawerContent.style.overflowY = 'hidden';
    isOpen = false;
    drawerContent.style.pointerEvents = 'auto';
    drawerTab.style.pointerEvents = 'auto';
}

function attachDrawerEvents() {
    drawerTab.addEventListener('click', openDrawer);
    drawerTab.addEventListener('touchstart', function(e) {
        if (e.touches.length !== 1) return;
        isDragging = true;
        startY = e.touches[0].clientY;
        drawerContent.style.overflowY = 'hidden';
    });
    drawerTab.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        e.preventDefault();
        currentY = e.touches[0].clientY;
        let dy = currentY - startY;
        if (dy > 0) {
            drawerContent.style.transform = `translateY(${dy}px)`;
        }
    });
    drawerTab.addEventListener('touchend', function(e) {
        if (!isDragging) return;
        isDragging = false;
        let dy = currentY - startY;
        if (dy > 100) {
            closeDrawer();
        } else {
            drawerContent.style.transform = 'translateY(0)';
            drawerContent.style.overflowY = 'auto';
        }
    });
}

window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;
window.attachDrawerEvents = attachDrawerEvents;