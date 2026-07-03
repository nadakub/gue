const QUESTIONS = Array.isArray(window.QUESTIONS) ? window.QUESTIONS : [];

const $ = (id) => document.getElementById(id);
const input = $("searchInput");
const results = $("results");
const suggestions = $("suggestions");
const totalCount = $("totalCount");
const resultCount = $("resultCount");
const clearBtn = $("clearBtn");

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function searchableText(q) {
  return normalizeText([
    q.id,
    q.nr,
    q.category,
    q.question,
    q.correct,
    q.correctText,
    ...(q.answers || []).map(a => `${a.key} ${a.text}`)
  ].join(" "));
}

const DATA = QUESTIONS.map(q => ({ ...q, _search: searchableText(q) }));

totalCount.textContent = `${DATA.length} intrebari`;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#039;", '"':"&quot;"
  }[ch]));
}

function updateSuggestions(matches) {
  suggestions.innerHTML = "";
  matches.slice(0, 20).forEach(q => {
    const option = document.createElement("option");
    option.value = q.question.length > 95 ? q.question.slice(0, 95) + "..." : q.question;
    suggestions.appendChild(option);
  });
}

function render(matches, query) {
  resultCount.textContent = `${matches.length} rezultate`;
  updateSuggestions(matches);

  if (!query) {
    results.innerHTML = `<div class="empty">Scrie in caseta de cautare pentru a vedea intrebarile.</div>`;
    return;
  }

  if (!matches.length) {
    results.innerHTML = `<div class="empty">Nu am gasit rezultate pentru: <b>${escapeHtml(query)}</b></div>`;
    return;
  }

  results.innerHTML = matches.map(q => {
    const answers = (q.answers || []).map(a => {
      const isCorrect = a.key === q.correct;
      return `<div class="answer ${isCorrect ? "correct" : ""}"><b>${escapeHtml(a.key)}.</b> ${escapeHtml(a.text)}${isCorrect ? " ✅" : ""}</div>`;
    }).join("");

    return `<article class="question-card">
      <div class="q-top">
        <span class="badge blue">${escapeHtml(q.category)}</span>
        <span class="badge">Nr. ${escapeHtml(q.nr)}</span>
        <span class="badge">ID: ${escapeHtml(q.id)}</span>
      </div>
      <p class="question">${escapeHtml(q.question)}</p>
      <div class="answers">${answers}</div>
      <div class="correct-line">Raspuns corect: ${escapeHtml(q.correct)} — ${escapeHtml(q.correctText)}</div>
    </article>`;
  }).join("");
}

function search() {
  const raw = input.value.trim();
  const q = normalizeText(raw);

  if (!q) {
    render([], "");
    return;
  }

  const tokens = q.split(/\s+/).filter(Boolean);
  const matches = DATA.filter(item => tokens.every(t => item._search.includes(t)));
  render(matches, raw);
}

input.addEventListener("input", search);
clearBtn.addEventListener("click", () => {
  input.value = "";
  input.focus();
  search();
});

render([], "");
