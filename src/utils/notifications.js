// Web Audio API Sound Synthesizer (Zero-asset double-chime)
export const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    // First chime note
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    osc1.start();
    osc1.stop(ctx.currentTime + 0.15);
    
    // Second chime note (slightly delayed)
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain2.gain.setValueAtTime(0.08, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        
        osc2.start();
        osc2.stop(ctx.currentTime + 0.25);
      } catch (err) {
        // Fallback catch for browser state adjustments
      }
    }, 120);
  } catch (error) {
    console.warn("Web Audio chime failed or blocked by browser policy:", error);
  }
};

// Vibration helper (gentle double vibration)
export const triggerVibration = (pattern = [100, 50, 100]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignore vibration error on unsupported platforms
    }
  }
};

// Request Browser Notifications API permissions
export const requestNotificationPermission = async () => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (err) {
        console.warn("Failed to request notification permission:", err);
      }
    }
  }
};

// Display Browser Push Notification
export const showBrowserNotification = (title, options = {}) => {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/favicon.svg',
        ...options
      });
    } catch (e) {
      console.warn("Could not display browser background notification:", e);
    }
  }
};
