// js/boite/MultiFlood.js
// MultiFlood natif pour Outiiil-test2 — planifie et enchaîne des vagues (sans dépendance externe).
// Dépendances : Boite, jQuery, jQuery UI (spinner), Utils, TOAST_*

(function(){
'use strict';

const LS_KEY_CFG   = 'Outiiil:MultiFlood:cfg:v1';
const LS_KEY_STATE = 'Outiiil:MultiFlood:state:v1';

function now(){ return Date.now(); }
function pad2(n){ return String(n).padStart(2, '0'); }
function formatClock(ms){
  const s = Math.max(0, Math.floor(ms/1000));
  const h = Math.floor(s/3600);
  const m = Math.floor((s%3600)/60);
  const se= s%60;
  return `${h}:${pad2(m)}:${pad2(se)}`;
}

// ============ MOTEUR ============

class Scheduler {
  constructor({onTick, onExec}){
    this.queue = [];        // [{t, lineId, wave, payload}]
    this.timer = null;
    this.running = false;
    this.onTick = onTick || function(){};
    this.onExec = onExec || function(){};
    this.concurrency = 1;
    this.inFlight = 0;
    this.tolerance = 150; // ms
  }
  setConcurrency(n){ this.concurrency = Math.max(1, ~~n || 1); }

  load(queue){ // remplace la file
    this.queue = (queue||[]).slice().sort((a,b)=>a.t-b.t);
  }
  push(item){
    this.queue.push(item);
    this.queue.sort((a,b)=>a.t-b.t);
  }
  clear(){ this.queue.length = 0; }

  start(){
    if (this.running) return;
    this.running = true;
    this._loop();
  }
  stop(){
    this.running = false;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
  }
  _loop(){
    if (!this.running) return;
    const nowMs = now();
    // Déclenche tout ce qui est dû, en respectant la concurrence
    while (this.queue.length && this.inFlight < this.concurrency){
      const n = this.queue[0];
      if (n.t <= nowMs + this.tolerance){
        this.queue.shift();
        this.inFlight++;
        this.onExec(n, ()=>{ // done
          this.inFlight = Math.max(0, this.inFlight-1);
        }, (err)=>{
          console.error('[MultiFlood] send error:', err);
          this.inFlight = Math.max(0, this.inFlight-1);
        });
      } else break;
    }
    this.onTick({now: nowMs, next: this.queue[0]?.t ?? null, left: this.queue.length, inFlight: this.inFlight});
    const delay = this.queue.length ? Math.max(20, (this.queue[0].t - nowMs) / 2) : 250;
    this.timer = setTimeout(()=>this._loop(), delay);
  }
}

// ============ BOÎTE UI ============

class BoiteMultiFlood extends Boite {

  static _sender = null; // function (job, done, fail)
  static registerSender(fn){ BoiteMultiFlood._sender = fn; }

  constructor(){
    super(
      "o_boiteMultiFlood",
      "MultiFlood",
      `<div id="o_mf" class="o_maxWidth" style="padding:8px;">
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:8px;">
          <button id="o_mf_add" class="o_btn">+ Ligne</button>
          <button id="o_mf_save" class="o_btn">Sauvegarder</button>
          <button id="o_mf_load" class="o_btn">Charger</button>
          <button id="o_mf_clear" class="o_btn">Vider</button>
          <span style="flex:1 1 auto"></span>
          <label>Concurrence
            <input id="o_mf_cc" value="1" size="2" style="width:38px; text-align:center;">
          </label>
          <button id="o_mf_plan" class="o_btn">Planifier</button>
          <button id="o_mf_start" class="o_btn">Lancer</button>
          <button id="o_mf_stop" class="o_btn" disabled>Stop</button>
        </div>

        <table id="o_mf_tbl" class="o_table mf_tbl" style="width:100%; border-collapse:collapse;">
          <thead>
            <tr class="gras">
              <td style="width:36px;">On</td>
              <td style="min-width:120px;">Cible (libellé / id / coords / URL)</td>
              <td style="min-width:120px;">Unités (ex: "JSN:1000,SN:500")</td>
              <td style="width:70px;">Vagues</td>
              <td style="width:90px;">Intervalle (s)</td>
              <td style="width:90px;">Décalage (s)</td>
              <td style="width:90px;">Jitter ± (s)</td>
              <td style="width:60px;">Actions</td>
            </tr>
          </thead>
          <tbody></tbody>
          <tfoot>
            <tr class="o_ponte_total" style="background:rgba(0,0,0,0.04); font-weight:600;">
              <td colspan="2">Total</td>
              <td colspan="2" style="text-align:right;">Événements : <span id="o_mf_ev">0</span></td>
              <td colspan="2" style="text-align:right;">Début dans : <span id="o_mf_eta">—</span></td>
              <td colspan="2" style="text-align:right;">Durée totale : <span id="o_mf_dur">—</span></td>
            </tr>
          </tfoot>
        </table>

        <div id="o_mf_log" style="margin-top:10px; max-height:220px; overflow:auto; background:rgba(0,0,0,0.04); padding:6px; border-radius:6px; font-family:monospace; font-size:12px;"></div>
      </div>`
    );

    this.scheduler = new Scheduler({
      onTick: (st)=> this._onTick(st),
      onExec: (job, done, fail)=> this._exec(job, done, fail)
    });
  }

  afficher(){
    if (super.afficher()){
      this.css().event();
      // Charger config si dispo
      const cfg = this._loadCfg();
      if (cfg?.rows?.length) {
        cfg.rows.forEach(r => this._addRow(r));
        $("#o_mf_cc").val(cfg.concurrency || 1);
      } else {
        // Ligne d'exemple
        this._addRow({on: true, target: 'Cible #1', units: 'JSN:1000', waves: 5, interval: 6, offset: 0, jitter: 0});
      }
    }
    return this;
  }

  css(){
    super.css();
    const $box = $("#o_mf");
    $box.find(".o_btn").css({ padding:'6px 10px', borderRadius:'6px', cursor:'pointer' });
    $box.find("input").css({ padding:'2px 4px', borderRadius:'4px' });
    $("#o_mf_tbl td").css({ borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'4px' });
    return this;
  }

  event(){
    super.event();
    const $ = window.jQuery;

    // Spinners
    const spinInt = {min:0, numberFormat:'i'};
    $("#o_mf_cc").spinner(spinInt);

    // Boutons barre
    $("#o_mf_add").on('click', ()=> this._addRow());
    $("#o_mf_save").on('click', ()=> this._saveCfg());
    $("#o_mf_load").on('click', ()=> this._reloadCfg());
    $("#o_mf_clear").on('click', ()=> this._clearRows());
    $("#o_mf_plan").on('click', ()=> this._planifier());
    $("#o_mf_start").on('click', ()=> this._start());
    $("#o_mf_stop").on('click',  ()=> this._stop());

    // Raccourcis
    this._log('Prêt. Ajoute des lignes et clique Planifier → Lancer.');
    return this;
  }

  // ---------- Gestion des lignes ----------
  _addRow(data){
    const $tb = $("#o_mf_tbl tbody");
    const id = Math.random().toString(36).slice(2,9);
    const row = Object.assign({
      on: true, target:'', units:'', waves:1, interval:1, offset:0, jitter:0
    }, data||{});

    const $tr = $(`
      <tr data-id="${id}">
        <td style="text-align:center;"><input type="checkbox" class="mf_on"></td>
        <td><input class="mf_target"  placeholder="Ex: 12345 / 1:2:3 / http://…"></td>
        <td><input class="mf_units"   placeholder='Ex: "JSN:1000,SN:500"'></td>
        <td><input class="mf_waves"   style="width:60px;"></td>
        <td><input class="mf_interval"style="width:80px;"></td>
        <td><input class="mf_offset"  style="width:80px;"></td>
        <td><input class="mf_jitter"  style="width:80px;"></td>
        <td style="text-align:center;">
          <button class="o_btn mf_dup" title="Dupliquer">⧉</button>
          <button class="o_btn mf_del" title="Supprimer">✖</button>
        </td>
      </tr>
    `);

    $tb.append($tr);
    $tr.find('.mf_on').prop('checked', !!row.on);
    $tr.find('.mf_target').val(row.target);
    $tr.find('.mf_units').val(row.units);
    $tr.find('.mf_waves').val(row.waves).spinner({min:1, numberFormat:'i'});
    $tr.find('.mf_interval').val(row.interval).spinner({min:0, numberFormat:'i'});
    $tr.find('.mf_offset').val(row.offset).spinner({min:0, numberFormat:'i'});
    $tr.find('.mf_jitter').val(row.jitter).spinner({min:0, numberFormat:'i'});

    // actions
    $tr.find('.mf_dup').on('click', ()=>{
      this._addRow(this._readRow($tr));
    });
    $tr.find('.mf_del').on('click', ()=>{
      $tr.remove();
      this._planifier(false);
    });
  }

  _readRow($tr){
    return {
      on:       $tr.find('.mf_on').prop('checked'),
      target:   $tr.find('.mf_target').val().trim(),
      units:    $tr.find('.mf_units').val().trim(),
      waves:    ~~$tr.find('.mf_waves').spinner('value'),
      interval: ~~$tr.find('.mf_interval').spinner('value'),
      offset:   ~~$tr.find('.mf_offset').spinner('value'),
      jitter:   ~~$tr.find('.mf_jitter').spinner('value'),
      id:       $tr.data('id')
    };
  }

  _readAllRows(){
    const rows = [];
    $("#o_mf_tbl tbody tr").each((_, tr)=>{
      rows.push(this._readRow($(tr)));
    });
    return rows;
  }

  _clearRows(){
    $("#o_mf_tbl tbody").empty();
    this._planifier(false);
  }

  // ---------- Config ----------
  _saveCfg(){
    const cfg = {
      concurrency: ~~$("#o_mf_cc").spinner('value') || 1,
      rows: this._readAllRows()
    };
    try {
      localStorage.setItem(LS_KEY_CFG, JSON.stringify(cfg));
      $.toast?.({...TOAST_SUCCESS, text:"MultiFlood sauvegardé."});
    } catch(e) {
      console.error(e);
      $.toast?.({...TOAST_ERROR, text:"Échec sauvegarde (quota ?)"});
    }
  }
  _loadCfg(){
    try {
      const raw = localStorage.getItem(LS_KEY_CFG);
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  }
  _reloadCfg(){
    $("#o_mf_tbl tbody").empty();
    const cfg = this._loadCfg();
    if (cfg?.rows?.length){
      cfg.rows.forEach(r => this._addRow(r));
      $("#o_mf_cc").val(cfg.concurrency || 1);
      this._planifier(false);
      $.toast?.({...TOAST_INFO, text:"MultiFlood chargé."});
    } else {
      $.toast?.({...TOAST_INFO, text:"Aucune configuration sauvegardée."});
    }
  }

  // ---------- Planification ----------
  _planifier(toast=true){
    const rows = this._readAllRows().filter(r => r.on && r.waves>0);
    const baseT = now();
    const queue = [];
    let firstT = null, lastT = null;

    for (const r of rows){
      for (let k=0; k<r.waves; k++){
        const jitter = r.jitter ? (Math.floor((Math.random()*2-1)*r.jitter)*1000) : 0;
        const t = baseT + (r.offset*1000) + (k*r.interval*1000) + jitter;
        const job = {
          t,
          lineId: r.id,
          wave: k+1,
          totalWaves: r.waves,
          target: r.target,
          units: r.units,
        };
        queue.push(job);
        if (firstT===null || t<firstT) firstT=t;
        if (lastT===null  || t>lastT)  lastT=t;
      }
    }
    queue.sort((a,b)=>a.t-b.t);
    this.scheduler.setConcurrency(~~$("#o_mf_cc").spinner('value') || 1);
    this.scheduler.load(queue);

    $("#o_mf_ev").text(queue.length);
    $("#o_mf_eta").text(queue.length ? formatClock(firstT - baseT) : '—');
    $("#o_mf_dur").text(queue.length ? formatClock(lastT - firstT) : '—');

    if (toast) $.toast?.({...TOAST_INFO, text:`Planifié ${queue.length} envois.`});
    this._persistState();
  }

  // ---------- Exécution ----------
  _start(){
    if (!this.scheduler.queue.length) this._planifier(false);
    if (!this.scheduler.queue.length){
      $.toast?.({...TOAST_INFO, text:"Rien à lancer (plan vide)."});
      return;
    }
    $("#o_mf_start").prop('disabled', true);
    $("#o_mf_stop").prop('disabled', false);
    this._log('Démarrage…');
    this.scheduler.start();
    this._persistState();
  }

  _stop(){
    this.scheduler.stop();
    $("#o_mf_start").prop('disabled', false);
    $("#o_mf_stop").prop('disabled', true);
    this._log('Arrêt demandé.');
    this._persistState();
  }

  _onTick(st){
    // affichage léger du prochain départ
    if (st.next){
      const eta = Math.max(0, st.next - now());
      $("#o_mf_eta").text(formatClock(eta));
    } else {
      $("#o_mf_eta").text('—');
      $("#o_mf_start").prop('disabled', false);
      $("#o_mf_stop").prop('disabled', true);
    }
  }

  _exec(job, done, fail){
    const tag = `[${new Date(job.t).toLocaleTimeString()}]`;
    const txt = `${tag} Wave ${job.wave}/${job.totalWaves} → ${job.target} | ${job.units || '(aucune unité définie)'}`;
    if (typeof BoiteMultiFlood._sender === 'function'){
      try {
        BoiteMultiFlood._sender(job, ()=>{
          this._log('OK  ' + txt);
          done();
        }, (err)=>{
          this._log('ERR ' + txt + ' — ' + (err?.message || err));
          fail(err);
        });
      } catch(e){
        this._log('ERR ' + txt + ' — ' + e.message);
        fail(e);
      }
    } else {
      // Fallback : simulation (pas d’envoi réel)
      this._log('SIM ' + txt);
      setTimeout(done, 50);
    }
  }

  // ---------- Logs & State ----------
  _log(s){
    const $log = $("#o_mf_log");
    const line = document.createElement('div');
    line.textContent = s;
    $log.append(line);
    $log.scrollTop($log[0].scrollHeight);
  }

  _persistState(){
    const st = {
      running: this.scheduler.running,
      queueLen: this.scheduler.queue.length,
      cc: ~~$("#o_mf_cc").spinner('value') || 1
    };
    try{ localStorage.setItem(LS_KEY_STATE, JSON.stringify(st)); }catch(e){}
  }
}

// Expose la boîte
window.BoiteMultiFlood = BoiteMultiFlood;

// ============ EXEMPLE D’INTÉGRATION ENVOI RÉEL ============
//
// Branche l’envoi réel ici. Tu peux le faire dans un autre fichier si tu préfères.
// Le `job` contient : { t, lineId, wave, totalWaves, target, units }
// - `target` : ton id/coords/URL, à parser selon ton format
// - `units`  : texte "JSN:1000,SN:500" → à parser en {JSN:1000, SN:500, …}
//
// Exemple squelette : POST vers Armee.php (à adapter à tes champs exacts)
//
// BoiteMultiFlood.registerSender(async (job, done, fail) => {
//   try {
//     // 1) Parse
//     const units = {};
//     if (job.units) job.units.split(',').forEach(kv=>{
//       const [k,v] = kv.split(':'); units[k.trim()] = parseInt(v,10)||0;
//     });
//     // 2) Récup token si nécessaire
//     const base = "http://" + Utils.serveur + ".fourmizzz.fr";
//     const token = await $.get(base + "/Armee.php").then(html=>{
//       const $p = $('<div/>').append(html);
//       const $t = $p.find("#t");
//       return $t.attr('name') + '=' + $t.attr('value'); // ex: "t=abc123"
//     });
//     // 3) Construire payload (ADAPTER aux champs de ton formulaire d’attaque)
//     const send = {
//       // … tes champs cibles … ex. idVillage: job.target
//       "action": "attaque",
//       // unités : transforme selon les noms d’inputs attendus côté Fzzz (ex: uniteJSN, uniteSN…)
//       // Exemple:
//       // "uniteJSN": units.JSN || 0,
//       // "uniteSN":  units.SN  || 0,
//     };
//     const [tkName, tkValue] = token.split('=');
//     send[tkName] = tkValue;
//     // 4) POST
//     await $.post(base + "/Armee.php", send);
//     done();
//   } catch(e){
//     fail(e);
//   }
// });

})();
