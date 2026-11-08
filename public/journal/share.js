/* Browser-native sharing only. No third-party scripts or tracking. */
(() => {
  const button = document.querySelector('[data-share]');
  if (!button) return;
  button.hidden = false;
  const es = document.documentElement.lang === 'es';
  button.addEventListener('click', async () => {
    const url = document.querySelector('link[rel="canonical"]').href;
    const title = document.querySelector('h1').textContent;
    const status = document.querySelector('[data-share-status]');
    try {
      if (navigator.share) await navigator.share({title, url});
      else {
        await navigator.clipboard.writeText(url);
        status.textContent = es ? 'Enlace copiado.' : 'Link copied.';
      }
    } catch (error) {
      if (error.name !== 'AbortError') status.textContent = (es ? 'Copia este enlace: ' : 'Copy this link: ') + url;
    }
  });
})();
