export const initOneSignal = () => {
  if (typeof window === 'undefined') return;
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
  if (!appId) {
    console.log("OneSignal App ID not configured. Running without OneSignal Push.");
    return;
  }
  
  window.OneSignal = window.OneSignal || [];
  window.OneSignal.push(function() {
    window.OneSignal.init({
      appId: appId,
      allowLocalhostAsSecureOrigin: true,
      notifyButton: {
        enable: false
      }
    });
  });
};

export const subscribeAdmin = () => {
  if (typeof window === 'undefined') return;
  window.OneSignal = window.OneSignal || [];
  window.OneSignal.push(function() {
    // Prompt the user to subscribe for notifications
    window.OneSignal.showSlidedownPrompt();
    
    // Tag this device as admin so it receives order notifications
    if (window.OneSignal.User) {
      window.OneSignal.User.addTag("role", "admin");
    } else {
      // Legacy SDK support
      window.OneSignal.sendTag("role", "admin");
    }
    console.log("Device subscribed and tagged as 'admin' in OneSignal.");
  });
};

export const sendOneSignalNotification = async (orderId, tableNumber, totalAmount) => {
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
  const restApiKey = import.meta.env.VITE_ONESIGNAL_REST_API_KEY;
  if (!appId || !restApiKey) {
    console.log("OneSignal credentials not fully configured. Skipping push notification.");
    return;
  }
  
  try {
    const payload = {
      app_id: appId,
      filters: [
        { field: "tag", key: "role", relation: "=", value: "admin" }
      ],
      headings: { en: `☕ New Order #${orderId}!` },
      contents: { en: `Table ${tableNumber} placed an order of Rs. ${totalAmount}` },
      url: `${window.location.origin}/admin/dashboard`
    };
    
    await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${restApiKey}`
      },
      body: JSON.stringify(payload)
    });
    console.log("OneSignal push notification successfully sent to admins.");
  } catch (err) {
    console.error("Failed to send push notification via OneSignal:", err);
  }
};
