// currencies: icon = Font Awesome name, symbol = text used in totals, tooltips and axes
const CURRENCIES = {
  dollar: { label: 'Dollar', icon: 'dollar-sign', symbol: '$' },
  euro: { label: 'Euro', icon: 'euro-sign', symbol: '€' },
  sterling: { label: 'Pound Sterling', icon: 'sterling-sign', symbol: '£' },
  yen: { label: 'Yen', icon: 'yen-sign', symbol: '¥' },
  won: { label: 'Won', icon: 'won-sign', symbol: '₩' },
  rupee: { label: 'Rupee', icon: 'rupee-sign', symbol: '₹' },
  rupiah: { label: 'Rupiah', icon: 'rupiah-sign', symbol: 'Rp' },
  peso: { label: 'Peso', icon: 'peso-sign', symbol: '₱' },
  naira: { label: 'Naira', icon: 'naira-sign', symbol: '₦' },
  manat: { label: 'Manat', icon: 'manat-sign', symbol: '₼' },
  turkishLira: { label: 'Turkish Lira', icon: 'turkish-lira-sign', symbol: '₺' },
  lira: { label: 'Lira', icon: 'lira-sign', symbol: '₤' },
  tenge: { label: 'Tenge', icon: 'tenge-sign', symbol: '₸' },
  shekel: { label: 'Shekel', icon: 'shekel-sign', symbol: '₪' },
  ruble: { label: 'Ruble', icon: 'ruble-sign', symbol: '₽' },
  hryvnia: { label: 'Hryvnia', icon: 'hryvnia-sign', symbol: '₴' },
  kip: { label: 'Kip', icon: 'kip-sign', symbol: '₭' },
  dong: { label: 'Dong', icon: 'dong-sign', symbol: '₫' },
  taka: { label: 'Bangladeshi Taka', icon: 'bangladeshi-taka-sign', symbol: '৳' },
  guarani: { label: 'Guarani', icon: 'guarani-sign', symbol: '₲' },
  franc: { label: 'Franc', icon: 'franc-sign', symbol: '₣' },
  mill: { label: 'Mill', icon: 'mill-sign', symbol: '₥' },
  cruzeiro: { label: 'Cruzeiro', icon: 'cruzeiro-sign', symbol: '₢' },
};

let activeCurrency = CURRENCIES.dollar;

const numberFormat = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const currency = {
  format(value) {
    const sign = value < 0 ? '-' : '';
    return `${sign}${activeCurrency.symbol}${numberFormat.format(Math.abs(value))}`;
  },
};

function formatWhole(value) {
  const sign = value < 0 ? '-' : '';
  return `${sign}${activeCurrency.symbol}${Math.round(Math.abs(value)).toLocaleString('en-US')}`;
}

function currencyIconHtml() {
  return `<i class="fa-solid fa-${activeCurrency.icon}" aria-hidden="true"></i>`;
}

function applyCurrencyIcons() {
  document.querySelectorAll('.currency-icon').forEach((el) => {
    el.innerHTML = currencyIconHtml();
  });
}

const $ = (id) => document.getElementById(id);

// budget config
const config = {
  income: {
    containerId: 'incomeContainer',
    addButtonId: 'addIncomeButton',
    namePlaceholder: 'Income source',
    amountPlaceholder: 'Amount',
    defaultRows: [{ name: 'Salary', amount: 2500 }],
  },
  savings: {
    containerId: 'savingsContainer',
    addButtonId: 'addSavingsButton',
    namePlaceholder: 'Goal',
    amountPlaceholder: 'Amount',
    defaultRows: [
      { name: 'Car', amount: 5000, date: '2026-12-23' },
      { name: 'Vacation', amount: 1500, date: '2027-08-03' },
    ],
  },
  expenses: {
    containerId: 'expensesContainer',
    addButtonId: 'addExpenseButton',
    namePlaceholder: 'Expense',
    amountPlaceholder: 'Amount',
    defaultRows: [
      { name: 'Rent', amount: 800 },
      { name: 'Utilities', amount: 200 },
      { name: 'Groceries', amount: 150 },
      { name: 'Transportation', amount: 100 },
    ],
  },
  // debt rows reuse the investment input classes: amount = balance,
  // percent = APR, contribution = monthly payment
  debts: {
    containerId: 'debtsContainer',
    addButtonId: 'addDebtButton',
    namePlaceholder: 'Debt',
    amountPlaceholder: 'Balance',
    percentPlaceholder: 'APR %',
    contributionPlaceholder: 'Payment',
    defaultRows: [],
  },
  investments: {
    containerId: 'investmentsContainer',
    addButtonId: 'addInvestmentButton',
    namePlaceholder: 'Investment',
    amountPlaceholder: 'Amount',
    percentPlaceholder: 'Return %',
    contributionPlaceholder: 'Monthly add',
    defaultRows: [{ name: 'Index Fund', amount: 1000, percent: 3.0, contribution: 100 }],
  },
};

// wraps an input with an icon at the start (currency symbol or percent sign)
function createField(input, kind, extraClass = '') {
  const wrap = document.createElement('div');
  wrap.className = `field field-${kind} ${extraClass}`.trim();

  const icon = document.createElement('span');
  if (kind === 'percent') {
    icon.className = 'field-icon';
    icon.innerHTML = '<i class="fa-solid fa-percent" aria-hidden="true"></i>';
  } else {
    icon.className = 'field-icon currency-icon';
    icon.innerHTML = currencyIconHtml();
  }

  wrap.append(icon, input);
  return wrap;
}

function createNumberInput({ className, placeholder, value, label }) {
  const input = document.createElement('input');
  input.type = 'number';
  input.placeholder = placeholder;
  input.value = value;
  input.min = '0';
  input.step = '0.01';
  input.className = className;
  if (label) {
    input.title = label;
    input.setAttribute('aria-label', label);
  }
  input.addEventListener('input', updateOverview);
  return input;
}

// create one entry row
function createRow({
  namePlaceholder,
  amountPlaceholder,
  percentPlaceholder,
  contributionPlaceholder = '',
  name = '',
  amount = '',
  percent = '',
  contribution = '',
  date = '',
  type,
}) {
  const row = document.createElement('div');
  row.className = `entry-row ${type}-row`;

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = namePlaceholder;
  nameInput.value = name;
  nameInput.className = 'entry-name';
  nameInput.addEventListener('input', updateOverview);

  const amountInput = createNumberInput({
    className: 'entry-amount',
    placeholder: amountPlaceholder,
    value: amount,
  });

  row.append(nameInput, createField(amountInput, 'amount'));

  if (type === 'investments' || type === 'debts') {
    const percentInput = createNumberInput({
      className: 'entry-percent',
      placeholder: percentPlaceholder,
      value: percent,
    });
    const contributionInput = createNumberInput({
      className: 'entry-contribution',
      placeholder: contributionPlaceholder,
      value: contribution,
      label: type === 'debts' ? 'Monthly payment' : 'Monthly contribution',
    });

    row.append(
      createField(percentInput, 'percent'),
      createField(contributionInput, 'amount', 'field-contribution'),
    );
  }

  if (type === 'savings') {
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.value = date;
    dateInput.className = 'entry-date';
    dateInput.addEventListener('input', updateOverview);
    row.append(dateInput);
  }

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'delete-btn';
  deleteButton.innerHTML =
    '<i class="fa-solid fa-rectangle-xmark" aria-hidden="true"></i><span class="sr-only">Delete row</span>';
  deleteButton.addEventListener('click', () => {
    row.remove();
    updateOverview();
  });
  row.append(deleteButton);

  return row;
}

function addRow(type, rowData = {}) {
  const section = config[type];
  $(section.containerId).appendChild(
    createRow({
      type,
      namePlaceholder: section.namePlaceholder,
      amountPlaceholder: section.amountPlaceholder,
      percentPlaceholder: section.percentPlaceholder,
      contributionPlaceholder: section.contributionPlaceholder,
      name: rowData.name,
      amount: rowData.amount,
      percent: rowData.percent,
      contribution: rowData.contribution,
      date: rowData.date,
    }),
  );
}

function getAmounts(containerId) {
  return Array.from($(containerId).querySelectorAll('.entry-amount')).map(
    (input) => Number(input.value) || 0,
  );
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

// ---------- investments ----------
function getInvestmentRows() {
  return Array.from($(config.investments.containerId).querySelectorAll('.entry-row')).map(
    (row) => ({
      amount: Number(row.querySelector('.entry-amount').value) || 0,
      percent: Number(row.querySelector('.entry-percent')?.value) || 0,
      contribution: Number(row.querySelector('.entry-contribution')?.value) || 0,
    }),
  );
}

function getMonthlyContributions() {
  return sum(getInvestmentRows().map((r) => r.contribution));
}

// total investment value at the end of each month, index 0 = today
function simulateInvestments(months) {
  const rows = getInvestmentRows();
  const balances = rows.map((r) => r.amount);
  // monthly rate chosen so 12 months of growth equals the annual rate
  const monthlyRates = rows.map((r) => Math.pow(1 + r.percent / 100, 1 / 12) - 1);

  const totals = [sum(balances)];
  for (let m = 1; m <= months; m++) {
    rows.forEach((r, i) => {
      balances[i] = balances[i] * (1 + monthlyRates[i]) + r.contribution;
    });
    totals.push(sum(balances));
  }
  return totals;
}

// value after 12 months, contributions included
function getProjectedInvestments() {
  return simulateInvestments(12)[12];
}

// ---------- debts ----------
const MAX_DEBT_MONTHS = 600; // look up to 50 years ahead for payoff dates

function getDebtRows() {
  return Array.from($(config.debts.containerId).querySelectorAll('.entry-row'))
    .map((row) => ({
      name: row.querySelector('.entry-name').value || 'Unnamed debt',
      balance: Number(row.querySelector('.entry-amount').value) || 0,
      rate: Number(row.querySelector('.entry-percent')?.value) || 0,
      payment: Number(row.querySelector('.entry-contribution')?.value) || 0,
    }))
    .filter((d) => d.balance > 0);
}

function getMonthlyDebtPayments() {
  return sum(getDebtRows().map((d) => d.payment));
}

// interest accrues monthly (APR / 12), then the payment is applied
function simulateDebts(months) {
  const debts = getDebtRows();
  const balances = debts.map((d) => d.balance);
  const payoffMonth = debts.map(() => null);
  const interestPaid = debts.map(() => 0);
  const payments = [0]; // payments[m] = total paid in month m
  const remaining = [sum(balances)]; // remaining[m] = total debt after month m

  for (let m = 1; m <= months; m++) {
    let paid = 0;
    debts.forEach((d, i) => {
      if (balances[i] <= 0) return;
      const interest = balances[i] * (d.rate / 100 / 12);
      interestPaid[i] += interest;
      const owed = balances[i] + interest;
      const pay = Math.min(d.payment, owed);
      balances[i] = owed - pay;
      paid += pay;
      if (balances[i] < 0.005) {
        balances[i] = 0;
        payoffMonth[i] = m;
      }
    });
    payments.push(paid);
    remaining.push(sum(balances));
  }
  return { debts, payoffMonth, interestPaid, payments, remaining };
}

function monthLabel(monthsFromNow) {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() + monthsFromNow, 1).toLocaleDateString(
    'en-US',
    { month: 'short', year: 'numeric' },
  );
}

function renderDebtSummary() {
  const box = $('debtSummary');
  box.innerHTML = '';

  const sim = simulateDebts(MAX_DEBT_MONTHS);
  if (!sim.debts.length) return;

  const totals = document.createElement('p');
  totals.textContent = `Total debt: ${currency.format(sum(sim.debts.map((d) => d.balance)))}, paying ${currency.format(getMonthlyDebtPayments())} / month`;
  box.appendChild(totals);

  sim.debts.forEach((d, i) => {
    const p = document.createElement('p');
    const label = document.createElement('span');
    label.textContent = `${d.name}: `;
    const status = document.createElement('span');
    const m = sim.payoffMonth[i];

    if (m !== null) {
      status.className = 'status-good';
      status.textContent = `paid off ${monthLabel(m)} (${m} mo), interest ${currency.format(sim.interestPaid[i])}`;
    } else {
      status.className = 'status-danger';
      status.textContent =
        d.payment <= 0 ? 'no payment set' : 'not paid off within 50 years at this payment';
    }
    p.append(label, status);
    box.appendChild(p);
  });

  if (sim.payoffMonth.every((m) => m !== null)) {
    const free = document.createElement('p');
    free.style.fontWeight = 'bold';
    free.textContent = `Debt-free by ${monthLabel(Math.max(...sim.payoffMonth))}`;
    box.appendChild(free);
  }
}

function getAssumptions() {
  return {
    raise: (Number($('raiseRate').value) || 0) / 100,
    inflation: (Number($('inflationRate').value) || 0) / 100,
    realDollars: $('realDollars').checked,
  };
}

// ---------- savings goals ----------
// months from today until a yyyy-mm-dd date (calendar-month difference)
function monthsUntil(dateValue) {
  const today = new Date();
  const target = new Date(dateValue + 'T00:00:00');
  return (
    (target.getFullYear() - today.getFullYear()) * 12 +
    (target.getMonth() - today.getMonth())
  );
}

function getGoals() {
  return Array.from($(config.savings.containerId).querySelectorAll('.entry-row'))
    .map((row) => {
      const dateValue = row.querySelector('.entry-date')?.value;
      return {
        name: row.querySelector('.entry-name').value || 'Unnamed Goal',
        amount: Number(row.querySelector('.entry-amount').value) || 0,
        month: dateValue ? monthsUntil(dateValue) : 0,
      };
    })
    .filter((g) => g.amount > 0 && g.month > 0);
}

function renderSavingsBreakdown(monthlySavings) {
  const container = $('savingsBreakdown');
  container.innerHTML = '';

  const rows = $(config.savings.containerId).querySelectorAll('.entry-row');
  let totalRequiredMonthly = 0;

  rows.forEach((row) => {
    const name = row.querySelector('.entry-name').value || 'Unnamed Goal';
    const amount = Number(row.querySelector('.entry-amount').value) || 0;
    const dateValue = row.querySelector('.entry-date')?.value;

    if (!dateValue || amount <= 0) return;

    const monthsRemaining = monthsUntil(dateValue);
    const p = document.createElement('p');

    if (monthsRemaining <= 0) {
      p.textContent = `${name}: date has passed or is this month`;
      container.appendChild(p);
      return;
    }

    const requiredMonthly = amount / monthsRemaining;
    totalRequiredMonthly += requiredMonthly;

    const percentOfSavings = monthlySavings > 0 ? (requiredMonthly / monthlySavings) * 100 : 0;

    let statusIcon;
    let statusClass;
    if (requiredMonthly > monthlySavings) {
      statusIcon = '<i class="fa-solid fa-circle-minus fa-sm" style="color: rgb(255, 59, 59);"></i>';
      statusClass = 'status-danger';
    } else if (percentOfSavings > 70) {
      statusIcon = '<i class="fa-solid fa-triangle-exclamation fa-sm" style="color: rgb(255, 212, 59);"></i>';
      statusClass = 'status-warning';
    } else {
      statusIcon = '<i class="fa-solid fa-circle-check fa-sm" style="color: rgb(65, 250, 94);"></i>';
      statusClass = 'status-good';
    }

    const label = document.createElement('span');
    label.textContent = `${name}: `;
    const status = document.createElement('span');
    status.className = statusClass;
    status.innerHTML = `${statusIcon} ${currency.format(requiredMonthly)} / month (${percentOfSavings.toFixed(1)}%)`;
    p.append(label, status);
    container.appendChild(p);
  });

  if (monthlySavings > 0 && totalRequiredMonthly > 0) {
    const totalPercent = (totalRequiredMonthly / monthlySavings) * 100;
    const summary = document.createElement('p');
    summary.style.fontWeight = 'bold';
    summary.style.marginTop = '0.75rem';

    if (totalPercent > 100) {
      summary.style.color = '#ef4444';
      summary.innerHTML = `<i class="fa-solid fa-circle-minus" style="color: rgb(255, 59, 59);"></i> Total allocation: ${totalPercent.toFixed(1)}% of monthly savings (Overallocated!)`;
    } else {
      summary.style.color = '#22c55e';
      summary.innerHTML = `<i class="fa-solid fa-circle-check" style="color: rgb(65, 250, 94);"></i> Total allocation: ${totalPercent.toFixed(1)}% of monthly savings`;
    }
    container.appendChild(summary);
  }
}

// ---------- overview ----------
function updateOverview() {
  const totalIncome = sum(getAmounts(config.income.containerId));
  const rowExpenses = sum(getAmounts(config.expenses.containerId));
  const debtPayments = getMonthlyDebtPayments();
  const contributions = getMonthlyContributions();
  const monthlySavings = totalIncome - rowExpenses - debtPayments - contributions;

  $('overviewIncome').textContent = currency.format(totalIncome);
  $('overviewExpenses').textContent = currency.format(rowExpenses + debtPayments);
  $('overviewSavings').textContent = currency.format(monthlySavings);
  $('overviewGrowth').textContent = currency.format(getProjectedInvestments());

  renderSavingsBreakdown(monthlySavings);
  renderDebtSummary();
  updateChart(totalIncome, rowExpenses);
  updateBreakdownChart(monthlySavings, contributions);
}

// ---------- projection chart ----------
let chartInstance = null;

function buildProjection(years, totalIncome, totalExpenses, subtractGoals) {
  const { raise, inflation, realDollars } = getAssumptions();
  const startBalance = Number($('balance').value) || 0;
  const contributions = getMonthlyContributions();
  const months = years * 12;
  const investedAll = simulateInvestments(months);
  const debtSim = simulateDebts(months);
  const allGoals = getGoals();
  const dueGoals = allGoals.filter((g) => g.month <= months);

  const labels = [];
  const cash = [];
  const cashNominal = [];
  const invested = [];
  const total = [];
  let cashValue = startBalance;

  for (let m = 0; m <= months; m++) {
    if (m > 0) {
      // raise and inflation step up once a year
      const yearIndex = Math.floor((m - 1) / 12);
      const income = totalIncome * Math.pow(1 + raise, yearIndex);
      const expenses = totalExpenses * Math.pow(1 + inflation, yearIndex);
      cashValue += income - expenses - contributions - debtSim.payments[m];

      if (subtractGoals) {
        dueGoals.filter((g) => g.month === m).forEach((g) => {
          cashValue -= g.amount;
        });
      }
    }

    const deflator = realDollars ? Math.pow(1 + inflation, m / 12) : 1;
    labels.push(m);
    cashNominal.push(cashValue);
    cash.push(cashValue / deflator);
    invested.push(investedAll[m] / deflator);
    // overall = net worth: cash + investments - debt still owed
    total.push((cashValue + investedAll[m] - debtSim.remaining[m]) / deflator);
  }

  const addNote = (notes, month, text) => {
    (notes[month] ||= []).push(text);
  };

  // goal target dates
  const dueNotes = {};
  dueGoals.forEach((g) => {
    addNote(dueNotes, g.month, `Goal due: ${g.name} (${currency.format(g.amount)})`);
  });

  // first month cash covers each goal
  const reachedNotes = {};
  allGoals.forEach((g) => {
    const m = cashNominal.findIndex((c) => c >= g.amount);
    if (m === -1) return;
    const diff = g.month - m;
    const timing =
      diff > 0 ? `${diff} mo before target` : diff < 0 ? `${-diff} mo after target` : 'on target';
    const prefix = m === 0 ? 'Already covered' : 'Goal reached';
    addNote(reachedNotes, m, `${prefix}: ${g.name} (${currency.format(g.amount)}), ${timing}`);
  });

  // debt payoff months
  const payoffNotes = {};
  debtSim.debts.forEach((d, i) => {
    const m = debtSim.payoffMonth[i];
    if (m !== null) addNote(payoffNotes, m, `Debt paid off: ${d.name}`);
  });

  return { labels, cash, invested, total, dueNotes, reachedNotes, payoffNotes };
}

function createChart() {
  chartInstance = new Chart($('projectionChart'), {
    type: 'line',
    data: { labels: [], datasets: [] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      layout: { padding: { top: 12, right: 12, left: 4 } },
      elements: { point: { radius: 0, hitRadius: 10 } },
      scales: {
        x: {
          grid: { display: true, drawTicks: true },
          ticks: {
            autoSkip: false,
            maxRotation: 0,
            callback(value) {
              const month = Number(this.getLabelForValue(value));
              const years = Number($('projectionYears').value) || 1;
              const narrow = window.innerWidth < 600;

              if (years === 1) {
                return month % (narrow ? 4 : 2) === 0 ? `Mo ${month}` : '';
              }
              const yearStep = narrow && years > 5 ? 2 : 1;
              return month % (12 * yearStep) === 0 ? `Yr ${month / 12}` : '';
            },
          },
        },
        y: {
          ticks: { callback: (value) => formatWhole(value) },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            title: (items) => `Month ${items[0].label}`,
            label(ctx) {
              // marker datasets carry their own notes, keyed by month
              if (ctx.dataset.notes) return ctx.dataset.notes[ctx.dataIndex] || [];
              return `${ctx.dataset.label}: ${currency.format(ctx.parsed.y)}`;
            },
          },
        },
      },
    },
  });
}

// Chart.js's built-in 'star' is just thin outlines, so draw a filled star instead
function makeStarIcon(fill, outline, size = 24) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext('2d');

  const center = size / 2;
  const outer = size / 2 - 2;
  const inner = outer * 0.45;

  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  g.lineWidth = 1.5;
  g.lineJoin = 'round';
  g.strokeStyle = outline;
  g.stroke();
  return canvas;
}

const GOAL_REACHED_ICON = makeStarIcon('#f59e0b', '#000000');

const VIEW_STYLES = {
  overall: { label: 'Overall', color: '#1f2937', key: 'total' },
  investments: { label: 'Investments', color: '#7c3aed', key: 'invested' },
  savings: { label: 'Savings', color: '#255ad4', key: 'cash' },
};

function updateChart(totalIncome, totalExpenses) {
  if (!chartInstance) createChart();

  const view = $('projectionView').value;
  const years = Number($('projectionYears').value) || 1;

  // subtracting goals only affects cash, so it doesn't apply to the investments-only view
  const subtractBox = $('subtractGoals');
  subtractBox.disabled = view === 'investments';
  subtractBox.parentElement.classList.toggle('disabled', subtractBox.disabled);
  const subtract = subtractBox.checked && !subtractBox.disabled;

  const proj = buildProjection(years, totalIncome, totalExpenses, subtract);
  const style = VIEW_STYLES[view];
  const lineColor = isDark() ? DARK_LINE_COLORS[view] : style.color;
  const lineData = proj[style.key];

  const markerSets = [
    { label: 'Goal due', notes: proj.dueNotes, color: '#22c55e', shape: 'rectRot', size: 8 },
    { label: 'Goal reached', notes: proj.reachedNotes, color: '#f59e0b', shape: GOAL_REACHED_ICON, size: 10 },
    { label: 'Debt paid off', notes: proj.payoffNotes, color: '#ef4444', shape: 'triangle', size: 8 },
  ];

  const datasets = [
    {
      label: style.label,
      data: lineData,
      borderColor: lineColor,
      backgroundColor: lineColor,
      borderWidth: 3,
      tension: 0.2,
    },
  ];

  // markers sit on whichever line is currently displayed; skip sets with no points
  markerSets.forEach(({ label, notes, color, shape, size }) => {
    if (!Object.keys(notes).length) return;
    datasets.push({
      label,
      notes,
      data: proj.labels.map((m) => (notes[m] ? lineData[m] : null)),
      showLine: false,
      order: -1, // draw markers on top of the line
      clip: false, // don't cut off markers at the chart edge
      borderColor: '#000000', // legend box outline
      borderWidth: 1.5,
      backgroundColor: color,
      pointStyle: shape,
      pointRadius: size,
      pointHoverRadius: size + 2,
      pointBackgroundColor: color,
      pointBorderColor: '#000000',
      pointBorderWidth: 1.5,
    });
  });

  // explain markers that can't be drawn for the selected range
  const noteEl = $('projectionNote');
  if (noteEl) {
    const horizon = years * 12;
    const beyond = getGoals()
      .filter((g) => g.month > horizon)
      .map((g) => `${g.name} goal (${monthLabel(g.month)})`);
    const longSim = simulateDebts(MAX_DEBT_MONTHS);
    longSim.debts.forEach((d, i) => {
      const m = longSim.payoffMonth[i];
      if (m !== null && m > horizon) beyond.push(`${d.name} payoff (${monthLabel(m)})`);
    });
    const past = Array.from($(config.savings.containerId).querySelectorAll('.entry-row'))
      .filter((row) => {
        const d = row.querySelector('.entry-date')?.value;
        return d && monthsUntil(d) <= 0 && Number(row.querySelector('.entry-amount').value) > 0;
      })
      .map((row) => row.querySelector('.entry-name').value || 'Unnamed Goal');

    const parts = [];
    if (beyond.length) parts.push(`Beyond this range: ${beyond.join(', ')}. Choose a longer range to see them.`);
    if (past.length) parts.push(`Past-dated goals aren't shown: ${past.join(', ')}.`);
    noteEl.textContent = parts.join(' ');
  }

  // 10-year view has too many monthly lines, so hide the vertical grid there
  const showGrid = years !== 10;
  chartInstance.options.scales.x.grid.display = showGrid;
  chartInstance.options.scales.x.grid.drawTicks = showGrid;

  chartInstance.data.labels = proj.labels;
  chartInstance.data.datasets = datasets;
  chartInstance.update();
}

// ---------- income breakdown chart ----------
const SLICE_COLORS = [
  "#6a00ff","#ff00ff","#ff0040","#ff9500","#ffff00","#aaff00","#00ff15","#00ffff","#0095ff"
];
const DEBT_COLORS = ['#be123c', '#e11d48', '#fb7185', '#9f1239'];

let breakdownChart = null;

function getExpenseRows() {
  return Array.from($(config.expenses.containerId).querySelectorAll('.entry-row'))
    .map((row) => ({
      name: row.querySelector('.entry-name').value || 'Unnamed expense',
      amount: Number(row.querySelector('.entry-amount').value) || 0,
    }))
    .filter((e) => e.amount > 0);
}

// numbers drawn on the pie slices: 'amount', 'percent' or 'both'
const SLICE_LABELS = 'amount';

const SLICE_TEXT_COLOR = '#111827'; // near-black

const sliceLabelPlugin = {
  id: 'sliceLabels',
  afterDatasetsDraw(chart) {
    const data = chart.data.datasets[0].data;
    const total = data.reduce((a, b, i) => a + (chart.getDataVisibility(i) ? b : 0), 0);
    if (total <= 0) return;

    const { ctx } = chart;
    const lineHeight = 14;
    const TWO_PI = Math.PI * 2;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillStyle = SLICE_TEXT_COLOR;

    chart.getDatasetMeta(0).data.forEach((arc, i) => {
      if (!chart.getDataVisibility(i)) return;
      const share = data[i] / total;
      if (share <= 0) return;

      const { x, y, startAngle, endAngle, outerRadius } = arc.getProps(
        ['x', 'y', 'startAngle', 'endAngle', 'outerRadius'],
        true,
      );

      const amount = formatWhole(data[i]);
      const percent = `${Math.round(share * 100)}%`;
      const lines =
        SLICE_LABELS === 'percent' ? [percent] : SLICE_LABELS === 'both' ? [amount, percent] : [amount];

      const halfW = Math.max(...lines.map((t) => ctx.measureText(t).width)) / 2 + 2;
      const halfH = (lines.length * lineHeight) / 2;
      const mid = (startAngle + endAngle) / 2;
      const fullCircle = endAngle - startAngle >= TWO_PI - 0.001;

      // the label fits if all four corners of its box lie inside the slice
      const fitsAt = (cx, cy) =>
        [[-halfW, -halfH], [halfW, -halfH], [-halfW, halfH], [halfW, halfH]].every(([dx, dy]) => {
          const px = cx + dx - x;
          const py = cy + dy - y;
          if (Math.hypot(px, py) > outerRadius - 2) return false;
          if (fullCircle) return true;
          let a = Math.atan2(py, px);
          while (a < startAngle) a += TWO_PI;
          while (a - startAngle >= TWO_PI) a -= TWO_PI;
          return a <= endAngle;
        });

      // try a few distances from the center; hide the label if none fits
      const distances = fullCircle ? [0] : [0.6, 0.7, 0.5, 0.8];
      const spot = distances
        .map((f) => ({
          cx: x + Math.cos(mid) * outerRadius * f,
          cy: y + Math.sin(mid) * outerRadius * f,
        }))
        .find((p) => fitsAt(p.cx, p.cy));
      if (!spot) return;

      lines.forEach((text, n) => {
        ctx.fillText(text, spot.cx, spot.cy + (n - (lines.length - 1) / 2) * lineHeight);
      });
    });
    ctx.restore();
  },
};

const pieSliceShadowPlugin = {
  id: 'pieSliceShadow',

  beforeDatasetDraw(chart, args, options) {
    const ctx = chart.ctx;

    ctx.save();
    ctx.shadowColor = options.color ?? 'rgba(15, 23, 42, 0.32)';
    ctx.shadowBlur = options.blur ?? 10;
    ctx.shadowOffsetX = options.offsetX ?? 0;
    ctx.shadowOffsetY = options.offsetY ?? 4;
  },

  afterDatasetDraw(chart) {
    chart.ctx.restore();
  },
};


// monthly amount each savings goal needs, as a share of monthly savings
function getGoalAllocations(monthlySavings) {
  const goals = getGoals().map((g) => {
    const monthly = g.amount / g.month;
    return {
      name: g.name,
      monthly,
      percent: monthlySavings > 0 ? (monthly / monthlySavings) * 100 : 0,
    };
  });
  const allocated = sum(goals.map((g) => g.monthly));
  return {
    goals,
    unallocated: monthlySavings - allocated,
    totalPercent: monthlySavings > 0 ? (allocated / monthlySavings) * 100 : 0,
  };
}

function updateBreakdownChart(monthlySavings, contributions = 0) {
  const expenses = getExpenseRows();
  const labels = expenses.map((e) => e.name);
  const values = expenses.map((e) => e.amount);
  const colors = expenses.map((_, i) => SLICE_COLORS[i % SLICE_COLORS.length]);
  const kinds = expenses.map(() => 'expense');

  getDebtRows()
    .filter((d) => d.payment > 0)
    .forEach((d, i) => {
      labels.push(d.name);
      values.push(d.payment);
      colors.push(DEBT_COLORS[i % DEBT_COLORS.length]);
      kinds.push('debt');
    });

  if (contributions > 0) {
    labels.push('Investing');
    values.push(contributions);
    colors.push('#7c3aed');
    kinds.push('investing');
  }

  if (monthlySavings > 0) {
    labels.push('Savings');
    values.push(monthlySavings);
    colors.push('#22c55e');
    kinds.push('savings');
  }

  const total = sum(values);
  $('breakdownEmpty').hidden = total > 0;
  $('breakdownNote').textContent =
    monthlySavings < 0
      ? `Your spending, debt payments and investing exceed your income by ${currency.format(-monthlySavings)}.`
      : '';

  if (!breakdownChart) {
    breakdownChart = new Chart($('breakdownChart'), {
      type: 'pie',
      plugins: [sliceLabelPlugin, pieSliceShadowPlugin],
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderColor: 'transparent',
          borderWidth: 2,
          hoverOffset: 15,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 28,
          },
        },
        plugins: {
          pieSliceShadow: {
            color: 'rgba(15, 23, 42, 0.32)',
            blur: 10,
            offsetX: 0,
            offsetY: 4,
          },
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label(ctx) {
                const data = ctx.dataset.data;
                const sliceTotal = data.reduce((a, b) => a + b, 0);
                const pct = sliceTotal > 0 ? (ctx.parsed / sliceTotal) * 100 : 0;
                return `${ctx.label}: ${currency.format(ctx.parsed)} (${pct.toFixed(1)}%)`;
              },
              afterLabel(ctx) {
                if (breakdownChart.sliceKinds?.[ctx.dataIndex] !== 'savings') return [];

                const { goals, unallocated, totalPercent } = getGoalAllocations(ctx.parsed);
                if (!goals.length) return ['No savings goals set'];

                const lines = ['Savings goals (per month, % of savings):'];
                goals.forEach((g) => {
                  lines.push(`• ${g.name}: ${currency.format(g.monthly)} (${g.percent.toFixed(1)}%)`);
                });
                lines.push(
                  unallocated >= 0
                    ? `• Unallocated: ${currency.format(unallocated)} (${(100 - totalPercent).toFixed(1)}%)`
                    : `• Over-allocated by ${currency.format(-unallocated)}`,
                );
                lines.push(`Total allocated: ${totalPercent.toFixed(1)}%`);
                return lines;
              },
            },
          },
        },
      },
    });
  }

  breakdownChart.sliceKinds = kinds;
  breakdownChart.data.labels = labels;
  breakdownChart.data.datasets[0].data = values;
  breakdownChart.data.datasets[0].backgroundColor = colors;
  breakdownChart.update();
}

// ---------- theme (light / dark) ----------
const THEME_KEY = 'budgetPlanner.theme';
const DARK_LINE_COLORS = { overall: '#f1f5f9', investments: '#a78bfa', savings: '#60a5fa' };

function isDark() {
  return document.documentElement.dataset.theme === 'dark';
}

// Chart.js reads these defaults when a chart is created
function applyChartTheme() {
  Chart.defaults.color = isDark() ? '#cbd5e1' : '#666666';
  Chart.defaults.borderColor = isDark() ? 'rgba(148, 163, 184, 0.2)' : 'rgba(0, 0, 0, 0.1)';
}

function syncThemeButton() {
  const button = $('themeToggle');
  if (!button) return;
  const dark = isDark();
  button.setAttribute('aria-pressed', String(dark));
  button.innerHTML = dark
    ? '<i class="fa-solid fa-sun" aria-hidden="true"></i> Light'
    : '<i class="fa-solid fa-moon" aria-hidden="true"></i> Dark';
}

function setTheme(theme, save = true) {
  document.documentElement.dataset.theme = theme;
  if (save) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (err) {
      /* ignore */
    }
  }
  syncThemeButton();
  applyChartTheme();

  // charts pick up their colors when created, so rebuild them
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
  if (breakdownChart) {
    breakdownChart.destroy();
    breakdownChart = null;
  }
  updateOverview();
}

function initTheme() {
  syncThemeButton();
  applyChartTheme();
  $('themeToggle')?.addEventListener('click', () => setTheme(isDark() ? 'light' : 'dark'));

  // follow the system setting until the visitor picks a theme themselves
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', (e) => {
    let saved = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch (err) {
      /* ignore */
    }
    if (!saved) setTheme(e.matches ? 'dark' : 'light', false);
  });
}

// ---------- init ----------
function initSection(type) {
  const section = config[type];
  section.defaultRows.forEach((row) => addRow(type, row));

  $(section.addButtonId).addEventListener('click', () => {
    addRow(type);
    updateOverview();
  });
}

function initApp() {
  Object.keys(config).forEach(initSection);
  $('balance').addEventListener('input', updateOverview);

  const tutorialButton = $('allocationTutorial');
  const tutorialBox = $('hiddenText');

  function setTutorialOpen(open) {
    tutorialBox.classList.toggle('show-info', open);
    tutorialButton.setAttribute('aria-expanded', String(open));
  }

  tutorialButton.addEventListener('click', (e) => {
    e.stopPropagation();
    setTutorialOpen(!tutorialBox.classList.contains('show-info'));
  });

  document.addEventListener('click', (e) => {
    if (!tutorialBox.contains(e.target)) setTutorialOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setTutorialOpen(false);
  });

  $('projectionYears').addEventListener('change', updateOverview);
  $('projectionView').addEventListener('change', updateOverview);
  $('subtractGoals').addEventListener('change', updateOverview);

  const currencySelect = $('currencySelect');
  Object.entries(CURRENCIES).forEach(([key, c]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = `${c.symbol} ${c.label}`;
    currencySelect.append(option);
  });

  currencySelect.addEventListener('change', () => {
    activeCurrency = CURRENCIES[currencySelect.value];
    applyCurrencyIcons();
    updateOverview();
  });

  $('raiseRate').addEventListener('input', updateOverview);
  $('inflationRate').addEventListener('input', updateOverview);
  $('realDollars').addEventListener('change', updateOverview);

  initTheme();
  applyCurrencyIcons();
  updateOverview();
}

const policies = {
    privacy: {
      title: "Privacy policy",
      content: `
        <p><strong>Where your data is stored:</strong> Budget information you enter is saved in your browser’s local storage on your device. No personal information is saved, no cookies are used for tracking, and your budget data is not shared with anyone.</p>
        <p><strong>Exporting your data:</strong> You can export your budget as a JSON or CSV file. The exported file is saved or handled by your browser, and you choose where to keep it. Exported files may contain sensitive financial information, so store and share them carefully.</p>
        <p>For questions about this policy, contact: <a href="mailto:you@example.com">you@example.com</a>.</p>
      `
    },
    terms: {
      title: "Terms of service",
      content: `
        <p><strong>1. No Warranty</strong></p>
        <p>The service is provided "as is" without any warranties. Budget Planner does not guarantee the accuracy of calculations or projections.</p>
        <p><strong>2. Limitation of Liability</strong></p>
        <p>Budget Planner is not liable for any decisions made based on the calculations or information provided by this tool. Use at your own risk.</p>
        <p><strong>3. Service Availability</strong></p>
        <p>Budget Planner has no guarantee of uninterrupted access to the service.</p>
      `
    },
    disclaimer: {
      title: "Disclaimer",
      content: `
        <p>Budget Planner provides calculations and projections for informational purposes only. It does not provide financial, tax, legal, or investment advice.</p>
        <p>The calculations and projections are only estimates. These calculations may differ from actual results due to real-woeld circumstance. Always consult with qualified financial professionals before making important financial decisions. Your use of this tool indicates acceptance of these terms.</p>
      `
    }
  };

  const dialog = document.querySelector("#policy-dialog");
  const title = document.querySelector("#dialog-title");
  const content = document.querySelector("#dialog-content");

  document.querySelectorAll("[data-policy]").forEach((button) => {
    button.addEventListener("click", () => {
      const policy = policies[button.dataset.policy];
      title.textContent = policy.title;
      content.innerHTML = policy.content;
      dialog.showModal();
    });
  });

  document.querySelector(".close-button").addEventListener("click", () => {
    dialog.close();
  });

  // Allow clicking the backdrop to close the dialog.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

initApp();