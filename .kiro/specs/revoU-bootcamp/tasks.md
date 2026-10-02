# Implementation Plan: revoU-bootcamp — Expense & Budget Visualizer Enhancements

## Overview

Incrementally extend the existing Vanilla JS IIFE in `js/app.js`, the markup in `index.html`, and styles in `css/style.css` to add: income/expense type distinction, inline editing, per-category budget limits, filter/sort/search, improved validation, CSV export/import, responsive design fixes, accessibility improvements, and a fast-check property-based test harness in `test.html`. Each task targets a distinct slice of work; later tasks wire earlier slices together.

---

## Tasks

- [ ] 1. Data model — extend constants, keys, and legacy migration
  - [ ] 1.1 Add `KEY.budgets = 'ebv_budgets'` to the `KEY` constant object and declare `let budgets = load(KEY.budgets, {})` in `§1 Constants & State`
    - Also declare `let filterState = { type: '', category: '', search: '', sort: 'date-desc' }` and `let activeEditId = null`
    - _Requirements: 3.1, 1.2_

  - [ ] 1.2 Implement `migrateLegacy(txArray)` pure function in `§3 Helpers`
    - Maps any transaction missing a `type` field to `{ ...t, type: 'expense' }` (see design §5.1)
    - Call `migrateLegacy()` at init (`§12`) and save back to `KEY.tx` only when at least one row was changed
    - _Requirements: 1.7_

  - [ ]* 1.3 Write property test for `migrateLegacy`
    - **Property: Any transaction array passed through `migrateLegacy` has every element with a `type` field equal to `"income"` or `"expense"`**
    - **Validates: Requirements 1.7**

- [ ] 2. CSS — new design tokens and component styles
  - [ ] 2.1 Add new CSS custom properties to `:root` and `[data-theme="dark"]` in `css/style.css`
    - Add `--success`, `--warning`, `--warning-bg`, `--danger-bg`, `--income`, `--expense` tokens (see design §3.1)
    - _Requirements: 1.4, 3.4, 3.5_

  - [ ] 2.2 Add type-selector fieldset styles, transaction amount color classes, and balance sign color rules
    - `.type-selector`, `.radio-label`, `.tx-amount.income`, `.tx-amount.expense`, `.balance-value.positive/.negative/.zero` (design §3.2, §3.3, §3.10)
    - _Requirements: 1.1, 1.4, 1.5_

  - [ ] 2.3 Add inline-edit styles, budget-list styles, filter-bar styles, and export/import bar styles
    - `.tx-edit-row`, `.tx-edit-actions`, `.btn.secondary`, `.budget-list`, `.budget-item`, `.budget-bar`, `.budget-fill`, `.budget-badge`, `.filter-bar`, `.io-bar` (design §3.4–§3.7)
    - _Requirements: 2.2, 3.3, 4.1_

  - [ ] 2.4 Add responsive overrides and global touch-target rules
    - `@media (max-width: 599px)` block with `.tx-list` max-height and `.chart-legend-text` hide rule; global 44 px min-height/min-width rule (design §3.8, §3.9)
    - _Requirements: 7.3, 7.5, 7.6_

- [ ] 3. HTML structure — add new form controls and sections
  - [ ] 3.1 Add the transaction-type `<fieldset>` with income/expense radio buttons inside `#tx-form`, before the `item-name` label
    - Add `<fieldset class="type-selector" id="tx-type-group">` with two radio inputs as shown in design §2.1
    - _Requirements: 1.1_

  - [ ] 3.2 Add the filter/sort/search toolbar to the Transactions section and update the Transactions `<section>` wrapper
    - Replace the existing bare `<section class="card">` wrapping `#tx-list` with the full filter-bar markup from design §2.4
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 3.3 Add the Budget Limits `<section>` after Custom Categories and before Monthly Summary
    - Insert the `#budget-section` markup from design §2.3 into `index.html`
    - _Requirements: 3.1_

  - [ ] 3.4 Add the Export / Import `<section>` before the closing `</main>` tag
    - Insert the `#data-io` section from design §2.5; include `#import-status` with `aria-live="polite"`
    - _Requirements: 6.1, 6.4_

  - [ ] 3.5 Add DOM element references for all new elements in the `el` object (`§2 DOM Element References`)
    - New refs: `txTypeGroup`, `searchInput`, `filterType`, `filterCategory`, `sortSelect`, `listCount`, `budgetSection`, `budgetCategory`, `budgetAmount`, `budgetError`, `budgetList`, `exportBtn`, `importInput`, `importStatus`, `nameCounter`
    - _Requirements: 1.1, 3.1, 4.1, 6.1_

- [ ] 4. Checkpoint — verify HTML renders without JS errors
  - Open `index.html` in a browser; confirm the page loads, all new sections are visible, and the console shows no parse errors.

- [ ] 5. Income / expense type feature (`§1`, `§6`, `§10`)
  - [ ] 5.1 Implement `getNetBalance(txArray)` helper in `§3` — returns `Σincome − Σexpense` (design §5.2)
    - _Requirements: 1.3_

  - [ ]* 5.2 Write property test for `getNetBalance`
    - **Property 1: Net balance formula — for any list of transactions, net balance equals sum of income minus sum of expense amounts**
    - **Validates: Requirements 1.1, 1.2, 1.3**

  - [ ] 5.3 Extend the form submit listener in `§6` to read the `tx-type` radio value and include `type` on the saved transaction object
    - _Requirements: 1.1, 1.2_

  - [ ] 5.4 Update `renderBalance()` in `§10` to call `getNetBalance()` and apply `.positive`, `.negative`, or `.zero` CSS class to `#total-balance`
    - _Requirements: 1.3, 1.4, 1.5_

  - [ ] 5.5 Update `renderList()` in `§10` to add a type badge (`income`/`expense`) to each list item and apply `.tx-amount.income` / `.tx-amount.expense` class to the amount span
    - _Requirements: 1.1_

  - [ ] 5.6 Update `renderMonthly()` in `§10` to show separate income and expense totals in the stats row (`#m-income`, `#m-expense` elements added to HTML)
    - Add two new `<div>` stat tiles for income and expense totals in the `.stats` grid in `index.html`
    - _Requirements: 1.6_

  - [ ] 5.7 Update `totalsByCategory()` or add a companion helper to only sum `expense` transactions (for chart and budget calculations)
    - _Requirements: 1.3, 3.2_

- [ ] 6. Inline transaction editing (`§7`)
  - [ ] 6.1 Implement `enterEditMode(id)` in `§7`
    - If `activeEditId !== null`, call `cancelEdit()` first
    - Replace the `<li>` content with an edit form (`.tx-edit-row`) pre-filled with the transaction's current values; auto-focus first input
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 6.2 Write property test for edit pre-population
    - **Property 2: Edit mode pre-populates with existing data — entering edit mode on any transaction results in input fields equal to the transaction's current field values**
    - **Validates: Requirements 2.2**

  - [ ] 6.3 Implement `saveEdit(id)` in `§7`
    - Read input values, call `validateTxFields()`, show field errors on failure; on success update the transaction in-place preserving `id`, save to localStorage, set `activeEditId = null`, call `renderAll()`
    - _Requirements: 2.4, 2.5, 2.7_

  - [ ] 6.4 Implement `cancelEdit()` in `§7`
    - Set `activeEditId = null` and call `renderList()` to restore original row
    - _Requirements: 2.6_

  - [ ]* 6.5 Write property test for cancel-edit identity
    - **Property 3: Cancel edit is identity — invoking edit mode on any transaction T and immediately cancelling leaves T with all original field values unchanged**
    - **Validates: Requirements 2.3**

  - [ ] 6.6 Add an "Edit" button to each transaction row in `renderList()` that calls `enterEditMode(id)`; wire Save and Cancel buttons rendered by `enterEditMode()` to their handlers
    - _Requirements: 2.1, 2.4, 2.6_

- [ ] 7. Budget limits with progress bars and badges (`§8`)
  - [ ] 7.1 Implement `budgetStatusFor(cat, spend, budgets)` pure function in `§3` (design §5.4)
    - Returns `"ok"`, `"warning"`, or `"danger"` based on thresholds 80% and 100%
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [ ]* 7.2 Write property test for `budgetStatusFor`
    - **Property 5: Budget status thresholds — for any limit L > 0 and spend S ≥ 0, the function returns the correct status tier**
    - **Validates: Requirements 3.2, 3.3**

  - [ ] 7.3 Wire `#budget-form` submit listener in `§8`
    - Validate: category selected, amount is a positive number in range; on success save to `budgets[cat] = value`, persist to `KEY.budgets`, call `renderBudgets()` and `renderMonthly()`
    - _Requirements: 3.1, 3.6_

  - [ ] 7.4 Implement `renderBudgets()` in `§10`
    - Populate `#budget-category` select from `allCats()`; render `#budget-list` with `.budget-item` rows showing category name, current month's expense spend, budget limit, a progress bar (`.budget-fill`), and a `.budget-badge` with `.ok`/`.warning`/`.danger` class
    - Include a remove button per item that deletes the budget entry and re-renders
    - _Requirements: 3.3, 3.7_

  - [ ]* 7.5 Write property test for budget persistence round-trip
    - **Property 4: Budget persistence round-trip — setting budget for category C to value V and loading from localStorage produces V for key C**
    - **Validates: Requirements 3.1**

  - [ ] 7.6 Update `renderMonthly()` to show the budget badge and limit alongside each category row in `#m-breakdown`
    - _Requirements: 3.3, 3.4, 3.5_

  - [ ] 7.7 Update `renderCategories()` to also populate `#budget-category` and `#filter-category` selects
    - _Requirements: 3.1, 4.3_

- [ ] 8. Checkpoint — verify balance, edit, and budget features work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Filter / sort / search (`§9`)
  - [ ] 9.1 Implement `filteredSortedTx(txArray, filterState)` pure function in `§3` (design §5.3)
    - Applies type, category, and text-search filters, then sorts by date or amount in asc/desc direction
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 9.2 Write property test for type filter
    - **Property 6: Type filter returns only matching transactions — every transaction in the filtered result has `type` equal to the filter value**
    - **Validates: Requirements 4.1**

  - [ ]* 9.3 Write property test for category filter
    - **Property 7: Category filter returns only matching transactions — every transaction in the filtered result has `category` equal to the filter value**
    - **Validates: Requirements 4.2**

  - [ ]* 9.4 Write property test for text search
    - **Property 8: Text search matches are case-insensitive substrings — every transaction name in the result contains the query as a lowercase substring**
    - **Validates: Requirements 4.3**

  - [ ]* 9.5 Write property test for sort ordering
    - **Property 9: Sort produces a correctly ordered sequence — for any list and any sort option, every adjacent pair satisfies the monotonic order invariant**
    - **Validates: Requirements 4.4**

  - [ ] 9.6 Wire filter/sort/search event listeners in `§9`
    - Attach `input`/`change` handlers to `#search-input`, `#filter-type`, `#filter-category`, `#sort-select`; each handler updates `filterState` and calls `renderList()`
    - _Requirements: 4.5_

  - [ ] 9.7 Update `renderList()` in `§10` to pass `filteredSortedTx(transactions, filterState)` as the source array
    - Show the count of visible transactions in `#list-count` (add `<span id="list-count">` next to the Transactions `<h2>` in HTML)
    - Show `#list-empty` with "No transactions match your search" text when the filtered array is empty
    - _Requirements: 4.5, 4.6, 4.7, 4.8_

- [ ] 10. Validation improvements (`§6`, `§7`)
  - [ ] 10.1 Implement `validateTxFields({ type, name, amount, category, date })` in `§3` (design §5.8)
    - Returns an error string or `null`; checks type enum, name length 1–60, amount range, non-empty category, YYYY-MM-DD date pattern
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 10.2 Write property test for `validateTxFields`
    - **Property 10: Valid transactions are accepted without errors — for any valid combination of type, name (1–60 chars), amount (0.01–999,999,999.99), non-empty category, and valid date, `validateTxFields` returns `null`**
    - **Validates: Requirements 5.4**

  - [ ] 10.3 Update the Add Transaction form submit handler and `saveEdit()` to use `validateTxFields()` and set `aria-invalid="true"` on offending fields; clear `aria-invalid` when the field is corrected
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ] 10.4 Add a character counter `<span id="name-counter" aria-live="polite">` below `#item-name` in `index.html`; wire an `input` listener to update it and show only when ≥ 40 characters have been typed
    - _Requirements: 5.8_

- [ ] 11. CSV export / import (`§11`)
  - [ ] 11.1 Implement `buildCSVRow(fields)` and `parseCSVRow(line)` RFC 4180 helpers in `§3` (design §5.5, §5.6)
    - _Requirements: 6.2, 6.3_

  - [ ]* 11.2 Write property test for CSV serialisation round-trip
    - **Property 11: CSV serialisation round-trip — for any list of transactions, building a CSV and parsing it back produces objects with fields equal to the originals (amounts within float tolerance)**
    - **Validates: Requirements 6.1**

  - [ ] 11.3 Implement `exportCSV()` in `§11`
    - Build CSV string with header `id,type,name,amount,category,date`, format amounts to 2 decimal places; trigger download via `URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))` with filename `expenses-YYYY-MM-DD.csv`
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 11.4 Implement `importCSV(text)` in `§11` (design §5.7)
    - Split lines, validate header, validate each data row with `validateTxFields()`; collect errors per row; merge only valid rows whose `id` does not already exist; save; call `renderAll()`; return `{ imported, errors }`
    - _Requirements: 6.5, 6.6, 6.7, 6.8_

  - [ ]* 11.5 Write property test for import idempotency
    - **Property 12: Import merge is idempotent — importing the same CSV twice produces a transaction list with the same set of unique `id` values as importing it once**
    - **Validates: Requirements 6.2**

  - [ ]* 11.6 Write property test for partial CSV import
    - **Property 13: Partial CSV import tolerates bad rows — for any CSV with a mix of valid and invalid rows, `importCSV` imports all valid rows and returns exactly one error entry per invalid row without throwing**
    - **Validates: Requirements 6.3**

  - [ ] 11.7 Wire `#export-btn` click and `#import-input` change listeners in `§11`
    - Export listener calls `exportCSV()`; import listener reads `FileReader.readAsText`, calls `importCSV(text)`, shows success or error messages in `#import-status`
    - _Requirements: 6.1, 6.4, 6.7, 6.8_

- [ ] 12. Checkpoint — verify filter/sort/search and CSV features work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Accessibility improvements (`§9`, `§10`)
  - [ ] 13.1 Add `aria-live="polite"` to `#tx-list` and verify all error containers have `role="alert"` in `index.html`
    - _Requirements: 8.3_

  - [ ] 13.2 Update `renderChart()` to set a dynamic `aria-label` on `#chart` that summarises top categories and their formatted amounts (e.g. `"Pie chart: Food $320.00 (45%), Transport $180.00 (25%)"`)
    - _Requirements: 8.6_

  - [ ]* 13.3 Write property test for chart aria-label
    - **Property 15: Chart `aria-label` contains category and amount data — after `renderChart()`, the `aria-label` of `#chart` contains the name and formatted amount of each category in the transaction data**
    - **Validates: Requirements 8.3**

  - [ ] 13.4 Verify every new interactive control added in tasks 3 and 7 has a `<label>` or `aria-label`; fix any missing associations
    - _Requirements: 8.1_

  - [ ] 13.5 Implement `contrastRatio(fg, bg)` helper in the test harness (not in `app.js`); write a test that asserts `--text`/`--bg` and `--text`/`--card` token pairs in both themes yield ≥ 4.5 contrast ratio
    - _Requirements: 8.4_

  - [ ]* 13.6 Write property test for WCAG AA color contrast
    - **Property 16: Color token contrast ratios meet WCAG AA — for each foreground/background token pair, `contrastRatio(fg, bg)` returns ≥ 4.5 in both light and dark themes**
    - **Validates: Requirements 8.1**

- [ ] 14. Property-based test harness (`test.html`)
  - [ ] 14.1 Create `test.html` at the workspace root
    - Load fast-check via CDN (`https://cdn.jsdelivr.net/npm/fast-check/lib/bundle/fast-check.min.js`), provide a `<div id="results">` for output, and include a `<script>` block that imports and exercises the pure helper functions extracted from the IIFE
    - Pure functions to expose for testing: `migrateLegacy`, `getNetBalance`, `filteredSortedTx`, `budgetStatusFor`, `parseCSVRow`, `buildCSVRow`, `validateTxFields`, `contrastRatio`
    - Wrap each function in an exported or module-level namespace (`window.EBV`) so the test harness can reference them without a bundler
    - _Requirements: (all property tests above)_

  - [ ] 14.2 Implement property tests for Properties 1–13 in `test.html` using `fc.assert(fc.property(...))`
    - Each property maps to a sub-task in tasks 1–11 above (see `*`-marked sub-tasks)
    - Display pass/fail counts in `#results` using a plain `console.log` redirect or a minimal table renderer
    - _Requirements: 1.1–6.3_

  - [ ]* 14.3 Write DOM-level property tests for touch-target sizes (Property 14)
    - **Property 14: Interactive elements meet touch-target size — every button, select, input, and radio label bounding rect has height and width ≥ 44 px**
    - **Validates: Requirements 7.3**

- [ ] 15. Final checkpoint — full regression
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; they represent property/unit tests only
- Each task references specific requirements clauses from `requirements.md` for traceability
- The IIFE section numbers (§1–§12) match the design document's `§4 IIFE Internal Structure` map
- `window.EBV` namespace in task 14.1 is the pattern that lets the test harness call pure functions without a bundler or `<script type="module">`
- All new `<section>` and form elements should be inserted in the order described in `design.md §2` to preserve logical tab order
- The `filterState` variable (task 1.1) drives both `renderList()` (task 9.7) and is reset to defaults when all filter controls are cleared

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["1.2", "2.2", "2.3", "2.4"] },
    { "id": 2, "tasks": ["1.3", "3.1", "3.2", "3.3", "3.4"] },
    { "id": 3, "tasks": ["3.5", "5.1", "7.1", "9.1", "10.1", "11.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "7.2", "9.2", "9.3", "9.4", "9.5", "10.2", "11.2"] },
    { "id": 5, "tasks": ["5.4", "5.5", "5.6", "5.7", "6.1", "7.3", "9.6", "10.3", "10.4", "11.3"] },
    { "id": 6, "tasks": ["6.2", "6.3", "7.4", "7.5", "9.7", "11.4"] },
    { "id": 7, "tasks": ["6.4", "6.5", "7.6", "7.7", "11.5", "11.6", "13.1", "13.2"] },
    { "id": 8, "tasks": ["6.6", "11.7", "13.3", "13.4", "13.5"] },
    { "id": 9, "tasks": ["13.6", "14.1"] },
    { "id": 10, "tasks": ["14.2", "14.3"] }
  ]
}
```
