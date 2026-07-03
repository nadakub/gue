const QUESTIONS = window.QUESTIONS || [];

const $ = (id) => document.getElementById(id);
const normalize = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[ăâîșşțţ]/gi, (c) => ({
    'ă':'a','â':'a','î':'i','ș':'s','ş':'s','ț':'t','ţ':'t',
    'Ă':'A','Â':'A','Î':'I','Ș':'S','Ş':'S','Ț':'T','Ţ':'T'
  }[c] || c))
  .toLowerCase();

let selectedId = null;

function init() {
  $('totalBadge').textContent = `${QUESTIONS.length} intrebari`;
  const categories = [...new Set(QUESTIONS.map(q => q.category))].sort();
  $('categoryFilter').innerHTML += categories.map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('');

  $('searchInput').addEventListener('input', renderResults);
  $('categoryFilter').addEventListener('change', renderResults);
  $('correctFilter').addEventListener('change', renderResults);
  $('clearBtn').addEventListener('click', () => {
    $('searchInput').value = '';
    $('categoryFilter').value = '';
    $('correctFilter').value = '';
    renderResults();
    $('searchInput').focus();
  });

  renderResults();
}

function getFilteredQuestions() {
  const query = normalize($('searchInput').value.trim());
  const category = $('categoryFilter').value;
  const correct = $('correctFilter').value;

  return QUESTIONS.filter(q => {
    const matchQuery = !query || q.searchText.includes(query);
    const matchCategory = !category || q.category === category;
    const matchCorrect = !correct || q.correct === correct;
    return matchQuery && matchCategory && matchCorrect;
  });
}

function renderResults() {
  const filtered = getFilteredQuestions();
  $('resultCount').textContent = `${filtered.length} rezultate`;

  const limited = filtered.slice(0, 200);
  $('results').innerHTML = limited.map(q => `
    <button class="resultItem ${q.id === selectedId ? 'active' : ''}" onclick="selectQuestion('${escapeForJs(q.id)}')">
      <div class="resultTitle">${escapeHtml(q.question)}</div>
      <div class="resultMeta">
        <span>${escapeHtml(q.category)}</span>
        <span>Nr. ${q.nr}</span>
        <span>Corect: ${q.correct}</span>
      </div>
    </button>
  `).join('');

  if (filtered.length > 200) {
    $('results').innerHTML += `<div class="resultItem">Sunt afisate primele 200 rezultate. Restrange cautarea pentru mai multa precizie.</div>`;
  }

  if (!selectedId && filtered[0]) selectQuestion(filtered[0].id, false);
}

function selectQuestion(id, rerender = true) {
  selectedId = id;
  const q = QUESTIONS.find(item => item.id === id);
  if (!q) return;

  $('emptyState').classList.add('hidden');
  $('details').classList.remove('hidden');
  $('detailCategory').textContent = q.category;
  $('detailNr').textContent = `Nr. ${q.nr} / ${q.id}`;
  $('detailQuestion').textContent = q.question;

  $('answerList').innerHTML = q.answers.map(a => `
    <div class="answer ${a.key === q.correct ? 'correct' : ''}">
      <strong>${a.key}.</strong> ${escapeHtml(a.text)}${a.key === q.correct ? ' ✅' : ''}
    </div>
  `).join('');

  $('correctAnswer').textContent = `${q.correct} - ${q.correctText}`;
  if (rerender) renderResults();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

function escapeForJs(value) {
  return String(value ?? '').replace(/\/g, '\\').replace(/'/g, "\'");
}

init();
