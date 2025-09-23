// MultiFlood.js — Simulateur Multi-Flood (local, autonome)
// Dépendances attendues: jQuery ($), moment, (optionnel) $.toast, Joueur, Utils
(function(){
  'use strict';

  // Evite double définition
  if (window.MultiFlood) return;

  function parseCompo(text){
    text = (text||'').trim();
    if (!text) return null;
    if (text.indexOf('%') !== -1) {
      const parts = text.split(',').map(s => s.trim());
      const arr = new Array(14).fill(0);
      for (let i=0; i<parts.length && i<14; i++){
        const v = parseFloat(parts[i].replace('%',''));
        arr[i] = isNaN(v) ? 0 : (v/100);
      }
      return {type:'percent', value:arr};
    } else {
      const nums = text.split(',').map(s => Number((s||'').trim() || 0));
      const arr = new Array(14).fill(0);
      for (let i=0; i<Math.min(14, nums.length); i++) arr[i] = isNaN(nums[i])?0:nums[i];
      return {type:'absolute', value:arr};
    }
  }

  async function computeTravelSecondsAuto(originPseudo, targetPseudo){
    // Best-effort basé sur tes classes Joueur (si dispos)
    try{
      if (typeof Joueur !== 'function') return 0;
      const ref = new Joueur({pseudo: originPseudo});
      if (!ref.estJoueurCourant()) await ref.getProfil();
      const cible = new Joueur({pseudo: targetPseudo});
      await cible.getProfil();
      if (typeof ref.getTempsParcours2 === 'function'){
        return ref.getTempsParcours2(cible);
      }
    } catch(e){ console.warn('[MultiFlood] auto travel failed', e); }
    return 0;
  }

  function render(panelSel){
    const $panel = $(panelSel);
    $panel.empty();

    const html = `
      <div class="o_multiFlood" style="padding:10px;">
        <h3>Simulateur Multi-Flood (local)</h3>
        <table class="o_maxWidth" style="max-width:980px;">
          <tr>
            <td>Type cible</td>
            <td>
              <label><input type="radio" name="mf_target_type" value="pseudo" checked> Pseudo</label>
              <label style="margin-left:8px;"><input type="radio" name="mf_target_type" value="coords" disabled> Coordonnées</label>
            </td>
            <td>Pseudo</td>
            <td><input id="mf_target" placeholder="Pseudo" style="width:220px"/></td>
          </tr>
          <tr>
            <td>Origine</td>
            <td colspan="3"><input id="mf_origin" placeholder="Pseudo origine (pour calcul auto du temps)" style="width:320px"/></td>
          </tr>
          <tr>
            <td>Temps de trajet</td>
            <td>
                <label><input type="radio" name="mf_travel_mode" value="auto" checked> Auto</label>
                <label style="margin-left:8px;"><input type="radio" name="mf_travel_mode" value="manual"> Manuel</label>
            </td>
            <td>Trajet (s) si manuel</td>
            <td><input id="mf_travel_seconds" type="number" min="0" value="0" style="width:120px"/></td>
          </tr>
          <tr>
            <td>Vagues</td>
            <td><input id="mf_nb_waves" type="number" min="1" value="5" style="width:90px"/></td>
            <td>Intervalle entre vagues (s)</td>
            <td><input id="mf_interval" type="number" min="0" value="30" style="width:120px"/></td>
          </tr>
          <tr>
            <td>Jitter aléatoire (±s)</td>
            <td><input id="mf_jitter" type="number" min="0" value="3" style="width:120px"/></td>
            <td>Départ (optionnel)</td>
            <td><input id="mf_depart" placeholder="YYYY-MM-DD HH:mm:ss" style="width:220px"/></td>
          </tr>
          <tr>
            <td colspan="4">
              <strong>Composition par vague</strong> — 14 valeurs séparées par des virgules.<br/>
              <small>Ordre attendu : jsn, sn, ne, js, s, c, ce, a, ae, se, ta, tk, tae, tke</small>
            </td>
          </tr>
          <tr>
            <td colspan="4">
              <textarea id="mf_compo" rows="3" style="width:100%;" placeholder="Ex: 100,0,0,0,0,0,0,0,0,0,0,0,0,0  (ou pourcentages: 50%,30%,20%,...)"></textarea>
            </td>
          </tr>
          <tr>
            <td>Total si %</td>
            <td><input id="mf_total_percent" type="number" min="1" value="1000" style="width:120px"/></td>
            <td colspan="2" style="text-align:right;">
              <button id="mf_generate" class="o_button">Générer le plan</button>
              <button id="mf_export_csv" class="o_button" style="margin-left:8px;">Exporter CSV</button>
            </td>
          </tr>
        </table>

        <div id="mf_result" style="margin-top:12px;"></div>
      </div>
    `;
    $panel.append(html);

    $("#mf_generate").off('click').on('click', async function(){
      const target = $("#mf_target").val().trim();
      if (!target){ $.toast && $.toast({...TOAST_ERROR, text:"Cible non renseignée."}); return; }

      const origin = $("#mf_origin").val().trim();
      const travelMode = $("input[name='mf_travel_mode']:checked").val();
      let travelSeconds = Number($("#mf_travel_seconds").val()||0);
      const nbWaves = Math.max(1, parseInt($("#mf_nb_waves").val()||1,10));
      const interval = Math.max(0, parseInt($("#mf_interval").val()||0,10));
      const jitter   = Math.max(0, parseInt($("#mf_jitter").val()||0,10));
      const departTxt= $("#mf_depart").val().trim();
      const depart   = departTxt ? moment(departTxt, "YYYY-MM-DD HH:mm:ss") : moment();
      if (!depart.isValid()){ $.toast && $.toast({...TOAST_ERROR, text:"Date de départ invalide."}); return; }

      const compoSpec = parseCompo($("#mf_compo").val());
      if (!compoSpec){ $.toast && $.toast({...TOAST_ERROR, text:"Composition invalide."}); return; }
      const totalIfPercent = Math.max(1, parseInt($("#mf_total_percent").val()||1000,10));

      if (travelMode === 'auto'){
        if (!origin){ $.toast && $.toast({...TOAST_WARNING, text:"Origine vide : bascule sur 0s (renseigne le pseudo origine pour auto)."}); }
        else {
          const t = await computeTravelSecondsAuto(origin, target);
          if (t>0) travelSeconds = t;
          else $.toast && $.toast({...TOAST_WARNING, text:"Impossible de calculer automatiquement (0s retenu)."});
        }
      }

      const rows = [];
      let offsetCum = 0;
      for (let w=0; w<nbWaves; w++){
        const rand = jitter ? (Math.floor(Math.random()*(2*jitter+1)) - jitter) : 0;
        const offset = offsetCum + rand;
        const d = moment(depart).add(offset, 's');
        const a = moment(d).add(travelSeconds, 's');

        let units = new Array(14).fill(0);
        if (compoSpec.type === 'absolute'){
          units = compoSpec.value.slice();
        } else {
          for(let i=0;i<14;i++) units[i] = Math.round((compoSpec.value[i] || 0) * totalIfPercent);
        }

        rows.push({
          wave: w+1,
          depart: d.format("YYYY-MM-DD HH:mm:ss"),
          arrival: a.format("YYYY-MM-DD HH:mm:ss"),
          units: units
        });
        offsetCum += interval;
      }

      let table = `<div><table class="o_maxWidth" style="max-width:100%"><thead>
                     <tr><th>#</th><th>Départ</th><th>Arrivée</th><th>Composition</th><th>Actions</th></tr>
                   </thead><tbody>`;
      for (const r of rows){
        const compoStr = r.units.join(',');
        table += `<tr>
          <td>${r.wave}</td>
          <td>${r.depart}</td>
          <td>${r.arrival}</td>
          <td style="font-family:monospace">${compoStr}</td>
          <td>
            <button class="mf_copy o_button" data-comp="${compoStr}">Copier</button>
            <button class="mf_export_row o_button" data-row='${JSON.stringify(r).replace(/'/g,"&#39;")}'>Exporter</button>
          </td>
        </tr>`;
      }
      table += `</tbody></table></div>`;
      $("#mf_result").html(table);

      $(".mf_copy").off('click').on('click', function(){
        const text = $(this).data('comp');
        (navigator.clipboard && navigator.clipboard.writeText(text)
          .then(()=> $.toast && $.toast({...TOAST_SUCCESS, text:"Composition copiée."}))
          .catch(()=> $.toast && $.toast({...TOAST_WARNING, text:"Copie automatique impossible; copie manuelle."}))
        );
      });

      $(".mf_export_row").off('click').on('click', function(){
        const row = JSON.parse($(this).attr('data-row').replace(/&#39;/g,"'"));
        const csv = `vague,depart,arrivee,composition\n${row.wave},"${row.depart}","${row.arrival}","${row.units.join(',')}"\n`;
        const blob = new Blob([csv], {type:'text/csv'});
        const url  = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `mf_wave_${row.wave}.csv`; document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
      });
    });

    $("#mf_export_csv").off('click').on('click', function(){
      const $t = $("#mf_result table");
      if (!$t.length){ $.toast && $.toast({...TOAST_WARNING, text:"Aucun plan à exporter."}); return; }
      let csv = "vague,depart,arrivee,composition\n";
      $t.find("tbody tr").each((i,tr)=>{
        const wave   = $(tr).find('td:eq(0)').text().trim();
        const depart = $(tr).find('td:eq(1)').text().trim();
        const arr    = $(tr).find('td:eq(2)').text().trim();
        const comp   = $(tr).find('td:eq(3)').text().trim();
        csv += `${wave},"${depart}","${arr}","${comp}"\n`;
      });
      const blob = new Blob([csv], {type:'text/csv'});
      const url  = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `mf_plan_${moment().format("YYYYMMDD_HHmmss")}.csv`; document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    });
  }

  window.MultiFlood = {
    /**
     * @param {string} panelSelector - ex: '#o_tabsCombat3'
     * @returns {void}
     */
    boot(panelSelector){
      try{
        render(panelSelector || '#o_tabsCombat3');
      }catch(err){
        console.error('[MultiFlood] boot error:', err);
        if (window.$) {
          $(panelSelector||'#o_tabsCombat3').html(
            `<div style="padding:10px;color:#c00;">Erreur de rendu Multi-Flood: ${String(err)}</div>`
          );
        }
      }
    }
  };
})();
