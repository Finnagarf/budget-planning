// storage.js: autosave, JSON/CSV export + import, PDF/PNG export.
// Load AFTER app.js. It reuses app.js globals ($, config, addRow, CURRENCIES,
// activeCurrency, applyCurrencyIcons, updateOverview) and needs no edits to app.js.
(() => {
  const STORAGE_KEY = 'budgetPlanner.v1';
  const TYPES = ['income', 'expenses', 'debts', 'savings', 'investments'];
  const SETTING_KEYS = [
    'currency', 'balance', 'raise', 'inflation',
    'realDollars', 'view', 'years', 'subtractGoals',
  ];
  const CSV_HEADER = ['type', 'name', 'amount', 'percent', 'contribution', 'date'];

  let resetting = false;

  function setStatus(message) {
    const el = $('saveStatus');
    if (el) el.textContent = message;
  }

  // ---------- read / write the whole app state ----------
  function collectState() {
    const readRows = (type) =>
      Array.from($(config[type].containerId).querySelectorAll('.entry-row')).map((row) => ({
        name: row.querySelector('.entry-name').value,
        amount: row.querySelector('.entry-amount').value,
        percent: row.querySelector('.entry-percent')?.value ?? '',
        contribution: row.querySelector('.entry-contribution')?.value ?? '',
        date: row.querySelector('.entry-date')?.value ?? '',
      }));

    return {
      version: 1,
      currency: $('currencySelect').value,
      balance: $('balance').value,
      raise: $('raiseRate').value,
      inflation: $('inflationRate').value,
      realDollars: $('realDollars').checked,
      view: $('projectionView').value,
      years: $('projectionYears').value,
      subtractGoals: $('subtractGoals').checked,
      income: readRows('income'),
      expenses: readRows('expenses'),
      savings: readRows('savings'),
      investments: readRows('investments'),
    };
  }

  function applyState(s) {
    // validate before touching the page so a bad file can't wipe your data
    if (!s || typeof s !== 'object' || !TYPES.some((t) => Array.isArray(s[t]))) {
      throw new Error('Not a budget file');
    }

    // currency first, so new rows get the right icon
    if (CURRENCIES[s.currency]) {
      activeCurrency = CURRENCIES[s.currency];
      $('currencySelect').value = s.currency;
    }

    TYPES.forEach((type) => {
      $(config[type].containerId).innerHTML = '';
      (Array.isArray(s[type]) ? s[type] : []).forEach((r) => addRow(type, r || {}));
    });

    const isTrue = (v) => v === true || v === 'true';
    $('balance').value = s.balance ?? '';
    $('raiseRate').value = s.raise ?? '';
    $('inflationRate').value = s.inflation ?? '';
    $('realDollars').checked = isTrue(s.realDollars);
    $('subtractGoals').checked = isTrue(s.subtractGoals);
    $('projectionView').value = ['overall', 'investments', 'savings'].includes(s.view)
      ? s.view
      : 'overall';
    $('projectionYears').value = ['1', '5', '10'].includes(String(s.years))
      ? String(s.years)
      : '1';

    applyCurrencyIcons();
    updateOverview();
  }

  // ---------- autosave ----------
  function saveNow() {
    if (resetting) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collectState()));
      setStatus('All changes saved');
    } catch (err) {
      setStatus('Could not save (browser storage unavailable)');
    }
  }

  let saveTimer;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 300);
  }

  // inputs, selects, checkboxes, add/delete buttons all bubble to the document
  ['input', 'change', 'click'].forEach((evt) => document.addEventListener(evt, scheduleSave));
  window.addEventListener('beforeunload', saveNow);

  // ---------- download helper ----------
  function download(filename, content, type) {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const stamp = () => new Date().toISOString().slice(0, 10);

  // ---------- JSON ----------
  function exportJson() {
    download(
      `budget-planner-${stamp()}.json`,
      JSON.stringify(collectState(), null, 2),
      'application/json',
    );
    setStatus('Exported JSON');
  }

  // ---------- CSV ----------
  const csvCell = (v) => {
    const s = String(v ?? '');
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  function stateToCsv(s) {
    const lines = [CSV_HEADER.join(',')];
    // settings go in as rows: type=setting, name=key, amount=value
    SETTING_KEYS.forEach((k) => lines.push(['setting', k, s[k]].map(csvCell).join(',')));
    TYPES.forEach((type) => {
      s[type].forEach((r) =>
        lines.push(
          [type, r.name, r.amount, r.percent, r.contribution, r.date].map(csvCell).join(','),
        ),
      );
    });
    return '\uFEFF' + lines.join('\r\n'); // BOM so Excel reads symbols correctly
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            cell += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cell += c;
        }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(cell);
        cell = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += c;
      }
    }
    if (cell !== '' || row.length) {
      row.push(cell);
      rows.push(row);
    }
    return rows.filter((r) => r.some((c) => c !== ''));
  }

  function csvToState(text) {
    const rows = parseCsv(text.replace(/^\uFEFF/, ''));
    const s = { income: [], expenses: [], savings: [], investments: [] };
    rows.slice(1).forEach(([type, name = '', amount = '', percent = '', contribution = '', date = '']) => {
      if (type === 'setting') {
        if (SETTING_KEYS.includes(name)) s[name] = amount;
      } else if (TYPES.includes(type)) {
        s[type].push({ name, amount, percent, contribution, date });
      }
    });
    return s;
  }

  function exportCsv() {
    download(`budget-planner-${stamp()}.csv`, stateToCsv(collectState()), 'text/csv;charset=utf-8');
    setStatus('Exported CSV');
  }

  // ---------- import ----------
  async function importFile(file) {
    try {
      const text = await file.text();
      const state = file.name.toLowerCase().endsWith('.csv') ? csvToState(text) : JSON.parse(text);
      applyState(state);
      saveNow();
      setStatus(`Imported ${file.name}`);
    } catch (err) {
      console.error(err);
      alert('Could not import that file. Use a JSON or CSV file exported from this app.');
    }
  }

  // ---------- PDF / image ----------
  async function captureBudget() {
    if (typeof html2canvas === 'undefined') {
      throw new Error('html2canvas did not load');
    }
    setStatus('Preparing export...');
    return html2canvas(document.querySelector('.budget-calculator'), {
      scale: 2,
      backgroundColor: getComputedStyle(document.body).backgroundColor,
      useCORS: true,
    });
  }

  async function exportImage() {
    try {
      const canvas = await captureBudget();
      canvas.toBlob((blob) => {
        download(`budget-planner-${stamp()}.png`, blob);
        setStatus('Exported image');
      }, 'image/png');
    } catch (err) {
      console.error(err);
      setStatus('Image export failed (see console)');
    }
  }

  async function exportPdf() {
    try {
      const canvas = await captureBudget();
      if (!window.jspdf) throw new Error('jsPDF did not load');
      const { jsPDF } = window.jspdf;

      // one tall page sized to the content, so nothing gets cut across pages
      const w = canvas.width / 2;
      const h = canvas.height / 2;
      const pdf = new jsPDF({
        orientation: w > h ? 'l' : 'p',
        unit: 'px',
        format: [w, h],
        hotfixes: ['px_scaling'],
      });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h);
      pdf.save(`budget-planner-${stamp()}.pdf`);
      setStatus('Exported PDF');
    } catch (err) {
      console.error(err);
      setStatus('PDF export failed (see console)');
    }
  }

  // ---------- reset ----------
  function resetAll() {
    if (!confirm('Reset everything to the default budget? Your saved data will be erased.')) return;
    resetting = true;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      /* ignore */
    }
    location.reload();
  }

  // ---------- wire up buttons ----------
  $('exportJson').addEventListener('click', exportJson);
  $('exportCsv').addEventListener('click', exportCsv);
  $('exportPdf').addEventListener('click', exportPdf);
  $('exportImage').addEventListener('click', exportImage);
  $('resetData').addEventListener('click', resetAll);
  $('importButton').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) importFile(file);
    e.target.value = ''; // lets you re-import the same file later
  });

  // ---------- load saved data on startup ----------
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      applyState(JSON.parse(raw));
      setStatus('Loaded your saved budget');
    }
  } catch (err) {
    console.warn('Could not load saved budget:', err);
  }
})();