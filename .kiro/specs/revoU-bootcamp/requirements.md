# Requirements Document

## Introduction

This document defines the requirements for enhancing the Expense & Budget Visualizer to a bootcamp-ready standard. The app is a single-page, client-side application built with Vanilla JS, Chart.js 4.4.1, and localStorage. Current capabilities include adding and deleting expense transactions, custom categories, a monthly summary with percentage breakdown, a pie chart, and dark/light mode. The enhancements cover: income vs expense distinction, inline transaction editing, per-category budget limits, advanced list controls (filter, sort, search), CSV export/import, and accessibility and responsive design improvements.

## Glossary

- **App**: The Expense & Budget Visualizer single-page application running in the browser.
- **Transaction**: A single financial record with the fields: id, type (income or expense), name, amount, category, and date.
- **Income Transaction**: A Transaction whose type is `income`, representing money received.
- **Expense Transaction**: A Transaction whose type is `expense`, representing money spent.
- **Net Balance**: Total income amount minus total expense amount across all Transactions.
- **Budget Limit**: A maximum spending threshold set by the user for a specific Category within a calendar month.
- **Category**: A label assigned to a Transaction, sourced from the default list (`Food`, `Transport`, `Fun`) or user-defined custom categories.
- **Custom Category**: A user-defined Category persisted in localStorage under the key `ebv_custom_categories`.
- **Monthly Summary**: The aggregated view of Transactions filtered to the currently selected calendar month.
- **Active Month**: The calendar month (YYYY-MM) selected in the month picker control.
- **localStorage**: The browser's Web Storage API used for all client-side data persistence.
- **CSV**: Comma-Separated Values file format used for export and import of Transaction data.
- **Filter**: A control that restricts the Transactions list to a subset matching chosen criteria.
- **Sort**: A control that reorders the Transactions list by a chosen field and direction.
- **Search**: A text-based filter that matches the Transaction name field.
- **Validator**: The client-side logic that checks input fields before a Transaction or Category is saved.
- **BudgetGuard**: The client-side logic that computes category spending against Budget Limits and emits alerts.
- **ExportImport**: The client-side logic that serialises Transactions to CSV and parses CSV back into Transactions.

---

## Requirements

### Requirement 1: Income vs Expense Transaction Type

**User Story:** As a user, I want to mark each transaction as income or expense, so that I can track both money in and money out in one place.

#### Acceptance Criteria

1. THE App SHALL provide a transaction type selector with exactly two options: `income` and `expense`, displayed in the Add Transaction form.
2. WHEN a Transaction is saved, THE App SHALL persist the `type` field (`income` or `expense`) alongside all existing fields in localStorage.
3. THE App SHALL compute the Net Balance as total income minus total expense and display it in the balance card.
4. WHEN the Net Balance is negative, THE App SHALL render the balance value in a visually distinct color (red / danger token) to signal overspend.
5. WHEN the Net Balance is zero or positive, THE App SHALL render the balance value in the accent color.
6. THE App SHALL display separate income and expense totals in the Monthly Summary stats row alongside the existing transaction count.
7. WHEN existing Transactions in localStorage have no `type` field, THE App SHALL treat them as `expense` to preserve backward compatibility.

---

### Requirement 2: Inline Transaction Editing

**User Story:** As a user, I want to edit a saved transaction, so that I can correct mistakes without deleting and re-entering data.

#### Acceptance Criteria

1. THE App SHALL render an "Edit" button for each transaction row in the transaction list, adjacent to the existing "Delete" button.
2. WHEN the user activates the "Edit" button for a Transaction, THE App SHALL populate the Add Transaction form with that Transaction's current field values and change the form submit button label to "Save Changes".
3. WHILE a Transaction is being edited, THE App SHALL highlight the form section with a visible border or background change to indicate edit mode.
4. WHEN the user submits the form in edit mode with valid data, THE App SHALL update the existing Transaction record in place (preserving its original `id`) and persist the change to localStorage.
5. WHEN the user submits the form in edit mode with invalid data, THE Validator SHALL display an inline error message and prevent saving.
6. THE App SHALL provide a "Cancel Edit" button that, when activated, restores the form to add mode without modifying any Transaction.
7. WHEN a Transaction is saved after editing, THE App SHALL re-render all views (balance, list, chart, monthly summary) to reflect the updated data.

---

### Requirement 3: Per-Category Budget Limits

**User Story:** As a user, I want to set a monthly spending limit per category, so that I can receive an alert when I am close to or over budget.

#### Acceptance Criteria

1. THE App SHALL provide a Budget Limits section where the user can enter a numeric spending limit (in USD) for any Category.
2. WHEN the user saves a Budget Limit, THE App SHALL persist the limit keyed by category name and month (YYYY-MM) in localStorage under `ebv_budgets`.
3. THE App SHALL display each active Budget Limit alongside the corresponding category row in the Monthly Summary breakdown.
4. WHEN total expense spending for a Category in the Active Month reaches 80% or more of its Budget Limit, THE BudgetGuard SHALL display a warning indicator (⚠️ or equivalent) next to that category row.
5. WHEN total expense spending for a Category in the Active Month equals or exceeds its Budget Limit, THE BudgetGuard SHALL display an over-budget indicator (🔴 or equivalent) and render the category row amount in the danger color.
6. IF a Budget Limit value entered by the user is not a positive number, THEN THE Validator SHALL display an inline error message and prevent saving.
7. THE App SHALL allow the user to remove a Budget Limit for a Category, which deletes that entry from localStorage.

---

### Requirement 4: Transaction List Filtering, Sorting, and Search

**User Story:** As a user, I want to filter, sort, and search my transactions, so that I can quickly find and review specific entries.

#### Acceptance Criteria

1. THE App SHALL provide a search input above the transaction list that filters displayed rows to those whose Transaction name contains the search text (case-insensitive).
2. THE App SHALL provide a type filter control (All / Income / Expense) that restricts the displayed transaction rows to the selected type.
3. THE App SHALL provide a category filter dropdown populated with all available Categories plus an "All Categories" option.
4. THE App SHALL provide a sort control with options: Date (Newest First), Date (Oldest First), Amount (High to Low), Amount (Low to High).
5. WHEN any filter or sort control changes, THE App SHALL re-render the transaction list immediately without a page reload, applying all active filters and the chosen sort order together.
6. WHEN no transactions match the active filter and search criteria, THE App SHALL display a "No transactions match your search" empty state message.
7. THE App SHALL display the count of currently visible transactions alongside the list heading.
8. WHEN the search input is cleared, THE App SHALL restore the full filtered list based on the remaining active filters.

---

### Requirement 5: Data Validation and Input Quality

**User Story:** As a user, I want the app to reject invalid inputs immediately, so that my financial data stays accurate.

#### Acceptance Criteria

1. WHEN the user submits the Add / Edit Transaction form, THE Validator SHALL reject submission if the Item Name field is empty or contains only whitespace.
2. WHEN the user submits the Add / Edit Transaction form, THE Validator SHALL reject submission if the Amount field is empty, zero, negative, or non-numeric.
3. WHEN the user submits the Add / Edit Transaction form, THE Validator SHALL reject submission if the Date field is empty.
4. WHEN the user submits the Add / Edit Transaction form, THE Validator SHALL reject submission if no Category is selected.
5. WHEN the user submits the Add / Edit Transaction form, THE Validator SHALL reject submission if no transaction type is selected.
6. IF validation fails, THEN THE Validator SHALL display a specific inline error message adjacent to the offending field and set `aria-invalid="true"` on that field.
7. WHEN a previously invalid field is corrected, THE Validator SHALL remove the error message and clear `aria-invalid` before the next submission attempt.
8. THE App SHALL limit the Item Name field to a maximum of 60 characters and display a visible character counter when the user has typed 40 or more characters.

---

### Requirement 6: CSV Export and Import

**User Story:** As a user, I want to export my transactions to CSV and import from CSV, so that I can back up my data and restore it on any device.

#### Acceptance Criteria

1. THE App SHALL provide an "Export CSV" button that, when activated, triggers a browser download of all Transactions serialised as a UTF-8 CSV file named `expenses-YYYY-MM-DD.csv`.
2. THE ExportImport SHALL include a header row with the columns: `id`, `type`, `name`, `amount`, `category`, `date`.
3. THE ExportImport SHALL quote any field value that contains a comma or double-quote character, following RFC 4180 escaping rules.
4. THE App SHALL provide an "Import CSV" button that opens a file picker accepting `.csv` files.
5. WHEN the user selects a CSV file, THE ExportImport SHALL parse each row and validate that the `amount` column is a positive number and the `date` column matches the pattern `YYYY-MM-DD`.
6. WHEN all rows in the imported CSV are valid, THE ExportImport SHALL merge the imported Transactions with existing ones (skipping rows whose `id` already exists) and persist the merged set to localStorage.
7. IF any row in the imported CSV fails validation, THEN THE ExportImport SHALL display an error message listing the invalid row numbers and abort the import without modifying existing data.
8. WHEN import completes successfully, THE App SHALL re-render all views and display a success message stating how many new transactions were added.

---

### Requirement 7: Responsive Design

**User Story:** As a user, I want the app to be fully usable on mobile, tablet, and desktop screens, so that I can manage my finances from any device.

#### Acceptance Criteria

1. THE App SHALL render a single-column layout on viewports narrower than 600 px, stacking all cards vertically.
2. THE App SHALL render a two-column grid layout on viewports 600 px wide or wider, consistent with the existing `.grid` breakpoint.
3. THE App SHALL scale all touch targets (buttons, inputs, selects) to a minimum height and width of 44 px on viewports narrower than 600 px.
4. THE App SHALL ensure no horizontal scrollbar appears on viewports as narrow as 320 px.
5. THE App SHALL render the transaction list with a maximum height and internal scroll so it does not cause the page to stretch on small screens.
6. WHILE a viewport narrower than 600 px is active, THE App SHALL hide the pie chart's legend text labels and show only color swatches to preserve space.

---

### Requirement 8: Accessibility

**User Story:** As a user relying on assistive technology, I want the app to be navigable and understandable with a keyboard and screen reader, so that I have equal access to all features.

#### Acceptance Criteria

1. THE App SHALL assign a unique, descriptive `aria-label` or visible `<label>` element to every interactive control (inputs, selects, buttons).
2. THE App SHALL ensure all interactive elements are reachable and operable using the keyboard Tab and Enter/Space keys in a logical document order.
3. WHEN an error message is displayed, THE App SHALL set `role="alert"` and `aria-live="polite"` on the error container so screen readers announce the message.
4. THE App SHALL maintain a color contrast ratio of at least 4.5:1 between text and background for all text elements in both light and dark themes.
5. THE App SHALL provide a visible focus indicator (outline) on all interactive elements when focused via keyboard, using the existing `focus-visible` CSS pattern.
6. WHEN dynamic content (transaction list, monthly summary, chart) updates, THE App SHALL update the `aria-label` of the canvas element to include a text summary of the current data so screen readers can convey chart information.
7. THE App SHALL use semantic HTML elements (`<main>`, `<section>`, `<header>`, `<h1>`–`<h3>`, `<ul>`, `<li>`) consistently throughout the document.
