/* =============================================================================
   ASA — Script commun, chargé par toutes les pages
   ============================================================================= */

document.addEventListener("DOMContentLoaded", function() {
  const toc = document.getElementById("toc");

  // Sans conteneur #toc, il n'y a pas de sommaire à construire. Sans cette
  // garde, la fin de la fonction lève une erreur sur toutes les pages qui n'en
  // ont pas, ce qui interrompt le reste du bloc.
  if (!toc) { return; }

  const headings = document.querySelectorAll("main h2, main h3, main h4");
  const ul = document.createElement("ul");

  headings.forEach(h => {
    // Générer un id si absent
    let id = h.id;
    if (!id) {
      id = h.textContent.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]/g, "");
      h.id = id;
    }

    // Créer l'entrée du sommaire
    const li = document.createElement("li");
    li.classList.add("toc-" + h.tagName.toLowerCase());
    li.innerHTML = `<a href="#${id}">${h.textContent}</a>`;
    ul.appendChild(li);
  });

  toc.appendChild(ul);
});


/* -----------------------------------------------------------------------------
   CAMPAGNE TEMPORAIRE — recrutement de bénévoles (automne 2026)
   Charge /campagne-benevolat.js, qui gère lui-même ses dates, ses exclusions
   de pages et sa fréquence d'affichage.
   À la fin de la campagne : supprimer ces quelques lignes et le fichier.
   ----------------------------------------------------------------------------- */
(function () {
  var s = document.createElement('script');
  s.src = '/campagne-benevolat.js';
  s.defer = true;
  document.head.appendChild(s);
})();