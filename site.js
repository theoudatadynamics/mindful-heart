const root = document.documentElement;
root.dataset.theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
document.querySelector('.theme')?.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
});
const tabs = [...document.querySelectorAll('[data-tab]')];
const panel = document.querySelector('#demo-panel');
const quotes = [
  {text: 'The art of being wise is the art of knowing what to overlook.', author: 'William James', source: 'The Principles of Psychology, Volume II · 1890'},
  {text: "Don't wait for extraordinary opportunities. Seize common occasions and make them great.", author: 'Orison Swett Marden', source: 'Pushing to the Front · 1894'},
  {text: 'Before a man can lift himself, he must lift his thought.', author: 'Orison Swett Marden', source: 'Peace, Power and Plenty · 1909'}
];
let quoteIndex = 0;
function showTab(name) {
  if (!panel) return;
  tabs.forEach(tab => {
    const selected = tab.dataset.tab === name;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  panel.setAttribute('aria-labelledby', `tab-${name}`);
  if (name === 'quotes') {
    panel.innerHTML = '<p class="demo-category">A thought to keep</p><p class="demo-thought"></p><p class="demo-author"></p><div class="demo-actions"><button data-copy>Copy quote</button><button data-next>Next thought ↗</button></div><p class="live-status" role="status"></p>';
    const quote = quotes[quoteIndex];
    panel.querySelector('.demo-thought').textContent = quote.text;
    panel.querySelector('.demo-author').textContent = quote.author;
    panel.querySelector('[data-next]').addEventListener('click', () => { quoteIndex = (quoteIndex + 1) % quotes.length; showTab('quotes'); });
    panel.querySelector('[data-copy]').addEventListener('click', async event => {
      const button = event.currentTarget;
      const status = panel.querySelector('[role=status]');
      try {
        await navigator.clipboard.writeText(`${quote.text} — ${quote.author}\n${quote.source}`);
        if (!button.isConnected) return;
        button.textContent = '✓ Copied'; button.classList.add('success');
        status.textContent = 'Sample quote copied. Paste it wherever you need.';
      } catch {
        if (button.isConnected) status.textContent = 'Your browser did not allow copying. You can select the sample quote instead.';
      }
    });
  } else if (name === 'wellness') {
    panel.innerHTML = '<p class="demo-category">Make a little room</p><div class="sample-row"><div><p>Take a breath</p><p>A moment to slow down</p></div><span>Every 60 min</span></div><div class="sample-row"><div><p>Drink some water</p><p>A gentle check-in</p></div><span>At 10:00</span></div><div class="sample-row"><div><p>Step away</p><p>Stand up and stretch</p></div><span>At 15:00</span></div><p class="demo-tip">Illustrative schedules. Each reminder has its own rhythm.</p>';
  } else {
    panel.innerHTML = '<p class="demo-category">Useful words, kept close</p><div class="sample-row"><div><p>Morning planning</p><p>Prompts · Pinned</p></div><span>⌘</span></div><div class="sample-row"><div><p>A note for later</p><p>Personal · Saved</p></div><span>⌘</span></div><div class="sample-row"><div><p>Project checklist</p><p>Work · Saved</p></div><span>⌘</span></div><p class="demo-tip">Sample items only. This preview does not read your clipboard.</p>';
  }
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => showTab(tab.dataset.tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); showTab(tabs[next].dataset.tab); tabs[next].focus(); }
  });
});
showTab('quotes');

// Only owner-configured official links become visible. No network lookups or trackers.
const communityLinks = window.mindfulHeartLinks || {};
document.querySelectorAll('[data-channel]').forEach(link => {
  const destination = communityLinks[link.dataset.channel];
  if (typeof destination !== 'string') return;
  const url = new URL(destination);
  if (url.protocol !== 'https:') return;
  link.href = url.href;
  link.hidden = false;
  document.querySelector(`[data-missing="${link.dataset.channel}"]`)?.setAttribute('hidden', '');
});
if (['youtube', 'instagram', 'facebook'].some(channel => communityLinks[channel])) {
  document.querySelector('[data-no-social]')?.setAttribute('hidden', '');
}
