import { el, ltr, formatDate } from './format.js';
import { mockRepository as repo } from './repository.js';
import { setAsOf } from './shell.js';
import { getInterests, setInterests } from './profile-store.js';
import { alertCalls } from './calls-logic.js';

await setAsOf();
const [areas, calls] = await Promise.all([repo.getCallAreas(), repo.listCalls()]);
let selected = getInterests();

const box = document.getElementById('areas');
const saved = document.getElementById('saved');
const alerts = document.getElementById('alerts');

function renderAlerts() {
  const list = alertCalls(calls, selected);
  alerts.replaceChildren(...(list.length
    ? list.map(c => el('li', {}, el('strong', { text: 'התראה: ' }), `קול קורא בתחום ${c.areas.filter(a => selected.includes(a)).join(', ')} – ${c.title}, הגשה עד `, ltr(formatDate(c.deadline))))
    : [el('li', { class: 'muted', text: 'בחר/י תחום כדי לקבל התראות.' })]));
}

for (const a of areas) {
  const input = el('input', { type: 'checkbox', value: a });
  input.checked = selected.includes(a);
  input.addEventListener('change', () => {
    selected = areas.filter(x => box.querySelector(`input[value="${x}"]`).checked);
    setInterests(selected);
    saved.textContent = 'נשמר בדפדפן (הדגמה).';
    renderAlerts();
  });
  box.append(el('label', { class: 'chip-check' }, input, ' ', a));
}
renderAlerts();
