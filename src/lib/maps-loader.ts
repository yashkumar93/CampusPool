export function loadMapsScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.maps) return Promise.resolve();
  if (window.__campuspoolMapsLoading) return window.__campuspoolMapsLoading;

  const key = process.env.NEXT_PUBLIC_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
  const channel = process.env.NEXT_PUBLIC_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
  if (!key) return Promise.reject(new Error("Google Maps browser key missing"));

  window.__campuspoolMapsLoading = new Promise<void>((resolve, reject) => {
    window.__campuspoolMapsCb = () => resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__campuspoolMapsCb${
      channel ? `&channel=${channel}` : ""
    }&libraries=places`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return window.__campuspoolMapsLoading;
}
