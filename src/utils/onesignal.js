export const initOneSignal = () => {
  if (typeof window === 'undefined') return;
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID || "0f980016-247d-49f5-9b24-b871b83e4bee";
  
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({
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
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function(OneSignal) {
    try {
      // Prompt the user to subscribe for notifications
      if (OneSignal.Slidedown) {
        await OneSignal.Slidedown.prompt();
      } else if (OneSignal.showSlidedownPrompt) {
        await OneSignal.showSlidedownPrompt();
      }
      
      // Tag this device as admin so it receives order notifications
      if (OneSignal.User && OneSignal.User.addTag) {
        await OneSignal.User.addTag("role", "admin");
      } else if (OneSignal.sendTag) {
        await OneSignal.sendTag("role", "admin");
      }
      console.log("Device subscribed and tagged as 'admin' in OneSignal v16.");
    } catch (e) {
      console.warn("Failed to subscribe admin in OneSignal:", e);
    }
  });
};

export const sendOneSignalNotification = async (orderId, tableNumber, totalAmount) => {
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID || "0f980016-247d-49f5-9b24-b871b83e4bee";
  const restApiKey = import.meta.env.VITE_ONESIGNAL_REST_API_KEY;
  if (!appId || !restApiKey) {
    console.log("OneSignal REST API Key not fully configured. Skipping push notification.");
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
