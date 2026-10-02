# Design: revoU-bootcamp — Expense & Budget Visualizer Enhancements

## Overview

This document describes the technical architecture for eight enhancement areas on top of the existing Vanilla JS + Chart.js single-file application. All logic lives inside the existing IIFE in `js/app.js`, new HTML sections are added to `index.html`, and new component styles are appended to `css/style.css`.

---

## Architecture Principles

- **Single IIFE, internal modules**: The IIFE is organized into named function groups (sections) that mirror the feature areas. No module bundler is used; functions communicate through shared state variables and a central `renderAll()` orchestrator.
- **localStorage as the source of truth**: All persistent data lives in `localStorage` under well-defined keys.
- **Progressive enhancement**: Each feature area adds onto existing patterns (e.g., the existing `renderList()` is extended rather than replaced).
- **No external dependencies beyond Chart.js 4.4.1**: Testing uses `fast-check` loaded via CDN or `<script>` tag in a separate test harness HTML file.

---

## 1. Data Model

### 1.1 Transaction Object (extended)

```js
{
  id:       String,   // e.g. "lz3r4ab7" — unchanged
  type:     String,   // "income" | "expense"  ← NEW (default "expense" for legacy rows)
  name:     String,   // 1–60 characters
  amount:   Number,   // 0.01 – 999,999,999.99
  category: String,   // must exist in allCats()
  date:     String    // "YYYY-MM-DD"
}
```

**Backward compatibility:** At load time, any transaction missing `type` is normalised to `"expense"` by the `migrateLegacy()` helper before being stored back.

### 1.2 Budget Object

```js
// localStorage key: "ebv_budgets"
// Schema: { [categoryName: string]: number }
// Example: { "Food": 300.00, "Transport": 150.00 }
```

Budget values are per-category monthly limits (range 0.01 – 999,999.99).

### 1.3 localStorage Key Registry

| Key | Existing? | Content |
|---|---|---|
| `ebv_transactions` | ✅ | `Transaction[]` |
| `ebv_custom_categories` | ✅ | `string[]` |
| `ebv_theme` | ✅ | `"light" \| "dark"` |
| `ebv_budgets` | 🆕 | `{ [cat]: number }` |

---

## 2. HTML Changes (`index.html`)

### 2.1 Transaction Type Selector (inside `#tx-form`)

Add a `<fieldset>` with two radio buttons directly before the `item-name` label. This keeps the form flow logical and keyboard-navigable.

```html
<fieldset class="type-selector" id="tx-type-group">
  <legend>Transaction Type</legend>
  <label class="radio-label">
    <input type="radio" name="tx-type" value="expense" checked> Expense
  </label>
  <label class="radio-label">
    <input type="radio" name="tx-type" value="income"> Income
  </label>
</fieldset>
```

### 2.2 Inline Edit Controls (inside `#tx-list` items, rendered by JS)

No static HTML needed — edit controls are injected by `enterEditMode()`.

### 2.3 Budget Limits Section (new `<section>`)

Place after the Custom Categories section and before the Monthly Summary:

```html
<section class="card" id="budget-section">
  <h2>Budget Limits</h2>
  <form id="budget-form" novalidate>
    <label for="budget-category">Category</label>
    <select id="budget-category"></select>
    <label for="budget-amount">Monthly Limit ($)</label>
    <input id="budget-amount" type="number" min="0.01" max="999999.99" step="0.01"
           placeholder="0.00" inputmode="decimal">
    <p id="budget-error" class="error" role="alert" hidden></p>
    <button type="submit" class="btn primary">Set Budget</button>
  </form>
  <ul id="budget-list" class="budget-list" aria-label="Category budget limits"></ul>
</section>
```

### 2.4 Filter / Sort / Search Controls (new toolbar inside Transactions section)

Replace the existing `<section class="card">` that wraps `#tx-list` with:

```html
<section class="card">
  <h2>Transactions</h2>
  <div class="filter-bar" role="search">
    <input id="search-input" type="search" placeholder="Search…" aria-label="Search transactions">
    <select id="filter-type" aria-label="Filter by type">
      <option value="">All Types</option>
      <option value="income">Income</option>
      <option value="expense">Expense</option>
    </select>
    <select id="filter-category" aria-label="Filter by category">
      <option value="">All Categories</option>
    </select>
    <select id="sort-select" aria-label="Sort transactions">
      <option value="date-desc">Date ↓</option>
      <option value="date-asc">Date ↑</option>
      <option value="amount-desc">Amount ↓</option>
      <option value="amount-asc">Amount ↑</option>
    </select>
  </div>
  <ul id="tx-list" class="tx-list" aria-label="Transaction list"></ul>
  <p id="list-empty" class="empty">No transactions. Add your first one above.</p>
</section>
```

### 2.5 Export / Import Controls (new toolbar, append before closing `</main>`)

```html
<section class="card" id="data-io">
  <h2>Export / Import</h2>
  <div class="io-bar">
    <button id="export-btn" type="button" class="btn primary" style="width:auto">Export CSV</button>
    <label class="btn primary" style="width:auto;cursor:pointer">
      Import CSV
      <input id="import-input" type="file" accept=".csv,text/csv" hidden>
    </label>
    <p id="import-status" role="status" aria-live="polite" hidden></p>
  </div>
</section>
```

---

## 3. CSS Changes (`css/style.css`)

### 3.1 New / modified tokens

```css
:root {
  --success:       #27ae60;
  --warning:       #f39c12;
  --warning-bg:    #fef9e7;
  --danger-bg:     #fdecea;
  --income:        #27ae60;
  --expense:       #e74c3c;
}
[data-theme="dark"] {
  --warning-bg:    #2d2a1e;
  --danger-bg:     #2d1c1c;
}
```

### 3.2 Type Selector

```css
.type-selector { border: 1px solid var(--border); border-radius: 6px; padding: 10px 14px; margin: 12px 0 6px; }
.type-selector legend { font-size: .85rem; font-weight: 600; padding: 0 4px; }
.radio-label { display: inline-flex; align-items: center; gap: 6px; margin-right: 16px; cursor: pointer; }
.radio-label input { width: auto; }
```

### 3.3 Transaction Amount Colors

```css
.tx-amount.income  { color: var(--income); }
.tx-amount.expense { color: var(--expense); }
```

### 3.4 Inline Edit Mode

```css
.tx-edit-row { display: grid; gap: 6px; flex: 1; }
.tx-edit-row input, .tx-edit-row select { padding: 6px 10px; font-size: .85rem; }
.tx-edit-actions { display: flex; gap: 6px; margin-top: 6px; }
.btn.secondary { background: var(--chip); color: var(--text); width: auto; margin: 0; padding: 7px 14px; font-size: .78rem; }
.btn.secondary:hover { filter: brightness(.95); }
```

### 3.5 Budget List

```css
.budget-list { list-style: none; padding: 0; margin-top: 14px; display: grid; gap: 10px; }
.budget-item { font-size: .88rem; }
.budget-item .budget-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.budget-item .budget-bar { height: 8px; background: var(--chip); border-radius: 4px; margin-top: 4px; overflow: hidden; }
.budget-item .budget-fill { display: block; height: 100%; border-radius: 4px; transition: width .3s; }
.budget-badge { font-size: .72rem; font-weight: 700; padding: 2px 7px; border-radius: 999px; }
.budget-badge.ok      { background: var(--chip); color: var(--muted); }
.budget-badge.warning { background: var(--warning-bg); color: var(--warning); }
.budget-badge.danger  { background: var(--danger-bg);  color: var(--danger); }
```

### 3.6 Filter Bar

```css
.filter-bar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.filter-bar input[type="search"],
.filter-bar select { width: auto; flex: 1 1 120px; padding: 7px 10px; font-size: .85rem; }
```

### 3.7 Export / Import Bar

```css
.io-bar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
```

### 3.8 Responsive overrides

```css
@media (max-width: 599px) {
  /* Single-column layout already implied by the grid; ensure tx-list height */
  .tx-list { max-height: 50vh; }

  /* Hide chart legend text; show swatches only */
  .chart-legend-text { display: none; }
}
```

### 3.9 Touch targets — global rule

```css
button, [role="button"], input[type="radio"], input[type="checkbox"],
a, select, .btn, .icon-btn {
  min-height: 44px; min-width: 44px;
}
.radio-label input[type="radio"] { min-height: 20px; min-width: 20px; } /* override for inline radio */
```

### 3.10 Balance color driven by sign

```css
.balance-value.positive { color: var(--income); }
.balance-value.negative { color: var(--danger); }
.balance-value.zero     { color: var(--accent); }
```

---

## 4. IIFE Internal Structure (`js/app.js`)

The existing IIFE is reorganised into clearly delimited sections. New sections are appended; existing ones are modified minimally.

```
(function () {
  'use strict';

  // ── §1  Constants & State ──────────────────────────────────────────────
  //   KEY, DEFAULT_CATS, COLORS (existing + KEY.budgets)
  //   let budgets = load(KEY.budgets, {});  ← NEW

  // ── §2  DOM Element References ─────────────────────────────────────────
  //   el object (existing + new refs for filter, budget, io elements)

  // ── §3  Helpers ─────────────────────────────────────────────────────────
  //   load, save, allCats, colorOf, money, pad, todayStr, monthStr, make,
  //   showError, totalsByCategory  (existing)
  //   migrateLegacy()     ← NEW: normalise legacy transactions
  //   getNetBalance()     ← NEW: Σincome - Σexpense
  //   filteredSortedTx()  ← NEW: apply filter/sort/search state
  //   parseCSVRow()       ← NEW: RFC 4180 single-row parser
  //   buildCSVRow()       ← NEW: RFC 4180 single-row serialiser
  //   contrastRatio()     ← NEW: WCAG contrast calculation (used in tests)

  // ── §4  Theme ──────────────────────────────────────────────────────────
  //   applyTheme, initTheme, toggle listener  (existing, unchanged)

  // ── §5  Category Management ────────────────────────────────────────────
  //   renderCategories, catForm listener, chips listener  (existing)
  //   Extends renderCategories() to also populate #filter-category + #budget-category

  // ── §6  Transaction Form (Add) ─────────────────────────────────────────
  //   form submit listener — extended to read tx-type radio value
  //   Validation: name length, amount range, required fields, aria-invalid

  // ── §7  Inline Edit ────────────────────────────────────────────────────
  //   enterEditMode(id)   — replaces list item content with edit controls
  //   saveEdit(id)        — validates, updates transaction, exits edit mode
  //   cancelEdit()        — restores previous render without saving
  //   activeEditId        — module-level variable (null when no edit active)

  // ── §8  Budget Limits ──────────────────────────────────────────────────
  //   budgetForm listener  — validate & save budget
  //   renderBudgets()      — render #budget-list with bars + badges
  //   budgetStatusFor(cat, monthlySpend) → "ok" | "warning" | "danger"

  // ── §9  Filter / Sort / Search ─────────────────────────────────────────
  //   filterState = { type, category, search, sort }
  //   filter/sort/search event listeners → update filterState → renderList()
  //   filteredSortedTx() — pure function; applies filterState to transactions

  // ── §10 Render ────────────────────────────────────────────────────────
  //   renderBalance()     — extended: net balance + CSS class
  //   renderList()        — extended: filtered/sorted, edit button, type badge
  //   renderChart()       — extended: aria-label with summary text
  //   renderMonthly()     — extended: budget status in breakdown
  //   renderBudgets()     — NEW
  //   renderAll()         — calls all render fns

  // ── §11 CSV Export / Import ───────────────────────────────────────────
  //   exportCSV()         — build RFC 4180 CSV, trigger download
  //   importCSV(text)     — parse, validate, merge, report errors
  //   export/import event listeners

  // ── §12 Init ─────────────────────────────────────────────────────────
  //   migrateLegacy(), initTheme(), renderCategories(), renderAll()

})();
```

---

## 5. Component Interfaces

### 5.1 `migrateLegacy(txArray) → Transaction[]`

```js
// Pure function — does not mutate input
function migrateLegacy(txArray) {
  return txArray.map(t => t.type ? t : { ...t, type: 'expense' });
}
```

Called once at init; result is saved back to `KEY.tx` only if any row was changed.

### 5.2 `getNetBalance(txArray) → Number`

```js
function getNetBalance(txArray) {
  return txArray.reduce((sum, t) => {
    return t.type === 'income' ? sum + t.amount : sum - t.amount;
  }, 0);
}
```

### 5.3 `filteredSortedTx(txArray, filterState) → Transaction[]`

```js
// filterState = { type: ''|'income'|'expense', category: ''|string, search: string, sort: string }
function filteredSortedTx(txArray, state) {
  let result = txArray;
  if (state.type)     result = result.filter(t => t.type === state.type);
  if (state.category) result = result.filter(t => t.category === state.category);
  if (state.search)   result = result.filter(t => t.name.toLowerCase().includes(state.search.toLowerCase()));
  const [field, dir] = state.sort.split('-');
  result = [...result].sort((a, b) => {
    const va = field === 'date' ? a.date : a.amount;
    const vb = field === 'date' ? b.date : b.amount;
    return dir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });
  return result;
}
```

### 5.4 `budgetStatusFor(cat, monthlySpend, budgets) → "ok" | "warning" | "danger"`

```js
function budgetStatusFor(cat, spend, budgets) {
  const limit = budgets[cat];
  if (!limit) return 'ok';
  if (spend > limit) return 'danger';
  if (spend >= limit * 0.8) return 'warning';
  return 'ok';
}
```

### 5.5 `parseCSVRow(line) → string[]`

RFC 4180-compliant single-row parser. Handles quoted fields, embedded commas, and escaped double-quotes (`""`).

```js
function parseCSVRow(line) {
  const fields = [];
  let cur = '', inQuote = false, i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"' && line[i+1] === '"') { cur += '"'; i += 2; continue; }
      if (ch === '"') { inQuote = false; i++; continue; }
      cur += ch;
    } else {
      if (ch === '"') { inQuote = true; i++; continue; }
      if (ch === ',') { fields.push(cur); cur = ''; i++; continue; }
      cur += ch;
    }
    i++;
  }
  fields.push(cur);
  return fields;
}
```

### 5.6 `buildCSVRow(fields) → string`

```js
function buildCSVRow(fields) {
  return fields.map(f => {
    const s = String(f);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }).join(',');
}
```

### 5.7 `importCSV(text) → { imported: number, errors: string[] }`

```
1. Split by line (handle \r\n and \n).
2. Validate header row matches expected: id,type,name,amount,category,date.
3. For each data row:
   a. Parse with parseCSVRow().
   b. Validate: id non-empty, type ∈ {income,expense}, name 1-60 chars,
      amount parseable and in range, category non-empty, date valid YYYY-MM-DD.
   c. If valid and id not already in transactions → push to import buffer.
   d. If invalid → push error message with row number.
4. Merge import buffer into transactions, save, renderAll().
5. Return { imported, errors }.
```

### 5.8 Validation Helper `validateTxFields(fields) → string | null`

```js
// Returns an error message or null if valid
function validateTxFields({ type, name, amount, category, date }) {
  if (!['income','expense'].includes(type)) return 'Invalid type.';
  if (!name || name.length > 60) return 'Name must be 1–60 characters.';
  const amt = parseFloat(amount);
  if (isNaN(amt) || amt < 0.01 || amt > 999_999_999.99) return 'Amount out of range.';
  if (!category) return 'Category required.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Invalid date format.';
  return null;
}
```

---

## 6. Inline Edit Flow

```
User clicks [Edit]
  └─ enterEditMode(id)
       ├─ if activeEditId !== null → cancel previous edit first (cancelEdit())
       ├─ set activeEditId = id
       ├─ replace <li> content with edit controls (inputs pre-filled, Save/Cancel buttons)
       └─ focus first input

User clicks [Save]
  └─ saveEdit(id)
       ├─ read values from edit inputs
       ├─ validateTxFields() → show field errors if invalid
       ├─ update transactions array + save to localStorage
       ├─ activeEditId = null
       └─ renderList()

User clicks [Cancel]
  └─ cancelEdit()
       ├─ activeEditId = null
       └─ renderList()  (restores original row)
```

---

## 7. CSV Export Format

```
id,type,name,amount,category,date
lz3r4ab7,expense,"Cilok, Gorengan",5000.00,Food,2025-01-15
```

- Header: `id,type,name,amount,category,date`
- Amount formatted to 2 decimal places.
- Fields containing `,` or `"` are quoted per RFC 4180.
- File download triggered via `URL.createObjectURL(new Blob([csv], {type:'text/csv'}))`.

---

## 8. Error Handling

| Scenario | Handling |
|---|---|
| localStorage full | `save()` catches and silently fails; existing data preserved |
| Chart.js not loaded | `renderChart()` guards with `typeof Chart === 'undefined'` |
| Invalid CSV row on import | Per-row error reported; other rows still imported |
| Amount NaN or out of range | `validateTxFields()` returns error string; form shows error, `aria-invalid="true"` |
| Budget set for unknown category | Budget form select is populated from `allCats()` — invalid categories are structurally impossible |
| Concurrent edit attempt | `enterEditMode()` calls `cancelEdit()` first — guarantees at most one active edit |
| Legacy data migration fails | `migrateLegacy()` is a pure map; individual rows that are not plain objects are filtered out |

---

## 9. Accessibility Details

- All error containers use `role="alert"` (already present in baseline code); `aria-invalid="true"` added to inputs when field-level errors occur.
- `#tx-list` gets `aria-label="Transaction list"` and `aria-live="polite"` so screen readers announce additions/deletions.
- `#chart` `aria-label` is dynamically updated by `renderChart()` to include a textual summary of the top categories and their amounts, e.g.: `"Pie chart: Food $320.00 (45%), Transport $180.00 (25%), Fun $210.00 (30%)"`.
- Character counter for item name is rendered as `<span id="name-counter" aria-live="polite">60</span>` and updated on `input` events.
- Budget badges use `role="status"` and include both the percentage and the status word for screen readers.

---

## 10. Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Testing framework: **[fast-check](https://fast-check.dev/)** loaded via CDN in a `test.html` harness file. Pure functions (balance calculation, filtering, sorting, CSV parsing/formatting, validation, budget status) are extracted from the IIFE and tested as standalone functions in the harness.

---

### Property 1: Net balance formula

*For any* list of transactions with arbitrary income and expense amounts, the net balance equals the sum of all income amounts minus the sum of all expense amounts.

**Validates: Requirements 1.1, 1.2, 1.3**

---

### Property 2: Edit mode pre-populates with existing data

*For any* transaction, entering edit mode for that transaction SHALL result in the edit input fields containing values equal to the transaction's current `type`, `name`, `amount`, `category`, and `date` fields.

**Validates: Requirements 2.2**

---

### Property 3: Cancel edit is identity

*For any* transaction T in any application state, invoking edit mode on T and then immediately cancelling SHALL leave T with all original field values unchanged.

**Validates: Requirements 2.3**

---

### Property 4: Budget persistence round-trip

*For any* category name C and any budget value V in the range [0.01, 999999.99], setting the budget for C to V and then loading the budget store from `localStorage` SHALL produce V for key C.

**Validates: Requirements 3.1**

---

### Property 5: Budget status thresholds

*For any* budget limit L > 0 and monthly spend S ≥ 0:
- If S > L → `budgetStatusFor` returns `"danger"`
- If S ≥ L × 0.8 and S ≤ L → `budgetStatusFor` returns `"warning"`
- If S < L × 0.8 → `budgetStatusFor` returns `"ok"`

**Validates: Requirements 3.2, 3.3**

---

### Property 6: Type filter returns only matching transactions

*For any* non-empty list of transactions and any filter type in `{ "income", "expense" }`, every transaction in the filtered result SHALL have `type` equal to the filter value.

**Validates: Requirements 4.1**

---

### Property 7: Category filter returns only matching transactions

*For any* list of transactions and any category string C, every transaction in the filtered result SHALL have `category` equal to C.

**Validates: Requirements 4.2**

---

### Property 8: Text search matches are case-insensitive substrings

*For any* list of transactions and any search string Q, every transaction in the filtered result SHALL have a `name` that contains Q as a substring when both are lowercased.

**Validates: Requirements 4.3**

---

### Property 9: Sort produces a correctly ordered sequence

*For any* list of transactions and any sort option in `{ "date-desc", "date-asc", "amount-desc", "amount-asc" }`, the sorted result SHALL be monotonically ordered with respect to the corresponding field and direction: for every adjacent pair (a, b), `a.field ≤ b.field` (ascending) or `a.field ≥ b.field` (descending).

**Validates: Requirements 4.4**

---

### Property 10: Valid transactions are accepted without errors

*For any* `type ∈ {income, expense}`, name of length 1–60, amount in [0.01, 999,999,999.99], non-empty category, and valid date string, `validateTxFields()` SHALL return `null` (no error).

**Validates: Requirements 5.4**

---

### Property 11: CSV serialisation round-trip

*For any* list of transactions, building a CSV with the header row `id,type,name,amount,category,date` and then parsing it back SHALL produce a list of objects where each field value equals the corresponding field of the original transaction (amounts within floating-point tolerance).

**Validates: Requirements 6.1**

---

### Property 12: Import merge is idempotent

*For any* initial transaction list and any valid CSV text, importing the same CSV twice SHALL produce a transaction list with the same set of unique `id` values as importing it once — no duplicates introduced.

**Validates: Requirements 6.2**

---

### Property 13: Partial CSV import tolerates bad rows

*For any* CSV with a mix of valid and invalid data rows, `importCSV()` SHALL import all valid rows and return an `errors` array with exactly one entry per invalid row, without throwing an exception.

**Validates: Requirements 6.3**

---

### Property 14: Interactive elements meet touch-target size

*For any* rendered interactive element (buttons, selects, inputs, radio labels) in the DOM, its bounding client rect's `height` and `width` SHALL each be ≥ 44 pixels.

**Validates: Requirements 7.3**

---

### Property 15: Chart `aria-label` contains category and amount data

*For any* non-empty transaction set, after `renderChart()` executes, the `aria-label` attribute of `#chart` SHALL contain the name and formatted amount of each category present in the transaction data.

**Validates: Requirements 8.3**

---

### Property 16: Color token contrast ratios meet WCAG AA

*For any* foreground/background token pair used for body text (e.g., `--text` / `--bg`, `--text` / `--card`), both in light and dark themes, `contrastRatio(fg, bg)` SHALL return a value ≥ 4.5.

**Validates: Requirements 8.1**

---

## 11. Testing Strategy Summary

| Layer | Tool | What is covered |
|---|---|---|
| Property tests | fast-check | Properties 1–13 (pure functions) |
| DOM property tests | fast-check + jsdom or real browser harness | Properties 14, 15 |
| Token contrast check | fast-check + contrast formula | Property 16 |
| Example/unit tests | Plain JS assertions in harness | Edit mode UI flow, filter-bar default state, CSV header validation, backward compat migration |
| Edge-case tests | Plain JS assertions | Empty input, 60-char boundary, amount boundaries, invalid CSV headers |
| Smoke tests | Manual | Responsive layout, keyboard navigation, ≤200ms filter re-render |
