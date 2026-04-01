import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const PWA_CACHE_RESET_KEY = "dd_pwa_cache_reset_v20260401";

const clearClientCaches = async () => {
  const tasks: Promise<unknown>[] = [];

  if ("serviceWorker" in navigator) {
    tasks.push(
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    );
  }

  if ("caches" in window) {
    tasks.push(caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))));
  }

  if (tasks.length === 0) return false;
  await Promise.all(tasks);
  return true;
};

const registerPwa = () => {
  if (!import.meta.env.PROD) return;

  const startRegistration = () => {
    void import("virtual:pwa-register").then(({ registerSW }) => registerSW({ immediate: true })());
  };

  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(startRegistration);
    return;
  }

  setTimeout(startRegistration, 3000);
};

const bootstrap = async () => {
  try {
    const hasReset = localStorage.getItem(PWA_CACHE_RESET_KEY) === "1";

    if (!hasReset) {
      const cleared = await clearClientCaches();

      if (cleared) {
        localStorage.setItem(PWA_CACHE_RESET_KEY, "1");
        window.location.reload();
        return;
      }
    }
  } catch (error) {
    console.warn("[PWA Cache Reset Failed]", error);
  }

  createRoot(document.getElementById("root")!).render(<App />);
  registerPwa();
};

void bootstrap();
