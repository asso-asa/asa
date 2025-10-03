document.addEventListener("DOMContentLoaded", function() {
  const toc = document.getElementById("toc");
  const headings = document.querySelectorAll("main h2, main h3, main h4");
  const ul = document.createElement("ul");

  headings.forEach(h => {
    // Générer un id si absent
    let id = h.id;
    if (!id) {
      id = h.textContent.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]/g, "");
      h.id = id;
    }

    // Créer l’entrée du sommaire
    const li = document.createElement("li");
    li.classList.add("toc-" + h.tagName.toLowerCase());
    li.innerHTML = `<a href="#${id}">${h.textContent}</a>`;
    ul.appendChild(li);
  });

  toc.appendChild(ul);
});
