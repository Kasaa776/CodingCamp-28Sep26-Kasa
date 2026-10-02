/* Expense & Budget Visualizer — Vanilla JS, data disimpan di localStorage */
(function () {
  'use strict';

  // ===== Konstanta & state =====
  const KEY = { tx: 'ebv_transactions', cats: 'ebv_custom_categories', theme: 'ebv_theme' };
  const DEFAULT_CATS = ['Food', 'Transport', 'Fun'];
  const COLORS = ['#2ecc71', '#3498db', '#e67e22', '#9b59b6', '#e74c3c', '#1abc9c', '#f1c40f', '#fd79a8', '#34495e', '#00b894'];

  let transactions = load(KEY.tx, []);
  let customCats = load(KEY.cats, []);
  let chart = null;

  // ===== Elemen =====
  const $ = (id) => document.getElementById(id);
  const el = {
    toggle: $('theme-toggle'), balance: $('total-balance'),
    form: $('tx-form'), name: $('item-name'), amount: $('amount'), category: $('category'), date: $('tx-date'), formError: $('form-error'),
    catForm: $('cat-form'), newCat: $('new-category'), catError: $('cat-error'), chips: $('cat-chips'),
    month: $('month-picker'), mTotal: $('m-total'), mCount: $('m-count'), mTop: $('m-top'), mBreakdown: $('m-breakdown'), mEmpty: $('m-empty'),
    list: $('tx-list'), listEmpty: $('list-empty'), canvas: $('chart'), chartEmpty: $('chart-empty')
  };

  // ===== Helper =====
  function load(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage penuh/diblokir */ }
  }
  const allCats = () => DEFAULT_CATS.concat(customCats);
  const colorOf = (cat) => COLORS[allCats().indexOf(cat) % COLORS.length] || '#95a5a6';
  const money = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pad = (n) => String(n).padStart(2, '0');
  const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const monthStr = (dateStr) => dateStr.slice(0, 7);
  function make(tag, className, text) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function showError(node, msg) { node.textContent = msg; node.hidden = !msg; }
  function totalsByCategory(list) {
    const totals = {};
    list.forEach((t) => { totals[t.category] = (totals[t.category] || 0) + t.amount; });
    return totals;
  }

  // ===== Dark / Light mode =====
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    el.toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    el.toggle.title = theme === 'dark' ? 'Beralih ke mode terang' : 'Beralih ke mode gelap';
    if (chart) { updateChartTheme(); chart.update(); }
  }
  function initTheme() {
    let theme = load(KEY.theme, null);
    if (!theme) theme = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    applyTheme(theme);
  }
  el.toggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    save(KEY.theme, next);
    applyTheme(next);
  });

  // ===== Kategori (default + kustom) =====
  function renderCategories() {
    const selected = el.category.value;
    el.category.replaceChildren(...allCats().map((c) => { const o = make('option', '', c); o.value = c; return o; }));
    if (allCats().includes(selected)) el.category.value = selected;

    el.chips.replaceChildren(...customCats.map((c) => {
      const li = make('li');
      const dot = make('span', 'dot'); dot.style.background = colorOf(c);
      const btn = make('button', '', '×');
      btn.type = 'button'; btn.dataset.cat = c; btn.setAttribute('aria-label', 'Hapus kategori ' + c);
      li.append(dot, make('span', '', c), btn);
      return li;
    }));
  }

  el.catForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = el.newCat.value.trim();
    if (!name) return showError(el.catError, 'Nama kategori wajib diisi.');
    if (allCats().some((c) => c.toLowerCase() === name.toLowerCase())) return showError(el.catError, 'Kategori "' + name + '" sudah ada.');
    customCats.push(name);
    save(KEY.cats, customCats);
    el.newCat.value = '';
    showError(el.catError, '');
    renderCategories();
    el.category.value = name;
    renderAll();
  });

  el.chips.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-cat]');
    if (!btn) return;
    const cat = btn.dataset.cat;
    if (transactions.some((t) => t.category === cat)) {
      return showError(el.catError, 'Kategori "' + cat + '" masih dipakai transaksi. Hapus transaksinya dulu.');
    }
    customCats = customCats.filter((c) => c !== cat);
    save(KEY.cats, customCats);
    showError(el.catError, '');
    renderCategories();
    renderAll();
  });

  // ===== Tambah & hapus transaksi =====
  el.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = el.name.value.trim();
    const amount = parseFloat(el.amount.value);
    const category = el.category.value;
    const date = el.date.value;

    if (!name || el.amount.value === '' || !category || !date) return showError(el.formError, 'Semua kolom wajib diisi.');
    if (!(amount > 0)) return showError(el.formError, 'Jumlah harus lebih dari 0.');

    transactions.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, amount, category, date });
    save(KEY.tx, transactions);
    showError(el.formError, '');
    el.name.value = ''; el.amount.value = '';
    el.name.focus();
    if (monthStr(date) !== el.month.value) el.month.value = monthStr(date); // ringkasan ikut bulan transaksi baru
    renderAll();
  });

  el.list.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-id]');
    if (!btn) return;
    transactions = transactions.filter((t) => t.id !== btn.dataset.id);
    save(KEY.tx, transactions);
    renderAll();
  });

  // ===== Render =====
  function renderBalance() {
    el.balance.textContent = money(transactions.reduce((sum, t) => sum + t.amount, 0));
  }

  function renderList() {
    el.listEmpty.hidden = transactions.length > 0;
    el.list.replaceChildren(...transactions.map((t) => {
      const li = make('li');
      const info = make('div');
      const meta = make('div', 'tx-meta');
      const tag = make('span', 'tag', t.category);
      meta.append(tag, make('span', 'tx-date', t.date));
      info.append(make('div', 'tx-name', t.name), make('div', 'tx-amount', money(t.amount)), meta);
      const del = make('button', 'btn danger', 'Delete');
      del.type = 'button'; del.dataset.id = t.id; del.setAttribute('aria-label', 'Hapus ' + t.name);
      li.append(info, del);
      return li;
    }));
  }

  function updateChartTheme() {
    const text = getComputedStyle(document.documentElement).getPropertyValue('--text').trim();
    const card = getComputedStyle(document.documentElement).getPropertyValue('--card').trim();
    chart.options.plugins.legend.labels.color = text;
    chart.data.datasets[0].borderColor = card;
  }

  function renderChart() {
    const totals = totalsByCategory(transactions);
    const labels = Object.keys(totals);
    const hasData = labels.length > 0;
    el.canvas.parentElement.hidden = !hasData;
    el.chartEmpty.hidden = hasData;
    if (!hasData || typeof Chart === 'undefined') return;

    const data = labels.map((l) => totals[l]);
    const colors = labels.map(colorOf);
    if (!chart) {
      chart = new Chart(el.canvas, {
        type: 'pie',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2 }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12 } },
            tooltip: { callbacks: { label: (c) => ' ' + c.label + ': ' + money(c.parsed) } }
          }
        }
      });
    } else {
      chart.data.labels = labels;
      chart.data.datasets[0].data = data;
      chart.data.datasets[0].backgroundColor = colors;
    }
    updateChartTheme();
    chart.update();
  }

  // ===== Ringkasan bulanan =====
  function renderMonthly() {
    const month = el.month.value;
    const list = transactions.filter((t) => monthStr(t.date) === month);
    const total = list.reduce((s, t) => s + t.amount, 0);
    const totals = totalsByCategory(list);
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);

    el.mTotal.textContent = money(total);
    el.mCount.textContent = list.length;
    el.mTop.textContent = sorted.length ? sorted[0][0] : '-';
    el.mEmpty.hidden = list.length > 0;

    el.mBreakdown.replaceChildren(...sorted.map(([cat, amt]) => {
      const pct = total ? (amt / total) * 100 : 0;
      const li = make('li');
      const row = make('div', 'row');
      const name = make('span', 'name');
      const dot = make('span', 'dot'); dot.style.background = colorOf(cat);
      name.append(dot, make('span', '', cat));
      row.append(name, make('span', '', money(amt) + ' (' + pct.toFixed(0) + '%)'));
      const bar = make('div', 'bar');
      const fill = make('span'); fill.style.width = pct + '%'; fill.style.background = colorOf(cat);
      bar.append(fill);
      li.append(row, bar);
      return li;
    }));
  }

  el.month.addEventListener('change', () => { if (!el.month.value) el.month.value = todayStr().slice(0, 7); renderMonthly(); });

  function renderAll() {
    renderBalance();
    renderList();
    renderChart();
    renderMonthly();
  }

  // ===== Init =====
  el.date.value = todayStr();
  el.month.value = todayStr().slice(0, 7);
  initTheme();
  renderCategories();
  renderAll();
})();
