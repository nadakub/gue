(function(){
  "use strict";

  const $ = (id) => document.getElementById(id);
  const input = $("searchInput");
  const clearBtn = $("clearBtn");
  const resultsEl = $("results");
  const statusEl = $("statusText");
  const totalEl = $("totalCount");
  const suggestionsEl = $("suggestions");

  function normalize(value){
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ă/g,"a").replace(/â/g,"a").replace(/î/g,"i").replace(/ș/g,"s").replace(/ş/g,"s").replace(/ț/g,"t").replace(/ţ/g,"t")
      .replace(/Ă/g,"A").replace(/Â/g,"A").replace(/Î/g,"I").replace(/Ș/g,"S").replace(/Ş/g,"S").replace(/Ț/g,"T").replace(/Ţ/g,"T")
      .toLowerCase()
      .trim();
  }

  function escapeHtml(value){
    return String(value || "").replace(/[&<>"']/g, (m) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
  }

  function buildSearchText(q){
    const answerText = Array.isArray(q.answers) ? q.answers.map(a => `${a.key} ${a.text}`).join(" ") : "";
    return normalize(`${q.id || ""} ${q.nr || ""} ${q.category || ""} ${q.question || ""} ${q.correct || ""} ${q.correctText || ""} ${answerText}`);
  }

  function prepareData(){
    if(!Array.isArray(window.QUESTIONS)){
      totalEl.textContent = "0 intrebari";
      resultsEl.innerHTML = `<div class="error"><b>Eroare:</b> fisierul data.js nu a incarcat corect lista window.QUESTIONS. Verifica daca data.js incepe cu <code>window.QUESTIONS = [</code>.</div>`;
      return [];
    }
    return window.QUESTIONS.map((q, idx) => ({...q, _idx: idx, _search: buildSearchText(q)}));
  }

  const QUESTIONS = prepareData();
  totalEl.textContent = `${QUESTIONS.length} intrebari`;

  function buildSuggestions(){
    if(!QUESTIONS.length) return;
    const seen = new Set();
    const opts = [];
    for(const q of QUESTIONS){
      const base = `${q.nr}. ${q.question}`.slice(0, 140);
      const key = normalize(base);
      if(!seen.has(key)){
        seen.add(key);
        opts.push(`<option value="${escapeHtml(base)}"></option>`);
      }
      if(opts.length >= 120) break;
    }
    suggestionsEl.innerHTML = opts.join("");
  }

  function highlight(text, rawTerm){
    const term = normalize(rawTerm);
    const safe = escapeHtml(text);
    if(!term || term.length < 2) return safe;
    // Highlight simplu doar cand textul original contine termenul fara normalizare completa.
    const plainTerm = escapeHtml(rawTerm.trim());
    if(!plainTerm) return safe;
    try{
      const re = new RegExp(`(${plainTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
      return safe.replace(re, `<span class="highlight">$1</span>`);
    }catch(e){ return safe; }
  }

  function renderCard(q, term){
    const answers = (Array.isArray(q.answers) ? q.answers : []).map(a => {
      const isCorrect = a.key === q.correct;
      return `<div class="answer ${isCorrect ? "correct" : ""}"><b>${escapeHtml(a.key)}.</b>${highlight(a.text, term)}${isCorrect ? " ✅" : ""}</div>`;
    }).join("");

    return `<article class="card">
      <div class="cardHead">
        <div>
          <div class="meta">
            <span class="pill">${escapeHtml(q.category)}</span>
            <span class="pill">Nr. ${escapeHtml(q.nr)}</span>
            <span class="pill good">Corect: ${escapeHtml(q.correct)}</span>
          </div>
          <div class="question">${highlight(q.question, term)}</div>
        </div>
      </div>
      <div class="answers">
        ${answers}
        <div class="correctText">Raspuns corect: ${escapeHtml(q.correct)} — ${highlight(q.correctText, term)}</div>
      </div>
    </article>`;
  }

  function search(){
    const raw = input.value || "";
    const term = normalize(raw);

    if(!QUESTIONS.length){ return; }

    if(term.length < 2){
      statusEl.textContent = "Tasteaza minim 2 caractere pentru cautare.";
      resultsEl.innerHTML = `<div class="empty">Incepe sa scrii pentru a cauta in toate intrebarile.</div>`;
      return;
    }

    const words = term.split(/\s+/).filter(Boolean);
    const found = QUESTIONS.filter(q => words.every(w => q._search.includes(w)));

    statusEl.textContent = `${found.length} rezultate pentru: "${raw}"`;

    if(!found.length){
      resultsEl.innerHTML = `<div class="empty">Nu am gasit rezultate. Incearca un cuvant mai scurt sau fara semne de punctuatie.</div>`;
      return;
    }

    resultsEl.innerHTML = found.map(q => renderCard(q, raw)).join("");
  }

  function refreshDynamicSuggestions(){
    const term = normalize(input.value);
    if(term.length < 2){ buildSuggestions(); return; }
    const matches = QUESTIONS.filter(q => q._search.includes(term)).slice(0, 40);
    suggestionsEl.innerHTML = matches.map(q => `<option value="${escapeHtml(`${q.nr}. ${q.question}`.slice(0,160))}"></option>`).join("");
  }

  input.addEventListener("input", () => { refreshDynamicSuggestions(); search(); });
  clearBtn.addEventListener("click", () => { input.value = ""; input.focus(); refreshDynamicSuggestions(); search(); });

  buildSuggestions();
  search();
})();
