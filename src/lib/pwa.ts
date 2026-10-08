/** Only the published, top-level application may register the shell worker. */
export async function registerShellWorker() {
  if (!('serviceWorker' in navigator)) return;
  const hostname = window.location.hostname;
  const preview = hostname.startsWith('id-preview--') || hostname.startsWith('preview--') ||
    ['lovableproject.com', 'lovableproject-dev.com', 'beta.lovable.dev'].some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
  const refuse = !import.meta.env.PROD || window.self !== window.top || preview || new URLSearchParams(window.location.search).get('sw') === 'off';
  if (refuse) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.filter(registration => {
      const script = registration.active?.scriptURL ?? registration.waiting?.scriptURL ?? registration.installing?.scriptURL;
      return script && new URL(script).pathname === '/sw.js';
    }).map(registration => registration.unregister()));
    return;
  }
  await navigator.serviceWorker.register('/sw.js');
}