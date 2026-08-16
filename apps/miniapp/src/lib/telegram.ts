import {
  backButton,
  hapticFeedback,
  init,
  locationManager,
  mainButton,
  miniApp,
  themeParams,
  viewport,
} from '@tma.js/sdk-react';

let booted = false;

export async function bootTelegram() {
  if (booted) return;
  booted = true;
  try {
    init();
    themeParams.mount();
    themeParams.bindCssVars();
    if (miniApp.mount.isAvailable()) miniApp.mount();
    if (viewport.mount.isAvailable()) await viewport.mount();
    if (viewport.expand.isAvailable()) viewport.expand();
    if (backButton.mount.isAvailable()) backButton.mount();
    if (mainButton.mount.isAvailable()) mainButton.mount();
    if (miniApp.ready.isAvailable()) miniApp.ready();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.info('Telegram SDK running in browser fallback mode', error);
    }
  }
}

export function impact(style: 'light' | 'medium' | 'heavy' = 'light') {
  try {
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred(style);
    }
  } catch {
    // Browser fallback.
  }
}

export function notify(type: 'success' | 'warning' | 'error') {
  try {
    if (hapticFeedback.notificationOccurred.isAvailable()) {
      hapticFeedback.notificationOccurred(type);
    }
  } catch {
    // Browser fallback.
  }
}

export async function requestTelegramLocation() {
  try {
    if (locationManager.mount.isAvailable()) await locationManager.mount();
    if (locationManager.requestLocation.isAvailable()) {
      const value = await locationManager.requestLocation();
      if (value) return { latitude: value.latitude, longitude: value.longitude };
    }
  } catch {
    // Use the browser fallback below.
  }

  return new Promise<{ latitude: number; longitude: number; accuracy?: number }>(
    (resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Location is unavailable'));
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }),
        reject,
        { enableHighAccuracy: true, timeout: 10_000 },
      );
    },
  );
}

type InvoiceStatus = 'paid' | 'cancelled' | 'failed' | 'pending';

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      openInvoice?: (url: string, callback?: (status: InvoiceStatus) => void) => void;
    };
  };
};

/**
 * Opens Telegram's native invoice surface. The returned status is UI feedback only;
 * GOOL never treats it as proof of settlement. The server-side successful_payment
 * webhook remains authoritative.
 */
export function openTelegramInvoice(url: string): Promise<InvoiceStatus> {
  const webApp = (window as TelegramWindow).Telegram?.WebApp;
  if (!webApp?.openInvoice) {
    return Promise.reject(
      new Error('Telegram invoice checkout is only available inside the Telegram Mini App.'),
    );
  }

  return new Promise<InvoiceStatus>((resolve) => {
    webApp.openInvoice?.(url, resolve);
  });
}

export { backButton, mainButton, themeParams };
