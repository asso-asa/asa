/* =============================================================================
   ASA — Modale temporaire « Campagne de recrutement de bénévoles »
   -----------------------------------------------------------------------------
   Fichier autonome : il injecte lui-même son HTML et son CSS.
   Aucune modification de tes pages en dehors d'UNE ligne avant </body> :

       <script src="/campagne-benevolat.js" defer></script>

   La campagne s'éteint toute seule après DATE_FIN : le script sort
   immédiatement et ne fait plus rien. Inutile de rééditer les pages.
   ============================================================================= */

(function () {
  'use strict';

  /* ==========================================================================
     1. RÉGLAGES — c'est la seule partie que tu as à modifier
     ========================================================================== */

  var REGLAGES = {

    // Fenêtre de campagne (format AAAA-MM-JJ). Hors de cette période : rien.
    dateDebut: '2026-10-19',
    dateFin:   '2026-12-15',

    // Destination du bouton principal. À REMPLACER par l'URL réelle.
    urlCible: '/nous-rejoindre/',

    // Déclenchement : nombre de pages vues dans la visite avant l'affichage.
    // 1 = dès la première page (choix actuel).
    // 2 = jamais sur la page d'atterrissage, ce qui évite la pénalité
    //     « interstitiel intrusif » de Google sur mobile.
    pagesAvantAffichage: 1,

    // Délai en millisecondes après le chargement, pour laisser la page se poser.
    delaiMs: 1200,

    // Délai avant de représenter la modale à quelqu'un qui l'a déjà vue.
    // 30 = elle revient au bout d'une demi-heure. 0 = plus jamais.
    minutesAvantRelance: 30,

    // Pages où la modale ne doit JAMAIS s'afficher (début d'URL, sensible à la casse).
    // On n'interrompt pas quelqu'un en train de remplir un formulaire.
    cheminsExclus: [
      '/adhesion',
      '/contact',
      '/attestation',
      '/confirmation',
      '/nous-rejoindre',        // inutile d'inviter sur la page d'invitation
      '/mentions-legales',
      '/politique-de-confidentialite'
    ],

    // Bandeau cookies : clé localStorage dans laquelle ton bandeau enregistre
    // le choix du visiteur. Tant que cette clé est absente, la modale attend.
    // Mets null si tu n'as pas encore de bandeau (la modale s'affichera alors
    // sans attendre — à corriger dès que le bandeau sera en ligne).
    cleConsentementCookies: null,   // exemple : 'asa_cookies_choix'

    // Clés de stockage propres à la campagne (ne pas changer en cours de route,
    // sinon les visiteurs qui ont déjà fermé la modale la reverront).
    cleVu:       'asa_campagne_benevolat_vu',
    cleCompteur: 'asa_campagne_benevolat_pages'
  };

  /* Contenu affiché. Texte court : la modale invite, elle n'explique pas. */
  var CONTENU = {
    surtitre:  'Campagne de recrutement',
    titre:     'Votre bureau recrute !',
    texte:     'L\'Association des Sénégalais d\'Amiens a besoin de vos talents. ' +
               'Événements, communication, logistique : quelques heures par mois suffisent pour faire vivre notre communauté.',
    boutonOui: 'Découvrir les postes libres',
    boutonNon: 'Plus tard',
    fermer:    'Fermer cette fenêtre'
  };

  /* ==========================================================================
     2. GARDE-FOUS — on sort le plus tôt possible
     ========================================================================== */

  // Outils de test, par l'URL :
  //   ?sanspop   désactive la modale sur cette page
  //   ?popforce  affiche la modale quoi qu'il arrive (ignore tous les contrôles)
  //   ?popdebug  n'affiche rien de plus, mais explique dans la console (F12)
  //              pourquoi la modale ne s'est pas affichée
  var requete  = window.location.search;
  var force    = requete.indexOf('popforce') !== -1;
  var diagnostic = requete.indexOf('popdebug') !== -1 || force;

  function renoncer(raison) {
    if (diagnostic) { console.log('[campagne bénévolat] pas d\'affichage : ' + raison); }
  }

  if (requete.indexOf('sanspop') !== -1) { return; }

  // Hors période de campagne.
  var maintenant = new Date();
  if (!force && (maintenant < new Date(REGLAGES.dateDebut + 'T00:00:00') ||
                 maintenant > new Date(REGLAGES.dateFin   + 'T23:59:59'))) {
    renoncer('hors période de campagne (' + REGLAGES.dateDebut + ' → ' + REGLAGES.dateFin + ')');
    return;
  }

  // Page exclue.
  var chemin = window.location.pathname;
  for (var i = 0; i < REGLAGES.cheminsExclus.length; i++) {
    if (!force && chemin.indexOf(REGLAGES.cheminsExclus[i]) === 0) {
      renoncer('page exclue par le réglage « ' + REGLAGES.cheminsExclus[i] + ' »');
      return;
    }
  }

  // Navigateur trop ancien pour <dialog> : on renonce plutôt que de bricoler
  // une modale inaccessible au clavier.
  if (typeof window.HTMLDialogElement === 'undefined') { return; }

  /* ==========================================================================
     3. STOCKAGE — toujours protégé : navigation privée peut tout refuser
     ========================================================================== */

  function lire(stockage, cle) {
    try { return stockage.getItem(cle); } catch (e) { return null; }
  }
  function ecrire(stockage, cle, valeur) {
    try { stockage.setItem(cle, valeur); } catch (e) { /* on ignore */ }
  }

  // Déjà vue récemment ?
  var horodatageVu = parseInt(lire(window.localStorage, REGLAGES.cleVu) || '0', 10);
  if (horodatageVu && !force) {
    if (REGLAGES.minutesAvantRelance === 0) {
      renoncer('déjà vue, et la relance est désactivée');
      return;
    }
    var minutesEcoulees = (Date.now() - horodatageVu) / 60000;
    if (minutesEcoulees < REGLAGES.minutesAvantRelance) {
      renoncer('déjà vue il y a ' + Math.round(minutesEcoulees) + ' min ; relance après ' +
               REGLAGES.minutesAvantRelance + ' min');
      return;
    }
  }

  // Compteur de pages vues dans la visite en cours (sessionStorage : remis à
  // zéro à la fermeture de l'onglet).
  var pagesVues = parseInt(lire(window.sessionStorage, REGLAGES.cleCompteur) || '0', 10) + 1;
  ecrire(window.sessionStorage, REGLAGES.cleCompteur, String(pagesVues));
  if (!force && pagesVues < REGLAGES.pagesAvantAffichage) {
    renoncer('page ' + pagesVues + ' de la visite ; affichage prévu à la page ' +
             REGLAGES.pagesAvantAffichage);
    return;
  }

  // Bandeau cookies : on attend que le visiteur ait tranché.
  if (!force && REGLAGES.cleConsentementCookies &&
      !lire(window.localStorage, REGLAGES.cleConsentementCookies)) {
    renoncer('choix cookies pas encore enregistré (clé « ' +
             REGLAGES.cleConsentementCookies + ' »)');
    return;
  }

  /* ==========================================================================
     4. STYLES — injectés une seule fois, préfixés pour ne rien casser
     ========================================================================== */

  var CSS = [
    '.asa-pop{border:0;padding:0;max-width:34rem;width:calc(100% - 2rem);',
    '  background:#fff;color:#1b1b1b;border-radius:4px;',
    '  box-shadow:0 1.5rem 3rem rgba(4,59,34,.25);overflow:hidden}',
    '.asa-pop::backdrop{background:rgba(4,59,34,.55)}',

    /* Bande aux trois couleurs du drapeau : seul élément décoratif. */
    '.asa-pop__bande{height:6px;display:flex}',
    '.asa-pop__bande i{flex:1}',
    '.asa-pop__bande i:nth-child(1){background:#00853F}',
    '.asa-pop__bande i:nth-child(2){background:#FDEF42}',
    '.asa-pop__bande i:nth-child(3){background:#E31B23}',

    '.asa-pop__corps{padding:2rem 2rem 1.75rem}',
    '.asa-pop__surtitre{margin:0 0 .5rem;font-family:Karla,system-ui,sans-serif;',
    '  font-size:.8125rem;font-weight:700;letter-spacing:.02em;color:#00853F}',
    '.asa-pop__titre{margin:0 0 .75rem;font-family:"Bricolage Grotesque",Georgia,serif;',
    '  font-weight:800;font-size:1.6rem;line-height:1.15;color:#043B22}',
    '.asa-pop__texte{margin:0 0 1.5rem;font-family:Karla,system-ui,sans-serif;',
    '  font-size:1rem;line-height:1.55;max-width:38ch}',

    '.asa-pop__actions{display:flex;flex-wrap:wrap;gap:.75rem;align-items:center}',
    '.asa-pop__oui,.asa-pop__non{font-family:Karla,system-ui,sans-serif;font-size:1rem;',
    '  border-radius:3px;cursor:pointer;text-decoration:none;display:inline-block}',
    '.asa-pop__oui{background:#00853F;color:#fff;font-weight:700;padding:.75rem 1.5rem;border:2px solid #00853F}',
    '.asa-pop__oui:hover{background:#043B22;border-color:#043B22;color:#fff}',
    '.asa-pop__non{background:none;border:0;color:#4a4a4a;padding:.75rem .5rem;text-decoration:underline}',
    '.asa-pop__non:hover{color:#1b1b1b}',
    '.asa-pop :focus-visible{outline:3px solid #E31B23;outline-offset:2px}',

    /* Croix de fermeture : 44px de cible tactile. */
    '.asa-pop__croix{position:absolute;top:.75rem;right:.75rem;width:44px;height:44px;',
    '  border:0;background:none;cursor:pointer;font-size:1.5rem;line-height:1;color:#555}',
    '.asa-pop__croix:hover{color:#000}',
    '.asa-pop__enveloppe{position:relative}',

    '@media (max-width:480px){.asa-pop__corps{padding:1.5rem 1.25rem}',
    '  .asa-pop__titre{font-size:1.35rem}',
    '  .asa-pop__oui,.asa-pop__non{width:100%;text-align:center}}',

    /* Animation d'ouverture, supprimée si le visiteur l'a demandé. */
    '@media (prefers-reduced-motion:no-preference){',
    '  .asa-pop[open]{animation:asaPopIn .25s ease-out}',
    '  @keyframes asaPopIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}}'
  ].join('');

  /* ==========================================================================
     5. CONSTRUCTION ET AFFICHAGE
     ========================================================================== */

  function construire() {
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var dlg = document.createElement('dialog');
    dlg.className = 'asa-pop';
    dlg.setAttribute('aria-labelledby', 'asa-pop-titre');

    dlg.innerHTML =
      '<div class="asa-pop__bande" aria-hidden="true"><i></i><i></i><i></i></div>' +
      '<div class="asa-pop__enveloppe">' +
        '<button type="button" class="asa-pop__croix" aria-label="' + CONTENU.fermer + '">&times;</button>' +
        '<div class="asa-pop__corps">' +
          '<p class="asa-pop__surtitre">' + CONTENU.surtitre + '</p>' +
          '<h2 class="asa-pop__titre" id="asa-pop-titre">' + CONTENU.titre + '</h2>' +
          '<p class="asa-pop__texte">' + CONTENU.texte + '</p>' +
          '<div class="asa-pop__actions">' +
            '<a class="asa-pop__oui" href="' + REGLAGES.urlCible + '">' + CONTENU.boutonOui + '</a>' +
            '<button type="button" class="asa-pop__non">' + CONTENU.boutonNon + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(dlg);

    dlg.querySelector('.asa-pop__croix').addEventListener('click', function () { dlg.close(); });
    dlg.querySelector('.asa-pop__non').addEventListener('click', function () { dlg.close(); });

    // Le clic sur le fond (l'élément <dialog> lui-même) ferme la modale.
    dlg.addEventListener('click', function (ev) {
      if (ev.target === dlg) { dlg.close(); }
    });

    dlg.showModal();

    // La trace est posée dès l'affichage, pas à la fermeture : un visiteur qui
    // ignore la modale et navigue ailleurs ne doit pas la revoir sur chaque page.
    ecrire(window.localStorage, REGLAGES.cleVu, String(Date.now()));
    if (diagnostic) { console.log('[campagne bénévolat] modale affichée'); }
  }

  function demarrer() { window.setTimeout(construire, REGLAGES.delaiMs); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', demarrer);
  } else {
    demarrer();
  }

})();