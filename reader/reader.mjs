import { quotes } from './catalog.mjs';
import { quoteForDay, quoteFromHash, savedIDs, quoteLink, nextQuote } from './model.mjs';
const $ = id => document.getElementById(id);
const savedKey = 'mh.reader.saved.v1', themeKey = 'mh.reader.theme.v1';
let stored = [], theme;
try { stored = JSON.parse(localStorage.getItem(savedKey) || '[]'); theme = localStorage.getItem(themeKey); } catch {}
let saved = savedIDs(quotes, stored);
let current = quoteFromHash(quotes, location.hash) || quoteForDay(quotes);
let selectedTheme = ['light','dark'].includes(theme) ? theme : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
let sharing = false;
function applyTheme(){ document.documentElement.dataset.theme = selectedTheme; $('theme').setAttribute('aria-label', `Switch to ${selectedTheme === 'dark' ? 'light' : 'dark'} appearance`); }
applyTheme();
$('theme').addEventListener('click',()=>{selectedTheme = selectedTheme === 'dark' ? 'light':'dark'; applyTheme(); try{localStorage.setItem(themeKey,selectedTheme);}catch{}});
function announce(text){$('status').textContent=text;}
function render(){
  $('quote').textContent=current.quote; $('author').textContent=current.author;
  $('category').textContent=current.category;
  $('source').textContent=`${current.book} · ${current.year}`; $('source').href=current.sourceURL;
  $('attribution-note').textContent=current.attributionNote || '';
  const isToday=current.id === quoteForDay(quotes).id;
  $('moment').textContent=isToday ? 'Today’s thought':'A thought to keep';
  $('today').hidden=isToday;
  $('save').setAttribute('aria-pressed',String(saved.includes(current.id)));
  $('save').textContent=saved.includes(current.id)?'♥ Saved':'♡ Save';
  $('saved-count').textContent=String(saved.length);
  $('share').textContent='Share ↗'; $('share').classList.remove('success');
}
function select(quote){current=quote; announce(''); render();}
$('next').addEventListener('click',()=>{select(nextQuote(quotes,current)); history.replaceState(null,'',quoteLink(location.href,current));});
$('today').addEventListener('click',()=>{history.replaceState(null,'',location.pathname);select(quoteForDay(quotes));});
$('save').addEventListener('click',()=>{
  const adding=!saved.includes(current.id); saved=adding?[current.id,...saved]:saved.filter(id=>id!==current.id);
  let persisted=true; try{localStorage.setItem(savedKey,JSON.stringify(saved));}catch{persisted=false;}
  render(); announce(adding ? persisted?'Saved on this device.':'Saved for this visit only. Browser storage is unavailable.':'Removed from saved thoughts.');
});
function changeView(savedView){
  $('reading').hidden=savedView; $('saved-view').hidden=!savedView;
  $('read-tab').setAttribute('aria-pressed',String(!savedView)); $('saved-tab').setAttribute('aria-pressed',String(savedView));
  if(!savedView)return;
  $('saved-list').replaceChildren(); $('empty').hidden=saved.length>0;
  for(const id of saved){
    const quote=quotes.find(q=>q.id===id); const card=document.createElement('article'); card.className='saved-card';
    const text=document.createElement('p');text.textContent=quote.quote;
    const source=document.createElement('small');source.textContent=`${quote.author} · ${quote.book}`;
    const open=document.createElement('button');open.type='button';open.textContent='Read this thought →';
    open.addEventListener('click',()=>{select(quote);changeView(false);$('quote').setAttribute('tabindex','-1');$('quote').focus();});
    card.append(text,source,open);$('saved-list').append(card);
  }
}
$('read-tab').addEventListener('click',()=>changeView(false));$('saved-tab').addEventListener('click',()=>changeView(true));
$('share').addEventListener('click',async()=>{
  if(sharing)return; sharing=true; const shared=current;
  const url=quoteLink(location.href,shared);
  try{
    if(navigator.share){await navigator.share({title:'A thought from Mindful Heart',text:`${shared.quote} — ${shared.author}\n${shared.book} · ${shared.year}`,url});}
    else{await navigator.clipboard.writeText(url);if(current.id===shared.id){$('share').textContent='✓ Link copied';$('share').classList.add('success');announce('Paste this link to share the same quote.');}}
  }catch(error){if(error.name!=='AbortError'&&current.id===shared.id)announce('Sharing is unavailable here. You can select the quote or copy the page address.');}
  finally{sharing=false;}
});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&!location.hash){select(quoteForDay(quotes));}});
addEventListener('hashchange',()=>{const quote=quoteFromHash(quotes,location.hash);if(quote){select(quote);changeView(false);}});
function connection(){ $('connection').textContent=navigator.onLine?'Read at your pace.':'Offline · your saved library is available on this device.'; }
addEventListener('online',connection);addEventListener('offline',connection);connection();render();
if(location.hash&&!quoteFromHash(quotes,location.hash))announce('That quote link is not in this starter library. Here is today’s thought.');
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(()=>navigator.serviceWorker.ready).then(()=>{$('offline-status').textContent='Ready for offline reading. Keep the page or Home Screen app on this device.';}).catch(()=>{$('offline-status').textContent='Offline setup is unavailable in this browser. You can still read while online.';});}
