/** Registrácia service workera pre offline režim. Beží len v prehliadači. */
export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  // V editor preview (iframe s HMR) registráciu preskočíme, aby nekolidovala s dev serverom.
  if (import.meta.env.DEV) return;

  const register = () => {
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
      console.warn("[pwa] service worker sa nepodarilo zaregistrovať", error);
    });
  };

  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
}
