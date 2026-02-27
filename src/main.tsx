import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Defer PWA service worker registration
if ("requestIdleCallback" in window) {
  (window as any).requestIdleCallback(() => {
    import("virtual:pwa-register").then(({ registerSW }) => registerSW({ immediate: false })());
  });
} else {
  setTimeout(() => {
    import("virtual:pwa-register").then(({ registerSW }) => registerSW({ immediate: false })());
  }, 3000);
}
