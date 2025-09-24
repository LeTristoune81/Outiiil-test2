/*
 * BoitePonte.js
 * Hraesvelg
 **********************************************************************/

class BoitePonte extends Boite
{
    constructor()
    {
        let tdp = monProfil.getTDP();
        super("o_boitePonte", "Lanceur de Ponte", `<div id='o_ponteContent'><table class='o_maxWidth'>
                <tr class='gras'>
                  <td>Unité</td>
                  <td><img width='17' height='18' src='images/icone/icone_sablier.gif' alt='Durée :'/></td>
                  <td>Nombre</td>
                  <td>Année</td>
                  <td>Jour</td>
                  <td>Heure</td>
                  <td>Minute</td>
                  <td>Seconde</td>
                  <td></td>
                </tr>

                <tr><td>${NOM_RAC_UNITE[0]}</td><td>${BoitePonte.arrondiTemps(TEMPS_UNITE[0]  * Math.pow(0.9, tdp))}</td><td><input value='0' size='15' name='o_nombre0'/></td><td><input name='o_annee0'  value='0' size='3'/></td><td><input name='o_jour0' value='0' size='3'/></td><td><input name='o_heure0' value='0' size='2'/></td><td><input name='o_minute0' value='0' size='2'/></td><td><input name='o_seconde0' value='0' size='2'/></td><td class='cursor'><img id='o_lancer0'  height='20' src='images/icone/fourmi.png' alt='Lancer'></td></tr>
                <tr><td>${NOM_RAC_UNITE[1]}</td><td>${BoitePonte.arrondiTemps(TEMPS_UNITE[1]  * Math.pow(0.9, tdp))}</td><td><input value='0' size='15' name='o_nombre1'/></td><td><input name='o_annee1'  value='0' size='3'/></td><td><input name='o_jour1' value='0' size='3'/></td><td><input name='o_heure1' value='0' size='2'/></td><td><input name='o_minute1' value='0' size='2'/></td><td><input name='o_seconde1' value='0' size='2'/></td><td class='cursor'>${(monProfil.niveauConstruction[7] >= 1  ? "<img id='o_lancer1'  height='20' src='images/icone/fourmi.png' alt='Lancer'>" : "")}</td></tr>
                <tr><td>${NOM_RAC_UNITE[2]}</td><td>${BoitePonte.arrondiTemps(TEMPS_UNITE[2]  * Math.pow(0.9, tdp))}</td><td><input value='0' size='15' name='o_nombre2'/></td><td><input name='o_annee2'  value='0' size='3'/></td><td><input name='o_jour2' value='0' size='3'/></td><td><input name='o_heure2' value='0' size='2'/></td><td><input name='o_minute2' value='0' size='2'/></td><td><input name='o_seconde2' value='0' size='2'/></td><td class='cursor'>${(monProfil.niveauConstruction[7] >= 3  ? "<img id='o_lancer2'  height='20' src='images/icone/fourmi.png' alt='Lancer'>" : "")}</td></tr>
                <tr><td>${NOM_RAC_UNITE[3]}</td><td>${BoitePonte.arrondiTemps(TEMPS_UNITE[3]  * Math.pow(0.9, tdp))}</td><td><input value='0' size='15' name='o_nombre3'/></td><td><input name='o_annee3'  value='0' size='3'/></td><td><input name='o_jour3' value='0' size='3'/></td><td><input name='o_heure3' value='0' size='2'/></td><td><input name='o_minute3' value='0' size='2'/></td><td><input name='o_seconde3' value='0' size='2'/></td><td class='cursor'>${(monProfil.niveauConstruction[8] >= 4  ? "<img id='o_lancer3'  height='20' src='images/icone/fourmi.png' alt='Lancer'>" : "")}</td></tr>
                <tr><td>${NOM_RAC_UNITE[4]}</td><td>${BoitePonte.arrondiTemps(TEMPS_UNITE[4]  * Math.pow(0.9, tdp))}</td><td><input value='0' size='15' name='o_nombre4'/></td><td><input name='o_annee4'  value='0' size='3'/></td><td><input name='o_jour4' value='0' size='3'/></td><td><input name='o_heure4' value='0' size='2'/></td><td><input name='o_minute4' value='0' size='2'/></td><td><input name='o_seconde4' value='0' size='2'/></td><td class='cursor'>${(monProfil.niveauConstruction[7] >= 7  ? "<img id='o_lancer4'  height='20' src='images/icone/fourmi.png' alt='Lancer'>" : "")}</td></tr>
                <tr><td>${NOM_RAC_UNITE[5]}</td><td>${BoitePonte.arrondiTemps(TEMPS_UNITE[5]  * Math.pow(0.9, tdp))}</td><td><input value='0' size='15' name='o_nombre5'/></td><td><input name='o_annee5'  value='0' size='3'/></td><td><input name='o_jour5' value='0' size='3'/></td><td><input name='o_heure5' value='0' size='2'/></td><td><input name='o_minute5' value='0' size='2'/></td><td><input name='o_seconde5' value='0' size='2'/></td><td class='cursor'>${(monProfil.niveauConstruction[8] >= 9  ? "<img id='o_lancer5'  height='20' src='images/icone/fourmi.png' alt='Lancer'>" : "")}</td></tr>
                <tr><td>${NOM_RAC_UNITE[6]}</td><td>${BoitePonte.arrondiTemps(TEMPS_UNITE[6]  * Math.pow(0.9, tdp))}</td><td><input value='0' size='15' name='o_nombre6'/></td><td><input name='o_annee6'  value='0' size='3'/></td><td><input name='o_jour6' value='0' size='3'/></td><td><input name='o_heure6' value='0' size='2'/></td><td><input name='o_minute6' value='0' size='2'/></td><td><input name='o_seconde6' value='0' size='2'/></td><td class='cursor'>${(monProfil.niveauConstruction[7] >= 10 && monProfil.niveauRecherche[7] >= 5 ? "<img id='o_lancer6' height='20' src='images/icone/fourmi.png' alt='Lancer'>" : "")}</td></tr>
                <tr><td>${NOM_RAC_UNITE[8]}</td><td>${BoitePonte.arrondiTemps(TEMPS_UNITE[8]  * Math.pow(0.9, tdp))}</td><td><input value='0' size='15' name='o_nombre8'/></td><td><input name='o_annee8'  value='0' size='3'/></td><td><input name='o_jour8' value='0' size='3'/></td><td><input name='o_heure8' value='0' size='2'/></td><td><input name='o_minute8' value='0' size='2'/></td><td><input name='o_seconde8' value='0' size='2'/></td><td class='cursor'>${(monProfil.niveauConstruction[7] >= 11 && monProfil.niveauRecherche[8] >= 1 ? "<img id='o_lancer8' height='20' src='images/icone/fourmi.png' alt='Lancer'>" : "")}</td></tr>
                <tr><td>${NOM_RAC_UNITE[9]}</td><td>${BoitePonte.arrondiTemps(TEMPS_UNITE[9]  * Math.pow(0.9, tdp))}</td><td><input value='0' size='15' name='o_nombre9'/></td><td><input name='o_annee9'  value='0' size='3'/></td><td><input name='o_jour9' value='0' size='3'/></td><td><input name='o_heure9' value='0' size='2'/></td><td><input name='o_minute9' value='0' size='2'/></td><td><input name='o_seconde9' value='0' size='2'/></td><td class='cursor'>${(monProfil.niveauConstruction[8] >= 13 && monProfil.niveauRecherche[8] >= 5 ? "<img id='o_lancer9' height='20' src='images/icone/fourmi.png' alt='Lancer'>" : "")}</td></tr>
                <tr><td>${NOM_RAC_UNITE[10]}</td><td>${BoitePonte.arrondiTemps(TEMPS_UNITE[10] * Math.pow(0.9, tdp))}</td><td><input value='0' size='15' name='o_nombre10'/></td><td><input name='o_annee10' value='0' size='3'/></td><td><input name='o_jour10' value='0' size='3'/></td><td><input name='o_heure10' value='0' size='2'/></td><td><input name='o_minute10' value='0' size='2'/></td><td><input name='o_seconde10' value='0' size='2'/></td><td class='cursor'>${(monProfil.niveauConstruction[8] >= 17 ? "<img id='o_lancer10' height='20' src='images/icone/fourmi.png' alt='Lancer'>" : "")}</td></tr>
                <tr><td>${NOM_RAC_UNITE[11]}</td><td>${BoitePonte.arrondiTemps(TEMPS_UNITE[11] * Math.pow(0.9, tdp))}</td><td><input value='0' size='15' name='o_nombre11'/></td><td><input name='o_annee11' value='0' size='3'/></td><td><input name='o_jour11' value='0' size='3'/></td><td><input name='o_heure11' value='0' size='2'/></td><td><input name='o_minute11' value='0' size='2'/></td><td><input name='o_seconde11' value='0' size='2'/></td><td class='cursor'>${(monProfil.niveauConstruction[8] >= 23 && monProfil.niveauRecherche[7] >= 15 ? "<img id='o_lancer11' height='20' src='images/icone/fourmi.png' alt='Lancer'>" : "")}</td></tr>
                <tr><td>${NOM_RAC_UNITE[13]}</td><td>${BoitePonte.arrondiTemps(TEMPS_UNITE[13] * Math.pow(0.9, tdp))}</td><td><input value='0' size='15' name='o_nombre13'/></td><td><input name='o_annee13' value='0' size='3'/></td><td><input name='o_jour13' value='0' size='3'/></td><td><input name='o_heure13' value='0' size='2'/></td><td><input name='o_minute13' value='0' size='2'/></td><td><input name='o_seconde13' value='0' size='2'/></td><td class='cursor'>${(monProfil.niveauConstruction[7] >= 25 && monProfil.niveauRecherche[9] >= 4 ? "<img id='o_lancer13' height='20' src='images/icone/fourmi.png' alt='Lancer'>" : "")}</td></tr>
                <tr><td>${NOM_RAC_UNITE[14]}</td><td>${BoitePonte.arrondiTemps(TEMPS_UNITE[14] * Math.pow(0.9, tdp))}</td><td><input value='0' size='15' name='o_nombre14'/></td><td><input name='o_annee14' value='0' size='3'/></td><td><input name='o_jour14' value='0' size='3'/></td><td><input name='o_heure14' value='0' size='2'/></td><td><input name='o_minute14' value='0' size='2'/></td><td><input name='o_seconde14' value='0' size='2'/></td><td class='cursor'>${(monProfil.niveauConstruction[8] >= 28 && monProfil.niveauRecherche[9] >= 7 ? "<img id='o_lancer14' height='20' src='images/icone/fourmi.png' alt='Lancer'>" : "")}</td></tr>

                <tr><td colspan='9'>Temps de ponte : <input id='o_niveauTDP' value='${tdp}' size='3'/></td></tr>

               <tr class='o_ponte_total' style='background: rgba(0,0,0,0.04); font-weight:600;'>
  <td>Total</td>
  <td></td>
  <td></td>
  <td class='o_total_col o_total_col-a' style='text-align:right;'>
    <span id='o_total_a'>0</span> Années
  </td>
  <td class='o_total_col o_total_col-j' style='text-align:right;'>
    <span id='o_total_j'>0</span> Jours
  </td>
  <td class='o_total_col o_total_col-h' style='text-align:right;'>
    <span id='o_total_h'>00</span> Heures
  </td>
  <td class='o_total_col o_total_col-m' style='text-align:right;'>
    <span id='o_total_m'>00</span> Minutes
  </td>
  <td class='o_total_col o_total_col-s' style='text-align:right;'>
    <span id='o_total_s'>00</span> Secondes
  </td>
  <td></td>
</tr>

            </table></div>`);
    }

    _pad2(n){ return String(n).padStart(2,'0'); }
    _formatSeconds(total) {
        total = Math.max(0, Math.floor(total||0));
        const A = 365 * 86400;
        const a = Math.floor(total / A); total -= a * A;
        const j = Math.floor(total / 86400); total -= j * 86400;
        const h = Math.floor(total / 3600);  total -= h * 3600;
        const m = Math.floor(total / 60);    total -= m * 60;
        const s = total;
        return { a, j, h, m, s };
    }
    _updateGlobalTotal() {
        let sum = 0;
        $("input[name^='o_annee']").each((_, elA) => {
            const i = parseInt(elA.name.replace("o_annee",""), 10);
            const a = +($(elA).spinner("value") ?? 0);
            const j = +($(`input[name='o_jour${i}']`).spinner("value") ?? 0);
            const h = +($(`input[name='o_heure${i}']`).spinner("value") ?? 0);
            const m = +($(`input[name='o_minute${i}']`).spinner("value") ?? 0);
            const s = +($(`input[name='o_seconde${i}']`).spinner("value") ?? 0);
            sum += a*365*86400 + j*86400 + h*3600 + m*60 + s;
        });
        const { a, j, h, m, s } = this._formatSeconds(sum);
        $("#o_total_a").text(a);
        $("#o_total_j").text(j);
        $("#o_total_h").text(this._pad2(h));
        $("#o_total_m").text(this._pad2(m));
        $("#o_total_s").text(this._pad2(s));
    }

	afficher()
	{
        if(super.afficher()){
            $("input[name^='o_nombre'], input[name^='o_annee'], input[name^='o_jour']").spinner({min : 0, numberFormat: "i"});
            $("input[name^='o_heure'], input[name^='o_minute'], input[name^='o_seconde']").spinner({min : 0, numberFormat: "d2"});
            $("#o_niveauTDP").spinner({min : 0, max : 150});
            this.css().event();
            this._updateGlobalTotal();
        }
        return this;
	}

	css()
	{
        super.css();
        $("#o_ponteContent table tr:even").not('.o_ponte_total').css("background-color", monProfil.parametre["couleur2"].valeur);
        return this;
	}

	event()
	{
        super.event();

		$("input[name^='o_nombre']").on("input spin", (e, ui) => {
			let nombre = numeral(ui ? ui.value : e.currentTarget.value).value();
			this.majTemps(parseInt($(e.currentTarget).attr("name").replace("o_nombre", "")),
                          nombre * (TEMPS_UNITE[NOM_RAC_UNITE.indexOf($(e.currentTarget).closest("tr").find("td:first").text())] * Math.pow(0.9, ~~($("#o_niveauTDP").spinner("value")))));
			$(e.currentTarget).spinner("value", nombre);
            this._updateGlobalTotal();
		});

		$("input[name^='o_seconde']").on("input spin", (e, ui) => {
			let i = parseInt($(e.currentTarget).attr("name").replace("o_seconde", ""));
			let v = ui ? ui.value : $(e.currentTarget).spinner("value");
			if(v >= 60){
				$(e.currentTarget).spinner("value", v - 60);
				$(`input[name='o_minute${i}']`).spinner("stepUp");
				return false;
			}
			this.majNombre(i, -1, -1, -1, v);
            this._updateGlobalTotal();
		});

		$("input[name^='o_minute']").on("input spin", (e, ui) => {
			let i = parseInt($(e.currentTarget).attr("name").replace("o_minute", ""));
			let v = ui ? ui.value : $(e.currentTarget).spinner("value");
			if(v >= 60){
				$(e.currentTarget).spinner("value", v - 60);
				$(`input[name='o_heure${i}']`).spinner("stepUp");
				return false;
			}
			this.majNombre(i, -1, -1, v, -1);
            this._updateGlobalTotal();
		});

		$("input[name^='o_heure']").on("input spin", (e, ui) => {
			let i = parseInt($(e.currentTarget).attr("name").replace("o_heure", ""));
			let v = ui ? ui.value : $(e.currentTarget).spinner("value");
			if(v >= 24){
				$(e.currentTarget).spinner("value", v - 24);
				$(`input[name='o_jour${i}']`).spinner("stepUp");
				return false;
			}
			this.majNombre(i, -1, v, -1, -1);
            this._updateGlobalTotal();
		});

		$("input[name^='o_jour']").on("input spin", (e, ui) => {
			let i = parseInt($(e.currentTarget).attr("name").replace("o_jour", ""));
			let v = ui ? ui.value : $(e.currentTarget).spinner("value");
			if(v >= 365){
				$(e.currentTarget).spinner("value", v - 365);
				$(`input[name='o_annee${i}']`).spinner("stepUp");
				return false;
			}
			this.majNombre(i, v, -1, -1, -1);
			$(e.currentTarget).spinner("value", v);
            this._updateGlobalTotal();
		});

        // >>> Correction ici : Année met à jour la colonne Nombre <<<
        $("input[name^='o_annee']").on("input spin", (e, ui) => {
            let i = parseInt($(e.currentTarget).attr("name").replace("o_annee", ""));
            let v = ui ? ui.value : $(e.currentTarget).spinner("value");
            if (v < 0) { v = 0; $(e.currentTarget).spinner("value", 0); }
            // recalcul du nombre à partir de A/J/H/M/S (majNombre lit o_annee directement)
            this.majNombre(i, -1, -1, -1, -1);
            this._updateGlobalTotal();
        });

		$("#o_niveauTDP").on("input spin", (e, ui) => {
			let tdp = ui ? ui.value : $(e.currentTarget).spinner("value");
			$("input[name^='o_nombre']").each((i, elt) => {
				let unite = parseInt($(elt).attr("name").replace("o_nombre", ""));
				$(elt).parent().parent().prev().text(BoitePonte.arrondiTemps(TEMPS_UNITE[unite] * Math.pow(0.9, tdp)));
				let nombre = $(elt).spinner("value");
				if(nombre) this.majTemps(unite, nombre * (TEMPS_UNITE[unite] * Math.pow(0.9, tdp)));
			});
            this._updateGlobalTotal();
		});

		$("img[id^=o_lancer]").click((e) => {
			let unite = ~~($(e.currentTarget).attr("id").replace("o_lancer", "")), nombre = $("input[name='o_nombre" + unite + "']").spinner("value"), securite = "";
            let correspondanceFzzz = new Array("", 1, 2, 3, 4, 5, 6, -1, 7, 8, 9, 10, -1, 11, 12);
			if(nombre){
                $.ajax({url : "http://" + Utils.serveur + ".fourmizzz.fr/Reine.php"}).then((data) => {
                    let parsed = $("<div/>").append(data);
                    securite = parsed.find("#t").attr("name") + "=" + parsed.find("#t").attr("value");
                    let donnees = {};
                    donnees["destination"] = 3;
                    donnees["unePonte"] = "oui";
                    donnees["typeUnite"] = (unite ? "unite" + correspondanceFzzz[unite] : "ouvriere");
                    donnees["input_cout_nombre" + (unite ? correspondanceFzzz[unite] : "")] = nombre;
                    donnees["nombre_de_ponte"] = nombre;
                    donnees["" + securite.split("=")[0]] = securite.split("=")[1];
                    $.post("http://" + Utils.serveur + ".fourmizzz.fr/Reine.php", donnees, (data) => {
                        let parsed = $('<div/>').append(data);
                        $("#boiteInfo").fadeOut("slow").html(parsed.find("#boiteInfo").html()).fadeIn("slow");
                        if(Utils.comptePlus)
                            $("#boiteComptePlus").fadeOut("slow").html(parsed.find("#boiteComptePlus").html()).fadeIn("slow");
                        $.toast({...TOAST_SUCCESS, text : "La ponte a été correctement lancée."});
                        $("input[name='o_nombre" + unite + "']").spinner("value", 0);
                        this._updateGlobalTotal();
                    });
                });
			}
            return false;
		});
        return this;
	}

	majNombre(unite, jour, heure, minute, seconde)
	{
        let nbAnnee  = $("input[name='o_annee"  + unite + "']").spinner("value") || 0;
        let nbJour   = (jour   < 0) ? $("input[name='o_jour"   + unite + "']").spinner("value") : jour;
		let nbHeure  = (heure  < 0) ? $("input[name='o_heure"  + unite + "']").spinner("value") : heure;
		let nbMinute = (minute < 0) ? $("input[name='o_minute" + unite + "']").spinner("value") : minute;
		let nbSeconde= (seconde< 0) ? $("input[name='o_seconde"+ unite + "']").spinner("value") : seconde;

		let temps = (nbAnnee*365 + nbJour) * 86400 + nbHeure * 3600 + nbMinute * 60 + nbSeconde;
		$("input[name='o_nombre" + unite + "']").spinner("value",
            Math.round(temps / (TEMPS_UNITE[unite] * Math.pow(0.9, ~~($("#o_niveauTDP").val())))));
        return this;
    }

	majTemps(i, temps)
	{
        const A = 365*86400;
        $("input[name='o_annee" + i + "']").spinner("value", Math.floor(temps / A));
        temps %= A;

		$("input[name='o_jour"  + i + "']").spinner("value", (temps - temps % 86400) / 86400);
		temps %= 86400;

		$("input[name='o_heure" + i + "']").spinner("value", (temps - temps % 3600) / 3600);
		temps %= 3600;

		$("input[name='o_minute"+ i + "']").spinner("value", (temps - temps % 60) / 60);
		temps = Math.round(temps % 60);

		$("input[name='o_seconde"+ i + "']").spinner("value", temps);
        return this;
	}

    static arrondiTemps(temps)
    {
        if(temps < 0.05) return temps.toPrecision(3);
        if(temps < 1)    return temps.toPrecision(2);
        if(temps < 10)   return temps.toPrecision(3);
        return Math.round(temps);
    }
}
