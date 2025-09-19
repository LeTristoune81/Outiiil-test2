/* Outiiil — Parseur Traceur TDC (Journal persistant, ASCII Toolzzz, en-têtes centrés, Net vert/rouge)
 * - Onglet "Journal" avec autosave (localStorage), import/export .txt, drop fichier, purge doublons
 * - Fenêtre déplaçable + redimensionnable (pos/taille mémorisées)
 * - Compteur de lignes
 * - Appariement "flux" n-vers-m
 * API globale window.OutiiilTDC.{open,close,toggle,fill,parse}
 */
(function(){
'use strict';

/* ==================== Réglages ==================== */
const COLOR_POS  = '#008000';   // vert
const COLOR_NEG  = '#8B0000';   // rouge
const COLOR_DOTS = '#AAAAAA';   // points gris

const LS_POS     = 'OutiiilTDC:pos';
const LS_SIZE    = 'OutiiilTDC:size';
const LS_JOURNAL = 'OutiiilTDC:journal';  // contenu persistant du Journal
const LS_API_BASE= 'OutiiilTDC:apiBase';
const LS_API_KEY = 'OutiiilTDC:apiKey';
const LS_ORPH_MIN = 'OutiiilTDC:orphMin';

/* ==================== UI ==================== */
const host=document.createElement('div');
Object.assign(host.style,{position:'fixed',inset:'auto 18px 18px auto',zIndex:999999,fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Helvetica,Arial,sans-serif'});
document.body.appendChild(host);
const shadow=host.attachShadow({mode:'open'});
shadow.innerHTML=`
<style>
:host{all:initial}
.panel{position:fixed;right:18px;bottom:18px;width:1000px;max-height:90vh;overflow:hidden;background:#111723;color:#e7ecf3;border:1px solid #1b2332;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.35);display:none;font-size:15px}
.show{display:block}
.hdr{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#0f182b;border-bottom:1px solid #1b2332}
.title{font-size:16px;font-weight:700}
.muted{color:#9db0c9;font-size:12px}
.x{margin-left:auto;cursor:pointer;padding:6px 10px;border-radius:8px;border:1px solid #1b2332}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:10px}
textarea{width:100%;min-height:280px;background:#0a1220;color:#e7ecf3;border:1px solid #1b2332;border-radius:12px;padding:10px;font-family:ui-monospace,SFMono-Regular,Consolas,Menlo,monospace;line-height:1.45;font-size:15px}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.pill{padding:6px 10px;border-radius:999px;border:1px solid #1b2332;background:#0c1526;color:#9db0c9;font-size:12px}
.btn2{all:unset;cursor:pointer;padding:8px 12px;border-radius:10px;background:#0e1727;border:1px solid #1b2332;color:#e7ecf3}
.tabs{display:flex;gap:8px;padding:0 10px 8px 10px;flex-wrap:wrap}
.tab{padding:8px 12px;border:1px solid #1b2332;border-radius:10px;background:#0c1526;color:#9db0c9;cursor:pointer;font-size:14px}
.tab.active{background:#122138;color:#e7ecf3}
.scroll{max-height:38vh;overflow:auto;border:1px solid #1b2332;border-radius:10px}
table{width:100%;border-collapse:collapse;font-size:15px}
th,td{border-bottom:1px solid #1b2332;padding:6px 8px;text-align:left}
th{position:sticky;top:0;background:#0f182b;z-index:1}
.r{text-align:right;font-variant-numeric:tabular-nums}
.mono{font-family:ui-monospace,SFMono-Regular,Consolas,Menlo,monospace}
kbd{background:#0c1526;border:1px solid #1b2332;border-radius:6px;padding:1px 5px;font-size:11px}
.footer{padding:8px 10px;color:#9db0c9;font-size:11px;border-top:1px solid #1b2332;display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap}
.resizer{position:absolute;right:6px;bottom:6px;width:14px;height:14px;cursor:nwse-resize;opacity:.9}
.resizer::before,.resizer::after{content:"";position:absolute;border-color:#1b2332;border-style:solid;opacity:.8}
.resizer::before{right:0;bottom:0;border-width:0 2px 2px 0;width:12px;height:12px;border-radius:0 0 2px 0}
.resizer::after{right:3px;bottom:3px;border-width:0 2px 2px 0;width:9px;height:9px;border-radius:0 0 2px 0}
small.badge{opacity:.8}
</style>

<div id="panel" class="panel">
  <div class="hdr">
    <div class="title">Parseur Traceur TDC — Discord → ASCII</div>
    <div id="status" class="muted"></div>
    <div id="close" class="x" title="Fermer (Alt+T)">✕</div>
  </div>

  <div class="grid">
    <div>
      <div class="row" style="justify-content:space-between;margin-bottom:6px">
        <span class="pill">Colle ici tes lignes Discord (presse-papiers ponctuel)</span>
        <button id="sample" class="btn2">Exemple</button>
      </div>
      <textarea id="raw" placeholder="— 17/08/2025 08:42
Christheall(TRID): +47 420 282 tdc | 274 610 833 => 322 031 115
eholo(LHDC): -47 420 282 tdc | 237 101 410 => 189 681 128
APP
— Hier à 03:47
..."></textarea>
      <div class="row" style="margin-top:8px">
        <button id="analyze" class="btn2">Analyser</button>
        <button id="clear" class="btn2">Vider</button>
        <button id="import" class="btn2">Importer .txt</button>
        <input id="file" type="file" accept=".txt,.log,.csv,.json" style="display:none">
        <span class="muted">Raccourci : <kbd>Alt</kbd>+<kbd>T</kbd></span>
      </div>
    </div>

    <div>
      <div class="tabs">
        <div class="tab active" data-tab="tx">Transactions</div>
        <div class="tab" data-tab="agg">Joueurs</div>
        <div class="tab" data-tab="alli">Alliances</div>
        <div class="tab" data-tab="ups">UPs</div>
        <div class="tab" data-tab="orph">Orphelines</div>
        <div class="tab" data-tab="journal">Journal</div>
        <div class="tab" data-tab="opts">Options</div>
        <div class="tab" data-tab="discord">Discord</div>
      </div>

      <div class="row" style="padding:0 10px 6px 10px">
        <input id="fPlayer" type="text" placeholder="Filtrer par joueur (contient)"/>
        <input id="fAlly" type="text" placeholder="Filtrer par alliance (contient)"/>
        <select id="fAllyQuick"><option value="">— Alliances détectées —</option></select>
        <button id="fClear" class="btn2">Effacer filtres</button>
      </div>

      <div id="panel-tx">
        <div class="row" style="padding:0 10px 6px 10px">
          <button id="copyTx" class="btn2" disabled>Copier ASCII (transactions)</button>
        </div>
        <div class="scroll"><table id="tblTx"></table></div>
      </div>

      <div id="panel-agg" style="display:none">
        <div class="row" style="padding:0 10px 6px 10px">
          <button id="copyAgg" class="btn2" disabled>Copier ASCII (joueurs)</button>
        </div>
        <div class="scroll"><table id="tblAgg"></table></div>
      </div>

      <div id="panel-alli" style="display:none">
        <div class="row" style="padding:0 10px 6px 10px">
          <button id="copyAlli" class="btn2" disabled>Copier ASCII (alliances)</button>
        </div>
        <div class="scroll"><table id="tblAlli"></table></div>
      </div>

      <div id="panel-ups" style="display:none">
        <div class="row" style="padding:0 10px 6px 10px">
          <button id="copyUps" class="btn2" disabled>Copier ASCII (UPs)</button>
        </div>
        <div class="scroll"><table id="tblUps"></table></div>
      </div>

      <div id="panel-orph" style="display:none">
        <div class="row" style="padding:0 10px 6px 10px">
          <button id="copyOrph" class="btn2" disabled>Copier ASCII (orphelines)</button>
        </div>
        <div class="scroll"><table id="tblOrph"></table></div>
      </div>

      <div id="panel-journal" style="display:none">
        <div class="row" style="padding:0 10px 6px 10px;justify-content:space-between">
          <div class="row">
            <button id="journalAnalyze" class="btn2">Analyser le journal</button>
            <button id="journalImport"  class="btn2">Importer .txt</button>
            <button id="journalExport"  class="btn2">Exporter .txt</button>
            <button id="journalDedupe"  class="btn2">Purger doublons</button>
            <button id="journalClear"   class="btn2">Vider</button>
            <input id="journalFile" type="file" accept=".txt,.log,.csv,.json" style="display:none">
          </div>
          <small class="badge muted" id="journalStats"></small>
        </div>
        <textarea id="journal" placeholder="Colle ici en continu (persisté dans ce navigateur). Tu peux aussi glisser-déposer un fichier .txt."></textarea>
      </div>
    </div>
  </div>


      <!-- ==== Onglet Discord ==== -->
      <div id="panel-discord" style="display:none">
        <div class="row" style="padding:0 10px 6px 10px">
          <label class="small">Base</label><input id="apiBase" style="width:280px" placeholder="http://127.0.0.1:8000">
          <label class="small">Clé</label><input id="apiKey"  style="width:340px" placeholder="X-API-Key">
          <button id="apiSave" class="btn2">Enregistrer</button>
          <button id="apiTest" class="btn2">Tester</button>
        </div>
        <div class="row" style="padding:0 10px 6px 10px">
          <button id="dcLoadGuilds" class="btn2">Lister guilds</button>
          <select id="dcGuild" style="min-width:260px"><option value="">— Sélectionne une guild —</option></select>
          <button id="dcLoadChannels" class="btn2">Lister salons</button>
          <select id="dcChannel" style="min-width:300px"><option value="">— Sélectionne un salon —</option></select>
        </div>

        <!-- Calendrier unique (import fenêtré jour par jour) -->
        <div class="row" style="padding:0 10px 6px 10px">
          <label class="small">Du</label><input id="dcFromDate" type="date">
          <label class="small">à</label><input id="dcFromTime" type="time" placeholder="00:00" style="width:120px">
          <label class="small">au</label><input id="dcToDate" type="date">
          <label class="small">à</label><input id="dcToTime" type="time" placeholder="23:59" style="width:120px">
          <button id="dcClearDates" class="btn2">Effacer dates</button>
        </div>

        <div class="row" style="padding:0 10px 6px 10px">
          <button id="dcToRaw" class="btn2">Importer → Raw (remplace)</button>
          <button id="dcToJournal" class="btn2">Importer → Journal (ajoute)</button>
        </div>
        <div class="scroll" style="margin:0 10px;border-radius:10px">
          <table id="tblDcPreview"></table>
        </div>

      </div>
      <!-- ==== /Onglet Discord ==== -->

      <div id="panel-opts" style="display:none">
        <div class="row" style="padding:0 10px 6px 10px; align-items:center; gap:10px">
          <label class="small" for="orphMin">Seuil Orphelines</label>
          <input id="orphMin" type="text" placeholder="ex: 1000000 · vide = pas de filtre" style="width:220px">
          <button id="orphApply" class="btn2">Appliquer</button>
          <small class="muted">Par défaut : 1 000 000</small>
        </div>
      </div>
<div class="footer">
    <span>Export Toolzzz : en-têtes centrés, points gris, Net vert/rouge.</span>
    <span class="muted">Tout hors-ligne • Format FR supporté.</span>
  </div>

  <div id="resizerBR" class="resizer" title="Redimensionner"></div>
</div>
`;

const $=(s)=>shadow.querySelector(s);
const fmt=new Intl.NumberFormat('fr-FR');

/* === Ajuste la hauteur utile du tableau visible === */
function updateScrollHeights(){
  const panel = $('#panel');
  if (!panel || !panel.classList.contains('show')) return;
  const rectP = panel.getBoundingClientRect();
  const panels = ['tx','agg','alli','ups','orph','journal','discord','opts'].map(k=>$('#panel-'+k));
  const shown = panels.find(p => p && p.style.display !== 'none');
  if(!shown) return;
  const sc = shown.querySelector('.scroll') || shown.querySelector('textarea');
  if(!sc) return;
  const top = sc.getBoundingClientRect().top - rectP.top;
  const avail = Math.max(120, rectP.height - top - 12);
  if(sc.classList.contains('scroll')) sc.style.maxHeight = avail + 'px';
  else sc.style.minHeight = Math.max(200, avail) + 'px';
}

/* toggle avec recalage du scroll quand on ouvre */
let toggle = ()=>{
  const p=$('#panel');
  const vis=p.classList.toggle('show');
  if(vis) requestAnimationFrame(updateScrollHeights);
};
$('#close').addEventListener('click',toggle);
window.addEventListener('keydown',(e)=>{ if(e.altKey && (e.key==='t'||e.key==='T')){ e.preventDefault(); toggle(); }});

/* ===== Fenêtre déplaçable + redimensionnable (pos/taille mémorisées) ===== */
(() => {
  const root = shadow;
  const panelEl  = root.querySelector('#panel');
  const headerEl = root.querySelector('.hdr');
  const resEl    = root.querySelector('#resizerBR');
  if (!panelEl || !headerEl || !resEl) return;

  headerEl.style.cursor = 'move';

  function clampIntoViewport() {
    const rect = panelEl.getBoundingClientRect();
    const W = window.innerWidth, H = window.innerHeight;
    const maxL = Math.max(0, W - rect.width);
    const maxT = Math.max(0, H - rect.height);
    if (panelEl.style.left) {
      let L = Math.min(Math.max(0, parseInt(panelEl.style.left || '0', 10)), maxL);
      let T = Math.min(Math.max(0, parseInt(panelEl.style.top  || '0', 10)), maxT);
      panelEl.style.left = L + 'px';
      panelEl.style.top  = T + 'px';
      savePos();
    }
  }
  function loadPos() {
    try {
      const s = localStorage.getItem(LS_POS);
      if (!s) return false;
      const { left, top } = JSON.parse(s) || {};
      if (Number.isFinite(left) && Number.isFinite(top)) {
        panelEl.style.right  = 'auto';
        panelEl.style.bottom = 'auto';
        panelEl.style.left   = left + 'px';
        panelEl.style.top    = top  + 'px';
        clampIntoViewport();
        return true;
      }
    } catch(e) {}
    return false;
  }
  function savePos() {
    const L = parseInt(panelEl.style.left, 10);
    const T = parseInt(panelEl.style.top, 10);
    if (Number.isFinite(L) && Number.isFinite(T)) {
      localStorage.setItem(LS_POS, JSON.stringify({ left: L, top: T }));
    }
  }
  function resetPosBottomRight() {
    localStorage.removeItem(LS_POS);
    panelEl.style.left = '';
    panelEl.style.top  = '';
    panelEl.style.right  = '18px';
    panelEl.style.bottom = '18px';
  }

  function loadSize(){
    try{
      const s = localStorage.getItem(LS_SIZE);
      if(!s) return false;
      const {w,h} = JSON.parse(s)||{};
      if(Number.isFinite(w)) panelEl.style.width  = w+'px';
      if(Number.isFinite(h)) panelEl.style.height = h+'px';
      return true;
    }catch(e){ return false; }
  }
  function saveSize(){
    const curW = Math.round(parseFloat(panelEl.style.width)  || panelEl.getBoundingClientRect().width);
    const curH = Math.round(parseFloat(panelEl.style.height) || panelEl.getBoundingClientRect().height);
    localStorage.setItem(LS_SIZE, JSON.stringify({w:curW, h:curH}));
  }

  // Drag
  let dragging = false, offsetX = 0, offsetY = 0;
  headerEl.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    const r = panelEl.getBoundingClientRect();
    offsetX = e.clientX - r.left;
    offsetY = e.clientY - r.top;
    panelEl.style.right  = 'auto';
    panelEl.style.bottom = 'auto';
    headerEl.style.cursor = 'grabbing';
    e.preventDefault();
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    let left = e.clientX - offsetX;
    let top  = e.clientY - offsetY;
    const W = window.innerWidth, H = window.innerHeight;
    left = Math.max(0, Math.min(left, W - panelEl.offsetWidth));
    top  = Math.max(0, Math.min(top,  H - panelEl.offsetHeight));
    panelEl.style.left = left + 'px';
    panelEl.style.top  = top  + 'px';
  });
  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    headerEl.style.cursor = 'move';
    saveSize(); savePos();
  });
  headerEl.addEventListener('dblclick', (e) => { e.preventDefault(); resetPosBottomRight(); });

  // Resize (poignée bas-droite)
  let resizing=false, sx=0, sy=0, sw=0, sh=0;
  resEl.addEventListener('mousedown', (e)=>{
    if(e.button!==0) return;
    e.preventDefault();
    const r = panelEl.getBoundingClientRect();
    resizing = true;
    sx = e.clientX; sy = e.clientY; sw = r.width; sh = r.height;
    document.body.style.userSelect='none';
  });
  window.addEventListener('mousemove', (e)=>{
    if(!resizing) return;
    const maxW = Math.min(window.innerWidth - 36, 1600);
    const maxH = Math.min(window.innerHeight - 36, 1200);
    let w = sw + (e.clientX - sx);
    let h = sh + (e.clientY - sy);
    w = Math.max(520, Math.min(w, maxW));
    h = Math.max(280, Math.min(h, maxH));
    panelEl.style.width  = w + 'px';
    panelEl.style.height = h + 'px';
    clampIntoViewport();
    updateScrollHeights();
  });
  window.addEventListener('mouseup', ()=>{
    if(!resizing) return;
    resizing=false;
    document.body.style.userSelect='';
    saveSize();
  });

  window.addEventListener('resize', ()=>{ clampIntoViewport(); updateScrollHeights(); });

  loadSize(); loadPos();
  requestAnimationFrame(updateScrollHeights);
})();

/* ==================== Events généraux ==================== */
function setStatus(m){$('#status').textContent=m;}
function clearTables(){['tblTx','tblAgg','tblAlli','tblUps','tblOrph'].forEach(id=>$('#'+id).innerHTML='');}
function disableCopy(){['copyTx','copyAgg','copyAlli','copyUps','copyOrph'].forEach(id=>$('#'+id).disabled=true);}
function enableCopy(){['copyTx','copyAgg','copyAlli','copyUps','copyOrph'].forEach(id=>$('#'+id).disabled=false);}

$('#clear').addEventListener('click',()=>{$('#raw').value=''; setStatus(''); clearTables(); disableCopy();});
$('#sample').addEventListener('click',()=>$('#raw').value=SAMPLE.trim());

shadow.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    shadow.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    const k=tab.dataset.tab;
    if(k==='opts'){ try{ orphLoadMin(); }catch(_){}}if(k==='discord') dcLoadSaved();
    ['tx','agg','alli','ups','orph','journal','discord'].forEach(x=>{$(`#panel-${x}`).style.display=(x===k?'block':'none');});
    requestAnimationFrame(updateScrollHeights);
  });
});

const filters={player:'',ally:''};
$('#fPlayer').addEventListener('input',e=>{filters.player=norm(e.target.value); renderAll(state,true);});
$('#fAlly').addEventListener('input',e=>{filters.ally=norm(e.target.value); renderAll(state,true);});
$('#fAllyQuick').addEventListener('change',e=>{ $('#fAlly').value=e.target.value; filters.ally=norm(e.target.value); renderAll(state,true);});
$('#fClear').addEventListener('click',()=>{filters.player='';filters.ally='';$('#fPlayer').value='';$('#fAlly').value='';$('#fAllyQuick').value='';renderAll(state,true);});
$('#analyze').addEventListener('click',()=>{
  const txt=$('#raw').value;
  if(!txt.trim()){ setStatus('Colle du texte à analyser.'); return; }
  try{ renderAll(parseAll(txt)); requestAnimationFrame(updateScrollHeights); }catch(err){ setStatus('Erreur: '+(err?.message||err)); console.error(err); }
});
$('#copyTx').addEventListener('click',()=>copyToClipboard(wrapCode(buildAsciiTx(view.tx))));
$('#copyAgg').addEventListener('click',()=>copyToClipboard(wrapCode(buildAsciiAgg(view.agg))));
$('#copyAlli').addEventListener('click',()=>copyToClipboard(wrapCode(buildAsciiAlli(view.alli))));
$('#copyUps').addEventListener('click',()=>copyToClipboard(wrapCode(buildAsciiUps(view.ups))));
$('#copyOrph').addEventListener('click',()=>copyToClipboard(wrapCode(buildAsciiOrph(view.orph))));

/* ===== Import ponctuel côté "Raw" ===== */
$('#import').addEventListener('click', ()=> $('#file').click());
$('#file').addEventListener('change', async (e)=>{
  const f = e.target.files?.[0];
  if(!f) return;
  try{
    const txt = await f.text();
    $('#raw').value = txt;
    setStatus(`${fmt.format(txt.length)} caractères chargés depuis ${esc(f.name)}`);
  }catch(err){
    console.error(err);
    setStatus('Erreur de lecture du fichier.');
  }finally{
    e.target.value = '';
  }
});

/* ==================== Journal persistant ==================== */
function loadJournal(){
  try{ return localStorage.getItem(LS_JOURNAL) || ''; }catch(e){ return ''; }
}
function saveJournal(s){
  try{ localStorage.setItem(LS_JOURNAL, s || ''); }catch(e){}
}
function journalUpdateStats(){
  const ta = $('#journal');
  const len = ta.value.length;
  const lines = ta.value ? ta.value.split(/\r?\n/).length : 0;
  $('#journalStats').textContent = `${fmt.format(lines)} lignes · ${fmt.format(len)} caractères`;
}
function journalDedupeInPlace(){
  const ta = $('#journal');
  const seen = new Set();
  const out = [];
  for(const line of ta.value.split(/\r?\n/)){
    const s = line.trimEnd(); // on conserve l'ordre, on ignore juste les doublons stricts
    if(seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  ta.value = out.join('\n');
  saveJournal(ta.value);
  journalUpdateStats();
  setStatus('Journal : doublons purgés ✅');
}

// init journal
$('#journal').value = loadJournal();
journalUpdateStats();

// autosave + stats
let jTimer=null;
$('#journal').addEventListener('input', ()=>{
  if(jTimer) clearTimeout(jTimer);
  jTimer = setTimeout(()=>{
    saveJournal($('#journal').value);
    journalUpdateStats();
  }, 200);
});

// drag & drop fichier dans Journal
(() => {
  const ta = $('#journal');
  ['dragenter','dragover'].forEach(ev =>
    ta.addEventListener(ev, e => { e.preventDefault(); e.dataTransfer.dropEffect='copy'; })
  );
  ta.addEventListener('drop', async (e)=>{
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if(!f) return;
    try{
      const txt = await f.text();
      ta.value = txt;           // remplace (si tu préfères additionner : ta.value += "\n"+txt)
      saveJournal(ta.value);
      journalUpdateStats();
      setStatus(`${fmt.format(txt.length)} caractères chargés dans le journal (drop)`);
    }catch(err){
      console.error(err);
      setStatus('Erreur de lecture du fichier (drop).');
    }
  });
})();

// boutons journal
$('#journalAnalyze').addEventListener('click', ()=>{
  const txt=$('#journal').value;
  if(!txt.trim()){ setStatus('Journal vide.'); return; }
  try{ renderAll(parseAll(txt)); requestAnimationFrame(updateScrollHeights); }catch(err){ setStatus('Erreur: '+(err?.message||err)); console.error(err); }
});
$('#journalImport').addEventListener('click', ()=> $('#journalFile').click());
$('#journalFile').addEventListener('change', async (e)=>{
  const f = e.target.files?.[0];
  if(!f) return;
  try{
    const txt = await f.text();
    $('#journal').value = txt;       // remplace (ou += pour concaténer)
    saveJournal($('#journal').value);
    journalUpdateStats();
    setStatus(`${fmt.format(txt.length)} caractères importés dans le journal depuis ${esc(f.name)}`);
  }catch(err){
    console.error(err);
    setStatus('Erreur de lecture du fichier (journal).');
  }finally{
    e.target.value = '';
  }
});
$('#journalExport').addEventListener('click', ()=>{
  const blob = new Blob([$('#journal').value], {type:'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'journal_tdc.txt';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
});
$('#journalDedupe').addEventListener('click', journalDedupeInPlace);
$('#journalClear').addEventListener('click', ()=>{
  if(!confirm('Vider totalement le journal ?')) return;
  $('#journal').value=''; saveJournal(''); journalUpdateStats(); setStatus('Journal vidé.');
});

/* ==================== Parsing ==================== */
function parseAll(text){
  const linesRaw=text.split(/\r?\n/);
  const lines=linesRaw.map(s=>s.trim()).filter(Boolean);

  const stat = { total: lines.length, recognized: 0, ignored: 0, dates:0, players:0 };

  const blocks=[]; let current=null;
  let anchorDate = null; // dernière date FR "dd/mm/yyyy" rencontrée (sert pour heures seules)

  // dates / balises
  const reDate1=/^(?:—\s*)?(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})$/;   // 17/08/2025 08:42
  const reHier=/^(?:—\s*)?Hier\s+à\s+(\d{2}:\d{2})$/i;                // Hier à 01:57
  const reAuj=/^(?:—\s*)?Aujourd(?:'|’)?hui\s+à\s+(\d{2}:\d{2})$/i;   // Aujourd’hui à 05:25
  const reTimeOnly=/^(?:—\s*)?(\d{2}:\d{2})$/;                        // 05:25
  const reNoise=/^(Fourmizzz\s+S1|APP)$/i;

  // joueur / action (+ espaces fines, NBSP, en-dash, accents/pluriels)
  const rePlayer=new RegExp(
    '^([^()]+)\\(' +
    '([A-Za-zÀ-ÖØ-öø-ÿ0-9\\-]+)' +
    '\\):\\s*' +
    '([+\\-–]\\s*\\d[\\d\\s\\u00A0\\u202F]*)\\s+' +
    '(' +
      'tdc|TDC|' +
      'fourmiliere|fourmilière|' +
      'technologie|technologies' +
    ')' +
    '\\s*\\|\\s*' +
    '(\\d[\\d\\s\\u00A0\\u202F]*)\\s*=>\\s*(\\d[\\d\\s\\u00A0\\u202F]*)' +
    '$','i'
  );

  for(const raw of lines){
    if(reNoise.test(raw)) continue;

    let m;
    if(m=raw.match(reDate1)){
      stat.recognized++; stat.dates++;
      const d=m[1], t=m[2];
      anchorDate = d; // ancre pour heures seules suivantes
      const tsMs = frToMs(d, t);
      current={tsLabel:raw.replace(/^—\s*/,''), ts:tsMs, entries:[]};
      blocks.push(current);
      continue;
    }
    if(m=raw.match(reHier)){
      stat.recognized++; stat.dates++;
      const resolved = shiftDate(todayFR(), -1);
      anchorDate = resolved;
      const tsMs = frToMs(resolved, m[1]);
      current={tsLabel:raw.replace(/^—\s*/,''), ts:tsMs, entries:[]};
      blocks.push(current);
      continue;
    }
    if(m=raw.match(reAuj)){
      stat.recognized++; stat.dates++;
      anchorDate = todayFR();
      const tsMs = frToMs(anchorDate, m[1]);
      current={tsLabel:raw.replace(/^—\s*/,''), ts:tsMs, entries:[]};
      blocks.push(current);
      continue;
    }
    if(m=raw.match(reTimeOnly)){
      stat.recognized++; stat.dates++;
      const base = anchorDate || todayFR();
      const tsMs = frToMs(base, m[1]);
      current={tsLabel:raw.replace(/^—\s*/,''), ts:tsMs, entries:[]};
      blocks.push(current);
      continue;
    }
    if(m=raw.match(rePlayer)){
      stat.recognized++; stat.players++;
      if(!current){
        const base = anchorDate || todayFR();
        const tsMs = frToMs(base, '00:00');
        current={tsLabel:`${base} 00:00`, ts:tsMs, entries:[]};
        blocks.push(current);
      }
      const name=m[1].trim(),
            ally=m[2].trim(),
            signAmt=num(m[3]),
            kind=normKind(m[4]),
            before=num(m[5]),
            after=num(m[6]);
      current.entries.push({name,ally,signAmt,kind,before,after,raw});
      continue;
    }
    // sinon : inconnue -> comptera dans "ignorées"
  }

  stat.ignored = stat.total - stat.recognized;

  // ---- Construction tx/orph/ups avec appariement "flux" n-vers-m par bloc ----
  const tx=[], orph=[], ups=[];
  blocks.forEach((b,idx)=>{
    const winners=[], losers=[];
    for(const e of b.entries){
      if(e.kind==='tdc'){
        if(e.signAmt>0) winners.push({...e, rem: Math.abs(e.signAmt)});
        else            losers .push({...e, rem: Math.abs(e.signAmt)});
      }else{
        ups.push({ts:b.ts, tsLabel:b.tsLabel, player:e.name, ally:e.ally, type:e.kind, delta:Math.abs(e.signAmt), before:e.before, after:e.after});
      }
    }

    let i=0, j=0;
    while(i<winners.length && j<losers.length){
      const W = winners[i], L = losers[j];
      const amt = Math.min(W.rem, L.rem);
      tx.push({
        ts:b.ts, tsLabel:b.tsLabel, amount:amt,
        winner:W.name, wAlly:W.ally, wBefore:W.before, wAfter:W.after,
        loser:L.name, lAlly:L.ally, lBefore:L.before, lAfter:L.after,
        block:idx, status:'apparié'
      });
      W.rem -= amt; L.rem -= amt;
      if(W.rem===0) i++;
      if(L.rem===0) j++;
    }

    // Restes -> orphelines
    for(; i<winners.length; i++){
      const W = winners[i];
      if(W.rem>0) orph.push({ts:b.ts, tsLabel:b.tsLabel, who:W.name, ally:W.ally, signAmt:+W.rem, before:W.before, after:W.after, kind:'tdc', block:idx});
    }
    for(; j<losers.length; j++){
      const L = losers[j];
      if(L.rem>0) orph.push({ts:b.ts, tsLabel:b.tsLabel, who:L.name, ally:L.ally, signAmt:-L.rem, before:L.before, after:L.after, kind:'tdc', block:idx});
    }
  });

  // ---- Agrégats joueurs / alliances ----
  const aggMap=new Map();
  function touchP(player,ally){ const k=player+'|'+ally; if(!aggMap.has(k)) aggMap.set(k,{player,ally,gain:0,loss:0,first:null,last:null}); return aggMap.get(k);}
  tx.forEach(t=>{ const w=touchP(t.winner,t.wAlly), l=touchP(t.loser,t.lAlly); w.gain+=t.amount; w.first=minDate(w.first,t.ts); w.last=maxDate(w.last,t.ts); l.loss+=t.amount; l.first=minDate(l.first,t.ts); l.last=maxDate(l.last,t.ts);});
  const agg=[...aggMap.values()].map(a=>({...a,net:a.gain-a.loss})).sort((x,y)=>y.net-x.net||x.player.localeCompare(y.player));

  const alliMap=new Map();
  function touchA(a){ if(!alliMap.has(a)) alliMap.set(a,{alliance:a,gain:0,loss:0,net:0,wins:0,defeats:0}); return alliMap.get(a); }
  tx.forEach(t=>{ const AW=touchA(t.wAlly); AW.gain+=t.amount; AW.wins++; const AL=touchA(t.lAlly); AL.loss+=t.amount; AL.defeats++;});
  alliMap.forEach(v=>v.net=v.gain-v.loss);
  const alli=[...alliMap.values()].sort((a,b)=>b.net-a.net||a.alliance.localeCompare(b.alliance));

  const distinct=[...new Set(alli.map(a=>a.alliance))].sort((a,b)=>a.localeCompare(b));
  const sel=$('#fAllyQuick'); sel.innerHTML='<option value="">— Alliances détectées —</option>'+distinct.map(a=>`<option value="${esc(a)}">${esc(a)}</option>`).join('');

  return {tx,agg,alli,ups,orph, stat};
}

/* ==================== Aperçu tables ==================== */
const state={tx:[],agg:[],alli:[],ups:[],orph:[],stat:{total:0,recognized:0,ignored:0}};
const view ={tx:[],agg:[],alli:[],ups:[],orph:[]};


function getOrphMin(){
  try{
    const raw = localStorage.getItem(LS_ORPH_MIN);
    if(raw === null) return 1000000;        // défaut: 1 000 000
    const s = String(raw).replace(/\s+/g,'');
    if(!s) return NaN;                      // vide => pas de filtre
    const n = parseInt(s,10);
    return Number.isFinite(n) ? n : NaN;
  }catch(_){ return 1000000; }
}
function setOrphMin(val){
  try{ localStorage.setItem(LS_ORPH_MIN, (val==null?'':String(val)).trim()); }catch(_){}
}


function renderAll(res,onlyFilter=false){
  if(!onlyFilter) Object.assign(state,res);
  const fP=filters.player, fA=filters.ally, match=(s,q)=>!q||norm(s).includes(q);
  view.tx   = state.tx  .filter(t => (match(t.winner,fP)||match(t.loser,fP)) && (!fA||match(t.wAlly,fA)||match(t.lAlly,fA)));
  view.agg  = state.agg .filter(a =>  match(a.player,fP) && (!fA||match(a.ally,fA)));
  view.ups  = state.ups .filter(u =>  match(u.player,fP) && (!fA||match(u.ally,fA)));
  const _thr = getOrphMin();
  view.orph = state.orph.filter(o =>  match(o.who,fP) && (!fA||match(o.ally,fA)) && (!Number.isFinite(_thr) || Math.abs(o.signAmt) >= _thr));
  view.alli = state.alli.filter(a => !fA || match(a.alliance,fA));

  fillTx(); fillAgg(); fillAlli(); fillUps(); fillOrph();
  const S = state.stat;
  setStatus(`Lignes: ${fmt.format(S.total)} / ${fmt.format(S.recognized)} / ${fmt.format(S.total - S.recognized)} · Tx: ${fmt.format(view.tx.length)} · Orphelines: ${fmt.format(view.orph.length)} · UPs: ${fmt.format(view.ups.length)} · Alliances: ${fmt.format(view.alli.length)}`);
  enableCopy();
}

const htmlNet = (n)=> `<span style="color:${n>0?COLOR_POS:n<0?COLOR_NEG:'#e7ecf3'}">${fmt.format(n)}</span>`;

function fillTx(){ const t=$('#tblTx'); t.innerHTML=`
<thead><tr>
<th>Date/Heure</th><th>Gagnant</th><th>Alliance</th><th class="r">Avant</th><th class="r">Après</th>
<th>Perdant</th><th>Alliance</th><th class="r">Avant</th><th class="r">Après</th>
<th class="r">Montant</th><th>Statut</th>
</tr></thead><tbody></tbody>`; const tb=t.querySelector('tbody');
view.tx.forEach(x=>tb.insertAdjacentHTML('beforeend',`<tr>
<td class="mono">${dispDate(x.ts)}</td>
<td>${esc(x.winner)}</td><td>${esc(x.wAlly)}</td>
<td class="r mono">${fmt.format(x.wBefore)}</td><td class="r mono">${fmt.format(x.wAfter)}</td>
<td>${esc(x.loser)}</td><td>${esc(x.lAlly)}</td>
<td class="r mono">${fmt.format(x.lBefore)}</td><td class="r mono">${fmt.format(x.lAfter)}</td>
<td class="r mono">${fmt.format(x.amount)}</td>
<td>apparié</td>
</tr>`));
}
function fillAgg(){ const t=$('#tblAgg'); t.innerHTML=`
<thead><tr>
<th>Joueur</th><th>Alliance</th><th class="r">Gains</th><th class="r">Pertes</th><th class="r">Net</th>
<th>Première</th><th>Dernière</th>
</tr></thead><tbody></tbody>`; const tb=t.querySelector('tbody');
view.agg.forEach(a=>tb.insertAdjacentHTML('beforeend',`<tr>
<td>${esc(a.player)}</td><td>${esc(a.ally)}</td>
<td class="r mono">${fmt.format(a.gain)}</td>
<td class="r mono">${fmt.format(a.loss)}</td>
<td class="r mono">${htmlNet(a.net)}</td>
<td class="mono">${a.first?dispDate(a.first):''}</td>
<td class="mono">${a.last?dispDate(a.last):''}</td>
</tr>`));
}
function fillAlli(){ const t=$('#tblAlli'); t.innerHTML=`
<thead><tr>
<th>Alliance</th><th class="r">Gains</th><th class="r">Pertes</th><th class="r">Net</th><th class="r">#Victoires</th><th class="r">#Défaites</th>
</tr></thead><tbody></tbody>`; const tb=t.querySelector('tbody');
view.alli.forEach(a=>tb.insertAdjacentHTML('beforeend',`<tr>
<td>${esc(a.alliance)}</td>
<td class="r mono">${fmt.format(a.gain)}</td>
<td class="r mono">${fmt.format(a.loss)}</td>
<td class="r mono">${htmlNet(a.net)}</td>
<td class="r mono">${fmt.format(a.wins)}</td>
<td class="r mono">${fmt.format(a.defeats)}</td>
</tr>`));
}
function fillUps(){ const t=$('#tblUps'); t.innerHTML=`
<thead><tr>
<th>Date/Heure</th><th>Joueur</th><th>Alliance</th><th>Type</th><th class="r">+1</th><th class="r">Avant</th><th class="r">Après</th>
</tr></thead><tbody></tbody>`; const tb=t.querySelector('tbody');
view.ups.forEach(u=>tb.insertAdjacentHTML('beforeend',`<tr>
<td class="mono">${dispDate(u.ts)}</td>
<td>${esc(u.player)}</td><td>${esc(u.ally)}</td>
<td>${esc(u.type)}</td>
<td class="r mono">${fmt.format(u.delta)}</td>
<td class="r mono">${fmt.format(u.before)}</td>
<td class="r mono">${fmt.format(u.after)}</td>
</tr>`));
}
function fillOrph(){ const t=$('#tblOrph'); t.innerHTML=`
<thead><tr>
<th>Date/Heure</th><th>Joueur</th><th>Alliance</th><th class="r">Avant</th><th class="r">Après</th><th class="r">Montant</th>
</tr></thead><tbody></tbody>`; const tb=t.querySelector('tbody');
view.orph.forEach(o=>tb.insertAdjacentHTML('beforeend',`<tr>
<td class="mono">${dispDate(o.ts)}</td>
<td>${esc(o.who)}</td><td>${esc(o.ally)}</td>
<td class="r mono">${fmt.format(o.before)}</td>
<td class="r mono">${fmt.format(o.after)}</td>
<td class="r mono">${htmlNet(o.signAmt)}</td>
</tr>`));

  const totalOrph = view.orph.reduce((acc,o)=>acc+o.signAmt,0);
  tb.insertAdjacentHTML('beforeend', `<tr class="total"><td colspan="5" class="r"><b>Total</b></td><td class="r mono"><b>${htmlNet(totalOrph)}</b></td></tr>`);
}

/* ==================== Export ASCII façon Toolzzz ==================== */
function stripTags(s){ return String(s).replace(/\[(\/)?[^\]]+\]/g,''); }
function visibleLen(s){ return stripTags(s).length; }
function len(s){ return visibleLen(s); }
const DOTC = (n)=> n>0 ? `[color=${COLOR_DOTS}]${'.'.repeat(n)}[/color]` : '';
function centerDots(s, w){
  s = stripTags(s);
  const pad = Math.max(0, w - s.length);
  const left = Math.floor(pad / 2);
  const right = pad - left;
  return DOTC(left) + s + DOTC(right);
}
function rightDots(s, w){ const plain = stripTags(s); return DOTC(Math.max(0, w - plain.length)) + s; }
function leftDots (s, w){ const plain = stripTags(s); return s + DOTC(Math.max(0, w - plain.length)); }
const bbNet = (n)=> n>0 ? `[color=${COLOR_POS}]${fmt.format(n)}[/color]`
                        : n<0 ? `[color=${COLOR_NEG}]${fmt.format(n)}[/color]`
                              : fmt.format(n);

function asciiBox(headers, rows, aligns){
  const widths = headers.map((h,i)=> Math.max(len(h), ...rows.map(r=>len(r[i]??''))));
  const makeLine = (cells)=> '|' + cells.join('|') + '|';

  const hdrCells = headers.map((h,i)=> ' ' + centerDots(h, widths[i]) + ' ');
  const hdrLine  = makeLine(hdrCells);
  const totalVis = visibleLen(hdrLine);
  const border   = '|' + '-'.repeat(totalVis - 2) + '|';

  const body = rows.map(r=>{
    const cells = r.map((c,i)=> ' ' + (aligns[i]==='right' ? rightDots(c,widths[i]) : leftDots(c,widths[i])) + ' ');
    return makeLine(cells);
  });

  return [border, hdrLine, border, ...body, border].join('\n');
}
function wrapCode(s){ return `[code][b]\n${s}\n[/b][/code]`; }

/* ---- Générateurs ---- */
function buildAsciiAlli(list){
  const H=['Alliance','Gains','Pertes','Net','#Victoires','#Défaites'];
  const A=['left','right','right','right','right','right'];
  const R=list.map(a=>[
    a.alliance, fmt.format(a.gain), fmt.format(a.loss), bbNet(a.net), String(a.wins), String(a.defeats)
  ]);
  return asciiBox(H,R,A);
}
function buildAsciiAgg(list){
  const H=['Joueur','Alliance','Gains','Pertes','Net','Première','Dernière'];
  const A=['left','left','right','right','right','left','left'];
  const R=list.map(a=>[
    a.player, a.ally, fmt.format(a.gain), fmt.format(a.loss), bbNet(a.net),
    a.first?dispDate(a.first):'', a.last?dispDate(a.last):''
  ]);
  return asciiBox(H,R,A);
}
function buildAsciiTx(list){
  const H=['Date/Heure','Gagnant','Alliance','Perdant','Alliance','Montant'];
  const A=['left','left','left','left','left','right'];
  const R=list.map(t=>[dispDate(t.ts), t.winner, t.wAlly, t.loser, t.lAlly, fmt.format(t.amount)]);
  return asciiBox(H,R,A);
}
function buildAsciiUps(list){
  const H=['Date/Heure','Joueur','Alliance','Type','Avant','Après'];
  const A=['left','left','left','left','right','right'];
  const R=list.map(u=>[dispDate(u.ts), u.player, u.ally, u.type, fmt.format(u.before), fmt.format(u.after)]);
  return asciiBox(H,R,A);
}
function buildAsciiOrph(list){
  const H=['Date/Heure','Joueur','Alliance','Avant','Après','Montant'];
  const A=['left','left','left','right','right','right'];
  const R=list.map(o=>[dispDate(o.ts), o.who, o.ally, fmt.format(o.before), fmt.format(o.after), fmt.format(o.signAmt)]);
  const total=list.reduce((a,o)=>a+o.signAmt,0);
  R.push(['','','','','Total', fmt.format(total)]);
  return asciiBox(H,R,A);
}

/* ==================== Helpers ==================== */
function todayFR(){
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}
function shiftDate(fr,dd){
  const [d,m,y]=fr.split('/').map(n=>+n);
  const dt=new Date(y,m-1,d);
  dt.setDate(dt.getDate()+dd);
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
}
function frToMs(frDate, hhmm){
  const [d,m,y]=frDate.split('/').map(Number);
  const [H,M]=hhmm.split(':').map(Number);
  return new Date(y,m-1,d,H,M,0,0).getTime();
}
function dispDate(ms){
  const d=new Date(ms);
  const dd=String(d.getDate()).padStart(2,'0');
  const mm=String(d.getMonth()+1).padStart(2,'0');
  const yy=d.getFullYear();
  const HH=String(d.getHours()).padStart(2,'0');
  const MM=String(d.getMinutes()).padStart(2,'0');
  return `${dd}/${mm}/${yy} ${HH}:${MM}`;
}
function num(s){
  const raw=String(s).replace(/[\u00A0\u202F\s]+/g,'');
  const m=raw.match(/^([+\-–]?)(\d.*)$/);
  if(!m) return Number(raw.replace(/[^\d]/g,''));
  const sign=(m[1]==='–')?'-':m[1];
  return Number(sign + m[2].replace(/[^\d]/g,''));
}
function esc(s){return String(s).replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
function minDate(a,b){ if(a==null) return b; return Math.min(a,b); }
function maxDate(a,b){ if(a==null) return b; return Math.max(a,b); }
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
async function copyToClipboard(text){
  try{await navigator.clipboard.writeText(text); setStatus('ASCII copié ✅');}
  catch{const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); setStatus('ASCII copié (fallback) ✅');}
}
function normKind(k){
  if (/tdc/i.test(k)) return 'tdc';
  if (/fourmi/i.test(k)) return 'fourmiliere';
  return 'technologie';
}

/* ==================== API Outiiil ==================== */

/* ==================== API Outiiil (helpers) ==================== */
const API_DEFAULT_BASE = 'http://127.0.0.1:8000';
function _getApiBase(){ try{ return (localStorage.getItem(LS_API_BASE) || API_DEFAULT_BASE).trim().replace(/\/+$/,''); } catch(_){ return API_DEFAULT_BASE; } }
function _getApiKey(){  try{ return (localStorage.getItem(LS_API_KEY)  || '').trim(); } catch(_){ return ''; } }

async function _api(path, opts = {}){
  const base = _getApiBase(); const key = _getApiKey();
  const url  = base + String(path || '');
  const urlWithKey = url + (url.includes('?') ? '&' : '?') + (key ? ('key='+encodeURIComponent(key)) : '');

  const headers = { ...(opts.headers||{}) };
  if (key) {
    headers['X-API-Key'] = key;                       // compat header
    headers['Authorization'] = `Bearer ${key}`;       // compat bearer
  }
  const controller = new AbortController();
  const timeoutMs = opts.timeoutMs ?? 25000;
  const timer = setTimeout(()=>controller.abort(new Error('timeout')), timeoutMs);

  let res;
  try{
    res = await fetch(urlWithKey, { ...opts, mode:'cors', headers, signal: controller.signal });
  }catch(netErr){
    const err = new Error(netErr?.message || 'Network error'); err.cause = netErr; throw err;
  } finally {
    clearTimeout(timer);
  }

  const hdrs = {};
  for(const [k,v] of res.headers.entries()) hdrs[k.toLowerCase()] = v;

  if(!res.ok){
    let payload = null;
    const ct=(res.headers.get('content-type')||'').toLowerCase();
    try{ payload = ct.includes('application/json')? await res.json() : await res.text(); }catch(_){ payload=null; }
    const err = new Error('HTTP '+res.status);
    err.status = res.status;
    err.payload = payload;
    err.headers = hdrs;
    const ra = parseFloat(hdrs['retry-after']);
    if(Number.isFinite(ra)) err.retryAfterSec = ra;
    throw err;
  }

  const ct=(res.headers.get('content-type')||'').toLowerCase();
  return ct.includes('application/json') ? res.json() : res.text();
}
window.OutiiilAPI = _api;

window.OutiiilTDC = (function(){
  const api = {};
  api.open   = ()=>{ $('#panel').classList.add('show'); requestAnimationFrame(updateScrollHeights); };
  api.close  = ()=>{ $('#panel').classList.remove('show'); };
  api.toggle = ()=>{ toggle(); };
  api.fill   = (txt)=>{ $('#raw').value = txt||''; };
  api.parse  = ()=>{ $('#analyze').click(); };

  api.api    = _api;
  api.setApi = function({base, key}={}){
    if(base!=null) try{ localStorage.setItem(LS_API_BASE, String(base||'').trim()); }catch(_){}
    if(key !=null) try{ localStorage.setItem(LS_API_KEY,  String(key ||'').trim()); }catch(_){}
    return { base:_getApiBase(), key:_getApiKey() };
  };
return api;
})();


function stripMdBackticks(text) {
  const lines = String(text || '').split(/\r?\n/).map(line => {
    // enlève seulement les backticks d'ouverture/fermeture, pas de "nom de langue"
    let s = line.replace(/^\s*```+/, '').replace(/```+\s*$/, '');
    // supprime les ` inline restants
    s = s.replace(/`+/g, '');
    return s;
  });
  return lines.join('\n');
}

/* ==================== Onglet Discord (init + handlers) ==================== */

function dcLoadSaved(){
  try{ $('#apiBase').value = _getApiBase(); }catch(_){}
  try{ $('#apiKey').value  = _getApiKey();  }catch(_){}
}
dcLoadSaved();
$('#apiSave').addEventListener('click', ()=>{
  const base=$('#apiBase').value.trim()||API_DEFAULT_BASE;
  const key=$('#apiKey').value.trim();
  OutiiilTDC.setApi({ base, key });
  setStatus('API enregistrée.');
});

$('#apiTest').addEventListener('click', async ()=>{
  try{
    const h = await OutiiilAPI('/health');
    let who=null; try{ who = await OutiiilAPI('/whoami'); }catch(_){}
    setStatus(`API ok · requires_api_key=${h.requires_api_key?'oui':'non'} · ${who?'whoami ok':'whoami ?'}`);
  }catch(err){ console.error(err); setStatus(`Erreur API: ${err.status||''} ${err.payload?.detail||''}`); }
});

$('#dcLoadGuilds').addEventListener('click', async ()=>{
  try{
    const list = await OutiiilAPI('/guilds');
    const sel = $('#dcGuild');
    sel.innerHTML = '<option value="">— Sélectionne une guild —</option>' + (list||[]).map(g=>`<option value="${esc(g.id)}">${esc(g.name||g.id)}</option>`).join('');
    setStatus(`${(list||[]).length} guild(s).`);
  }catch(err){ console.error(err); setStatus(`Erreur guilds: ${err.status||''}`); }
});

$('#dcLoadChannels').addEventListener('click', async ()=>{
  const gid = $('#dcGuild').value; if(!gid){ setStatus('Choisis une guild.'); return; }
  try{
    const list = await OutiiilAPI(`/guilds/${encodeURIComponent(gid)}/channels`);
    const sel = $('#dcChannel');
    sel.innerHTML = '<option value="">— Sélectionne un salon —</option>' + (list||[]).map(c=>`<option value="${esc(c.id)}">${esc(c.name||c.id)} (${c.type})</option>`).join('');
    setStatus(`${(list||[]).length} salon(s).`);
  }catch(err){ console.error(err); setStatus(`Erreur salons: ${err.status||''}`); }
});

$('#dcClearDates').addEventListener('click', ()=>{
  $('#dcFromDate').value = ''; $('#dcToDate').value = ''; $('#dcFromTime').value = ''; $('#dcToTime').value = '';
});
$('#copyOrph').addEventListener('click',()=>copyToClipboard(wrapCode(buildAsciiOrph(view.orph))));

async function dcFetchMessages(){
  const cid = $('#dcChannel').value;
  if(!cid){ setStatus('Choisis un salon.'); return ''; }

  const fromD = ($('#dcFromDate').value||'').trim();
  const toD   = ($('#dcToDate').value||'').trim();
  const fromT = ($('#dcFromTime').value||'').trim();
  const toT   = ($('#dcToTime').value||'').trim();

  const dtToFr = (dt)=> {
    const dd=String(dt.getDate()).padStart(2,'0');
    const mm=String(dt.getMonth()+1).padStart(2,'0');
    const yy=dt.getFullYear();
    const HH=String(dt.getHours()).padStart(2,'0');
    const MM=String(dt.getMinutes()).padStart(2,'0');
    return `${dd}/${mm}/${yy} ${HH}:${MM}`;
  };
  const parseYMD = (ymd)=> new Date(`${ymd}T00:00:00`);
  const clampToDayStart = (dt)=> new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0,0,0,0);
  const addDays = (dt,n)=> new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()+n, 0,0,0,0);
  const sleep = (ms)=> new Promise(r=>setTimeout(r, ms));

  // Aucun filtre => un tir direct
  if(!fromD && !toD){
    try{
      const txt = await OutiiilAPI(`/channels/${encodeURIComponent(cid)}/messages`);
      const clean = stripMdBackticks(txt);    // preview nettoyée
      const lines = (clean||'').split(/\r?\n/);
      const t=$('#tblDcPreview');
      t.innerHTML = '<thead><tr><th>Aperçu (début)</th></tr></thead><tbody></tbody>';
      const tb=t.querySelector('tbody');
      lines.slice(0, 10).forEach(L=>tb.insertAdjacentHTML('beforeend', `<tr><td class="mono">${esc(L)}</td></tr>`));
      setStatus(`${fmt.format(lines.filter(Boolean).length)} ligne(s) importées.`);
      return clean||'';
    }catch(err){ console.error(err); setStatus(`Erreur export: ${err.status||''} ${err.payload?.detail||''}`); return ''; }
  }

  // Bornes exactes
  let start = fromD ? parseYMD(fromD) : null;
  let end   = toD   ? parseYMD(toD)   : null;

  if(start && fromT){
    const [h,m] = fromT.split(':').map(Number);
    start.setHours(h||0, m||0, 0, 0);
  }

  const endWantsFullDay = !toT || /^\s*0{1,2}:0{2}\s*$/.test(toT);
  if(end){
    if(endWantsFullDay){
      end = addDays(end, 1); // inclut toute la journée "au"
    }else{
      const [h,m] = toT.split(':').map(Number);
      end.setHours(h||0, m||0, 0, 0); // borne exclusive
    }
  }

  if(!start && end){ start = new Date('1970-01-01T00:00:00'); }
  else if(start && !end){ end = addDays(clampToDayStart(start), 1); }

  // Fenêtres quotidiennes [after, before[
  const EPS_MS = 60_000; // chevauchement 1 min
  const windows = [];
  let cursor = clampToDayStart(start);
  const hardEnd = end;
  const MAX_DAYS = 366;
  let guard = 0;

  while(cursor < hardEnd && guard++ < MAX_DAYS){
    const dayStart = cursor;
    const nextDay  = addDays(dayStart, 1);
    const afterDt  = (windows.length === 0) ? start : dayStart;
    const beforeDt = new Date(Math.min(nextDay.getTime() + EPS_MS, hardEnd.getTime() + EPS_MS));
    if(afterDt >= beforeDt) break;
    windows.push({ after: afterDt, before: beforeDt });
    cursor = nextDay;
  }

  // Backoff 429 (lit header Retry-After + payload)
  async function fetchWindowWithBackoff(w){
    const params = new URLSearchParams();
    params.set('after',  dtToFr(w.after));
    params.set('before', dtToFr(w.before));
    let attempts = 0;
    for(;;){
      try{
        return await OutiiilAPI(`/channels/${encodeURIComponent(cid)}/messages?${params.toString()}`);
      }catch(err){
        const code = err?.status|0;
        if(code === 429){
          const headSec = Number.isFinite(err?.retryAfterSec) ? err.retryAfterSec : NaN;
          const jsonSec = (err?.payload && typeof err.payload === 'object') ? Number(err.payload.retry_after ?? err.payload.retryAfter ?? NaN) : NaN;
          const textSec = (typeof err?.payload === 'string') ? (()=>{
            const m = err.payload.match(/retry[-_ ]?after["']?\s*[:=]\s*("?)(\d+(\.\d+)?)/i);
            return m ? Number(m[2]) : NaN;
          })() : NaN;
          const base = Number.isFinite(headSec) ? headSec : (Number.isFinite(jsonSec) ? jsonSec : (Number.isFinite(textSec) ? textSec : 0.9));
          const jitter = 0.2 + Math.random()*0.6;
          const waitMs = Math.min(9000, Math.ceil((base + attempts*0.7 + jitter)*1000));
          setStatus(`Limite atteinte (429) — pause ${fmt.format(waitMs)} ms...`);
          await sleep(waitMs);
          attempts++;
          continue;
        }
        if((code>=500 && code<600) && attempts<4){
          const waitMs = (attempts+1)*900;
          setStatus(`Discord 5xx — pause ${fmt.format(waitMs)} ms...`);
          await sleep(waitMs);
          attempts++;
          continue;
        }
        throw err;
      }
    }
  }

  // Récupération séquentielle + dédup + tempo entre fenêtres
  const seen = new Set();
  const all = [];
  for(const w of windows){
    let txt = '';
    try{
      txt = await fetchWindowWithBackoff(w);
    }catch(err){
      console.error(err);
      setStatus(`Erreur export (${dtToFr(w.after)} → ${dtToFr(w.before)}): ${err.status||''} ${err.payload?.detail||''}`);
      continue;
    }
    const clean = stripMdBackticks(txt);
    const lines = (clean||'').split(/\r?\n/);
    for(const L of lines){
      if(!L) continue;
      if(seen.has(L)) continue;
      seen.add(L);
      all.push(L);
    }
    const BETWEEN_MS = 900 + Math.floor(Math.random()*400); // 900–1300ms
    await sleep(BETWEEN_MS);
  }

  // Aperçu + statut
  const out = all.join('\n');
  const t=$('#tblDcPreview');
  t.innerHTML = '<thead><tr><th>Aperçu (début)</th></tr></thead><tbody></tbody>';
  const tb=t.querySelector('tbody');
  out.split(/\r?\n/).slice(0,10).forEach(L=>tb.insertAdjacentHTML('beforeend', `<tr><td class="mono">${esc(L)}</td></tr>`));

  const ymdToFr = (ymd)=>{ const [y,m,d]=ymd.split('-').map(Number); return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`; };
  const per = `${fromD? (ymdToFr(fromD)+' '+(fromT||'00:00')) : '…'} → ${toD ? ( (!toT||/^\s*0{1,2}:0{2}\s*$/.test(toT)) ? (ymdToFr(toD)+' 23:59') : (ymdToFr(toD)+' '+toT) ) : '…'}`;
  setStatus(`${fmt.format(all.filter(Boolean).length)} ligne(s) gardée(s) · ${windows.length} appel(s) API · période: ${per}.`);

  return out;
}

$('#dcToRaw').addEventListener('click', async ()=>{
  const txt = await dcFetchMessages();
  if(txt){ $('#raw').value = stripMdBackticks(txt); }   // nettoyage backticks
});
$('#dcToJournal').addEventListener('click', async ()=>{
  const txt = await dcFetchMessages();
  if(!txt) return;
  const clean = stripMdBackticks(txt);                  // nettoyage backticks
  const sep = $('#journal').value.endsWith('\n') || !$('#journal').value ? '' : '\n';
  $('#journal').value += sep + clean; saveJournal($('#journal').value); journalUpdateStats();
});


;['#apiBase','#apiKey'].forEach(sel=>{
  try{
    shadow.querySelector(sel).addEventListener('blur', ()=>{
      const base=$('#apiBase').value.trim()||API_DEFAULT_BASE;
      const key=$('#apiKey').value.trim();
      OutiiilTDC.setApi({base,key});
    });
  }catch(_){}
});



/* ---- Options: Orphelines threshold ---- */
function orphLoadMin(){ const v = getOrphMin(); $('#orphMin').value = Number.isFinite(v) ? String(v) : ''; }
function orphApplyMin(){
  const raw = ($('#orphMin').value||'').trim().replace(/\s+/g,'');
  if(!raw){ setOrphMin(''); } else {
    const n = parseInt(raw,10);
    if(Number.isFinite(n)){ setOrphMin(n); } else { setOrphMin(''); }
  }
  // Re-render with new filter
  renderAll({}, true);
}
try{
  $('#orphApply').addEventListener('click', orphApplyMin);
  $('#orphMin').addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); orphApplyMin(); } });
  // Auto-save on blur
  $('#orphMin').addEventListener('blur', ()=>{ orphApplyMin(); });
}catch(_){}

/* ==================== Données exemple ==================== */
const SAMPLE=`
— 15/08/2025 00:50
Vivince2014(LHDC): +5 685 624 tdc | 32 706 119 => 38 391 743
jbval(LHDC): -1 305 265 tdc | 17 625 128 => 16 319 863
tony0768(LHDC): -4 380 359 tdc | 21 901 798 => 17 521 439
Fourmeline(LHDC): -46 117 353 tdc | 230 586 767 => 184 469 414
kingkong(LHDC): +46 117 353 tdc | 398 079 793 => 444 197 146
Fourmeline(LHDC): +37 079 526 tdc | 184 469 414 => 221 548 940
Nova-kun(LHDC): -37 079 526 tdc | 134 412 725 => 97 333 199

— Hier à 03:47
Christheall(TRID): +7 674 044 730 tdc | 19 994 459 168 => 27 668 503 898
mamandepatateetdragon(NOIR): -7 674 044 730 tdc | 38 370 223 653 => 30 696 178 923
— 08:12
panoupanou(-FADA): +1 fourmiliere | 447 => 448
— 15/08/2025 07:56
lyse-mo(-FADA): +1 technologie | 241 => 242
`;

})();
