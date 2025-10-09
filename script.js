
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat('de-CH', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}
function qs(key){ return new URLSearchParams(location.search).get(key); }
async function loadJSON(path){ const res = await fetch(path, { cache: 'no-store' }); if(!res.ok) throw new Error('Konnte ' + path + ' nicht laden'); return res.json(); }
function slugify(s){ return s.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'').slice(0,80); }
function makeICS(ev){
  const dt = (date, time) => {
    const [hh, mm] = (time||'00:00').split(':').map(Number);
    const d = new Date(date); d.setHours(hh, mm||0, 0, 0);
    const pad = n => String(n).padStart(2,'0');
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  };
  const dtStart = dt(ev.date, ev.start_time), dtEnd = dt(ev.date, ev.end_time||ev.start_time);
  const uid = `${ev.id}@minus3`;
  const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//minus3//DE','BEGIN:VEVENT',`UID:${uid}`,`DTSTAMP:${dtStart}`,`DTSTART:${dtStart}`,`DTEND:${dtEnd}`,`SUMMARY:${ev.title}`,`DESCRIPTION:${(ev.description||'').replace(/\n/g,'\\n')}`,`LOCATION:${ev.venue}`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  return URL.createObjectURL(blob);
}
async function initProgramPage(){
  const list=document.getElementById('eventList'); if(!list) return;
  const search=document.getElementById('search'); const monthSel=document.getElementById('monthFilter');
  const data=await loadJSON('data/events.json');
  const months=[...new Set(data.map(e=>new Date(e.date).toISOString().slice(0,7)))].sort();
  months.forEach(m=>{ const o=document.createElement('option'); o.value=m; o.textContent=m; monthSel.appendChild(o); });
  function render(items){
    list.innerHTML='';
    if(items.length===0){ list.innerHTML='<p class="muted">Keine Treffer.</p>'; return; }
    items.forEach(ev=>{
      const a=document.createElement('a'); a.href=`event.html?id=${encodeURIComponent(ev.id)}`; a.className='card';
      a.innerHTML=`<div class="thumb">${ev.image?`<img src="${ev.image}" alt="${ev.title}" loading="lazy"/>`:''}</div>
        <div class="content"><div class="meta">${formatDate(ev.date)} • ${ev.city||''}</div><h3>${ev.title}</h3><div class="meta">${ev.venue||''}${ev.genre?' • '+ev.genre:''}</div></div>`;
      list.appendChild(a);
    });
  }
  function apply(){
    const q=(search.value||'').toLowerCase(); const m=monthSel.value;
    const out=data.filter(ev=>{
      const pool=[ev.title,ev.city,ev.venue,ev.genre,(ev.artists||[]).map(a=>a.name).join(' ')].join(' ').toLowerCase();
      const matchesQ=!q||pool.includes(q); const matchesM=!m||new Date(ev.date).toISOString().startsWith(m);
      return matchesQ&&matchesM;
    });
    render(out);
  }
  search.addEventListener('input', apply); monthSel.addEventListener('change', apply); render(data);
}
async function initEventPage(){
  const id=qs('id'); if(!id) return; const data=await loadJSON('data/events.json'); const ev=data.find(x=>x.id===id);
  const container=document.getElementById('event'); if(!ev){ container.innerHTML='<p>Event nicht gefunden.</p>'; return; }
  const img=document.getElementById('eventImage'); if(ev.image){ img.src=ev.image; img.alt=ev.title; } else { img.style.display='none'; }
  document.getElementById('eventTitle').textContent=ev.title;
  document.getElementById('eventSubtitle').textContent=[ev.city,ev.venue].filter(Boolean).join(' • ');
  document.getElementById('eventDate').textContent=formatDate(ev.date);
  document.getElementById('eventDoor').textContent=ev.door_time||'-';
  document.getElementById('eventStart').textContent=ev.start_time||'-';
  document.getElementById('eventVenue').textContent=[ev.venue,ev.address].filter(Boolean).join(', ');
  const desc=document.getElementById('eventDesc'); desc.innerHTML=(ev.description||'').split('\n').map(p=>`<p>${p}</p>`).join('');
  const ticket=document.getElementById('ticketLink'); ticket.href=ev.ticket_url||'#'; ticket.textContent=ev.ticket_cta||'Tickets';
  const cal=document.getElementById('calLink'); cal.addEventListener('click', e=>{ e.preventDefault(); const url=makeICS(ev); const a=document.createElement('a'); a.href=url; a.download=`${slugify(ev.title)}.ics`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1500); });
  const wrap=document.getElementById('artists'); (ev.artists||[]).forEach(a=>{ const row=document.createElement('div'); row.className='artist';
    row.innerHTML=`${a.image?`<img src="${a.image}" alt="${a.name}" />`:'<div></div>'}<div><div><strong>${a.name}</strong>${a.role?` – ${a.role}`:''}</div>${a.links?`<div class="muted">${a.links.map(l=>`<a href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`).join(' • ')}</div>`:''}</div>`;
    wrap.appendChild(row);
  });
}
async function initPastPage(){
  const el=document.getElementById('gallery'); if(!el) return; const past=await loadJSON('data/past.json');
  el.innerHTML=''; past.forEach(item=>{ const fig=document.createElement('figure'); fig.innerHTML=`<img src="${item.src}" alt="${item.caption||'Vergangenes Event'}" loading="lazy"/><figcaption>${item.caption||''}</figcaption>`; el.appendChild(fig); });
}
(function initMobileNav(){
  const header = document.querySelector('.site-header');
  const btn = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-header nav');
  if(!header || !btn || !nav) return;

  const close = () => {
    header.classList.remove('nav-open');
    btn.setAttribute('aria-expanded', 'false');
  };
  const open = () => {
    header.classList.add('nav-open');
    btn.setAttribute('aria-expanded', 'true');
  };
  btn.addEventListener('click', () => {
    header.classList.contains('nav-open') ? close() : open();
  });
  // bei Resize > 820 wieder schliessen
  window.addEventListener('resize', () => {
    if (window.innerWidth > 820) close();
  });
  // schliessen beim Klick auf einen Link (nur mobil)
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a') && window.innerWidth <= 820) close();
  });
  // ESC schliesst
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
})();
