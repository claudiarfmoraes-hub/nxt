# NXT Lojas Dash — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete store management system (stock + sales) with Firebase backend, role-based access, real-time inventory, and reporting — replacing the current NXT APP.

**Architecture:** Vanilla JS modular SPA with Firebase (Auth + Firestore + Cloud Functions + Hosting). Real-time stock via Firestore onSnapshot. Sales integrated with Bling ERP (via Vercel proxy), Make.com webhooks, and Cloud Run. CSS with design tokens for NXT dark theme.

**Tech Stack:** Vanilla JS (ES6+), Firebase 9.x (compat), jsPDF, html2canvas, Inter font, CSS custom properties.

**Spec:** `docs/superpowers/specs/2026-04-07-nxtlojas-dash-design.md`

---

## Phase 1: Infrastructure & Auth

### Task 1: Create repository and project structure

**Files:**
- Create: `index.html`
- Create: `css/variables.css`
- Create: `css/base.css`
- Create: `css/components.css`
- Create: `css/pages.css`
- Create: `js/app.js`
- Create: `js/firebase-init.js`
- Create: `js/ui.js`
- Create: `js/utils.js`
- Create: `manifest.json`
- Create: `firebase.json`
- Create: `.firebaserc`
- Create: `.gitignore`
- Copy: `dados/lojas.json` (from nxt-app/app/dados/)
- Copy: `dados/produtos.json` (from nxt-app/app/dados/)
- Copy: `dados/vendedores_json.json` (from nxt-app/app/dados/)
- Copy: `dados/produtos-fiscal.json` (from nxt-app/app/dados/)
- Copy: `assets/logo-nxt.svg` (or logo nxt.png from app)

- [ ] **Step 1: Create GitHub repo**

```bash
cd /c/dev/NXT
mkdir nxtlojas-dash
cd nxtlojas-dash
git init
```

- [ ] **Step 2: Create .gitignore**

```
node_modules/
.env
.env.local
nul
```

- [ ] **Step 3: Create directory structure**

```bash
mkdir -p css js dados assets functions
```

- [ ] **Step 4: Copy data files from APP live**

```bash
cp /c/dev/NXT/ativos/nxt-app/app/dados/lojas.json dados/
cp /c/dev/NXT/ativos/nxt-app/app/dados/produtos.json dados/
cp /c/dev/NXT/ativos/nxt-app/app/dados/vendedores_json.json dados/
cp /c/dev/NXT/ativos/nxt-app/app/dados/produtos-fiscal.json dados/
cp "/c/dev/NXT/ativos/nxt-app/app/logo nxt.png" assets/logo-nxt.png
```

- [ ] **Step 5: Create firebase.json**

```json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  },
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**",
      "functions/**",
      "docs/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

- [ ] **Step 6: Create .firebaserc**

```json
{
  "projects": {
    "default": "nxt-plus"
  }
}
```

- [ ] **Step 7: Create css/variables.css**

Design tokens for the NXT dark professional theme:

```css
:root {
  /* Colors */
  --bg-primary: #0d0d0d;
  --bg-secondary: #161616;
  --bg-card: #1c1c1c;
  --bg-input: #222222;
  --bg-hover: #2a2a2a;
  --border: #2e2e2e;
  --border-focus: #C6FF00;

  --text-primary: #f0f0f0;
  --text-secondary: #8a8a8a;
  --text-muted: #555555;

  --accent: #C6FF00;
  --accent-hover: #d4ff33;
  --accent-muted: rgba(198, 255, 0, 0.15);

  --danger: #e53935;
  --danger-muted: rgba(229, 57, 53, 0.15);
  --warning: #f9a825;
  --warning-muted: rgba(249, 168, 37, 0.15);
  --success: #43a047;
  --success-muted: rgba(67, 160, 71, 0.15);

  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-xs: 0.6875rem;
  --font-sm: 0.8125rem;
  --font-base: 0.9375rem;
  --font-lg: 1.125rem;
  --font-xl: 1.5rem;
  --font-2xl: 2rem;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Spacing */
  --space-2xs: 0.125rem;
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;

  /* Borders */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.4);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.5);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;

  /* Z-index */
  --z-dropdown: 100;
  --z-modal-backdrop: 200;
  --z-modal: 300;
  --z-toast: 400;

  /* Stock indicators */
  --stock-ok: var(--success);
  --stock-low: var(--warning);
  --stock-zero: var(--danger);
}
```

- [ ] **Step 8: Create css/base.css**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-text-size-adjust: 100%;
}

body {
  font-family: var(--font-family);
  font-size: var(--font-base);
  font-weight: var(--font-weight-normal);
  line-height: 1.5;
  color: var(--text-primary);
  background-color: var(--bg-primary);
  min-height: 100vh;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  color: var(--accent);
  text-decoration: none;
}

a:hover {
  color: var(--accent-hover);
}

img {
  max-width: 100%;
  display: block;
}

table {
  width: 100%;
  border-collapse: collapse;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: var(--bg-primary);
}

::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: var(--radius-full);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

/* Layout */
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-lg);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  height: 56px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.app-nav {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 0 var(--space-lg);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
}

.app-main {
  flex: 1;
  padding: var(--space-lg);
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

/* Mobile */
@media (max-width: 768px) {
  .app-header {
    padding: var(--space-sm) var(--space-md);
  }

  .app-nav {
    padding: 0 var(--space-md);
  }

  .app-main {
    padding: var(--space-md);
  }
}
```

- [ ] **Step 9: Create css/components.css**

```css
/* ========================================
   BUTTONS
   ======================================== */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  font-family: var(--font-family);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-medium);
  line-height: 1;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  user-select: none;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--accent);
  color: var(--bg-primary);
  border-color: var(--accent);
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border-color: var(--border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: var(--text-muted);
}

.btn-danger {
  background: var(--danger);
  color: white;
  border-color: var(--danger);
}

.btn-danger:hover:not(:disabled) {
  opacity: 0.85;
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: none;
  padding: var(--space-xs) var(--space-sm);
}

.btn-ghost:hover:not(:disabled) {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.btn-sm {
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-xs);
}

.btn-lg {
  padding: var(--space-md) var(--space-lg);
  font-size: var(--font-base);
}

/* ========================================
   INPUTS
   ======================================== */

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.form-label {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  font-family: var(--font-family);
  font-size: var(--font-base);
  color: var(--text-primary);
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast);
  outline: none;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: var(--border-focus);
}

.form-input::placeholder {
  color: var(--text-muted);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-md);
}

.form-hint {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.form-error {
  font-size: var(--font-xs);
  color: var(--danger);
}

/* ========================================
   CARDS
   ======================================== */

.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
}

.card-title {
  font-size: var(--font-lg);
  font-weight: var(--font-weight-semibold);
}

/* Stock card with left indicator bar */
.stock-card {
  position: relative;
  padding-left: calc(var(--space-lg) + 4px);
}

.stock-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: var(--radius-lg) 0 0 var(--radius-lg);
}

.stock-card--ok::before { background: var(--stock-ok); }
.stock-card--low::before { background: var(--stock-low); }
.stock-card--zero::before { background: var(--stock-zero); }

/* ========================================
   TABLES
   ======================================== */

.table-container {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  padding: var(--space-sm) var(--space-md);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  text-align: left;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
}

.table td {
  padding: var(--space-sm) var(--space-md);
  font-size: var(--font-sm);
  border-bottom: 1px solid var(--border);
}

.table tr:nth-child(even) td {
  background: rgba(255,255,255,0.02);
}

.table tr:hover td {
  background: var(--bg-hover);
}

/* ========================================
   TABS / NAV
   ======================================== */

.nav-tab {
  padding: var(--space-sm) var(--space-md);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.nav-tab:hover {
  color: var(--text-primary);
}

.nav-tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

/* ========================================
   BADGES
   ======================================== */

.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-2xs) var(--space-sm);
  font-size: var(--font-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.badge-accent {
  background: var(--accent-muted);
  color: var(--accent);
}

.badge-success {
  background: var(--success-muted);
  color: var(--success);
}

.badge-warning {
  background: var(--warning-muted);
  color: var(--warning);
}

.badge-danger {
  background: var(--danger-muted);
  color: var(--danger);
}

/* ========================================
   MODALS
   ======================================== */

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal-backdrop);
  padding: var(--space-md);
}

.modal-backdrop.open {
  display: flex;
}

.modal {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  z-index: var(--z-modal);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border);
}

.modal-title {
  font-size: var(--font-lg);
  font-weight: var(--font-weight-semibold);
}

.modal-body {
  padding: var(--space-lg);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  padding: var(--space-lg);
  border-top: 1px solid var(--border);
}

/* ========================================
   TOASTS
   ======================================== */

.toast-container {
  position: fixed;
  top: var(--space-lg);
  right: var(--space-lg);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.toast {
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-md);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-medium);
  box-shadow: var(--shadow-md);
  animation: toast-in 250ms ease;
  max-width: 400px;
}

.toast-success {
  background: var(--success);
  color: white;
}

.toast-error {
  background: var(--danger);
  color: white;
}

.toast-warning {
  background: var(--warning);
  color: var(--bg-primary);
}

.toast-info {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

@keyframes toast-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* ========================================
   LOADING
   ======================================== */

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 600ms linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  flex-direction: column;
  gap: var(--space-md);
  color: var(--text-primary);
}

.loading-overlay.active {
  display: flex;
}

/* ========================================
   EMPTY STATE
   ======================================== */

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
  color: var(--text-muted);
  text-align: center;
}

.empty-state-title {
  font-size: var(--font-lg);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  margin-bottom: var(--space-xs);
}

.empty-state-text {
  font-size: var(--font-sm);
}
```

- [ ] **Step 10: Create css/pages.css**

```css
/* ========================================
   LOGIN PAGE
   ======================================== */

.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-lg);
}

.login-box {
  width: 100%;
  max-width: 380px;
}

.login-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-xl);
}

.login-logo img {
  height: 48px;
  margin-right: var(--space-sm);
}

.login-logo h1 {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-bold);
  color: var(--accent);
}

.login-subtitle {
  text-align: center;
  color: var(--text-secondary);
  font-size: var(--font-sm);
  margin-bottom: var(--space-xl);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.login-error {
  display: none;
  padding: var(--space-sm) var(--space-md);
  background: var(--danger-muted);
  color: var(--danger);
  font-size: var(--font-sm);
  border-radius: var(--radius-md);
  text-align: center;
}

.login-error.visible {
  display: block;
}

/* ========================================
   STOCK PAGE
   ======================================== */

.stock-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-md);
}

.stock-card .stock-model {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-base);
}

.stock-card .stock-color {
  color: var(--text-secondary);
  font-size: var(--font-sm);
}

.stock-card .stock-qty {
  font-size: var(--font-2xl);
  font-weight: var(--font-weight-bold);
  margin: var(--space-sm) 0;
}

.stock-card .stock-updated {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

/* Stock page toolbar */
.stock-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
}

.stock-summary {
  display: flex;
  gap: var(--space-lg);
}

.stock-summary-item {
  text-align: center;
}

.stock-summary-value {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-bold);
}

.stock-summary-label {
  font-size: var(--font-xs);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ========================================
   SALES PAGE
   ======================================== */

.sale-form-section {
  margin-bottom: var(--space-lg);
}

.sale-form-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  user-select: none;
}

.sale-form-section-header h3 {
  font-size: var(--font-base);
  font-weight: var(--font-weight-semibold);
}

.sale-form-section-body {
  padding: var(--space-lg);
  border: 1px solid var(--border);
  border-top: none;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
}

.sale-form-section.collapsed .sale-form-section-body {
  display: none;
}

/* Progress bar */
.sale-progress {
  display: flex;
  gap: var(--space-xs);
  margin-bottom: var(--space-lg);
}

.sale-progress-step {
  flex: 1;
  height: 4px;
  background: var(--border);
  border-radius: var(--radius-full);
  transition: background var(--transition-base);
}

.sale-progress-step.active {
  background: var(--accent);
}

/* Products list */
.product-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-sm);
}

/* Payment cards */
.payment-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: var(--space-sm);
}

.payment-option {
  padding: var(--space-md);
  text-align: center;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-sm);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-fast);
}

.payment-option.selected {
  border-color: var(--accent);
  background: var(--accent-muted);
  color: var(--accent);
}

/* Sale footer */
.sale-footer {
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
}

.sale-total {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-bold);
}

.sale-total-label {
  font-size: var(--font-xs);
  color: var(--text-secondary);
  text-transform: uppercase;
}

/* ========================================
   REPORTS PAGE
   ======================================== */

.report-filters {
  display: flex;
  align-items: flex-end;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
}

.report-section {
  margin-bottom: var(--space-2xl);
}

.report-section-title {
  font-size: var(--font-lg);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--border);
}

/* ========================================
   ADMIN PAGE
   ======================================== */

.admin-section {
  margin-bottom: var(--space-2xl);
}

.admin-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.admin-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.admin-list-item-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.admin-list-item-name {
  font-weight: var(--font-weight-semibold);
}

.admin-list-item-detail {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

.admin-list-item-actions {
  display: flex;
  gap: var(--space-sm);
}
```

- [ ] **Step 11: Create js/utils.js**

```javascript
// ========================================
// VALIDATIONS
// ========================================

function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    for (let t = 9; t < 11; t++) {
        let soma = 0;
        for (let i = 0; i < t; i++) {
            soma += parseInt(cpf[i]) * ((t + 1) - i);
        }
        let resto = (soma * 10) % 11;
        if (resto === 10) resto = 0;
        if (resto !== parseInt(cpf[t])) return false;
    }
    return true;
}

// ========================================
// MASKS
// ========================================

function aplicarMascaraTelefone(input) {
    input.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        if (value.length > 10) {
            value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
        } else if (value.length > 6) {
            value = value.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
        } else if (value.length > 2) {
            value = value.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
        }
        e.target.value = value;
    });
}

function aplicarMascaraCPF(input) {
    input.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        if (value.length > 9) {
            value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})$/, '$1.$2.$3-$4');
        } else if (value.length > 6) {
            value = value.replace(/^(\d{3})(\d{3})(\d{0,3})$/, '$1.$2.$3');
        } else if (value.length > 3) {
            value = value.replace(/^(\d{3})(\d{0,3})$/, '$1.$2');
        }
        e.target.value = value;
    });
}

function aplicarMascaraCNPJ(input) {
    input.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 14) value = value.slice(0, 14);
        if (value.length > 12) {
            value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})$/, '$1.$2.$3/$4-$5');
        } else if (value.length > 8) {
            value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})$/, '$1.$2.$3/$4');
        } else if (value.length > 5) {
            value = value.replace(/^(\d{2})(\d{3})(\d{0,3})$/, '$1.$2.$3');
        } else if (value.length > 2) {
            value = value.replace(/^(\d{2})(\d{0,3})$/, '$1.$2');
        }
        e.target.value = value;
    });
}

function aplicarMascaraCEP(input) {
    input.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 8) value = value.slice(0, 8);
        if (value.length > 5) {
            value = value.replace(/^(\d{5})(\d{0,3})$/, '$1-$2');
        }
        e.target.value = value;
    });
}

function aplicarMascaraMonetario(input) {
    input.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = (parseInt(value) / 100).toFixed(2);
        if (isNaN(value) || value === 'NaN') value = '0.00';
        e.target.value = formatarMoeda(parseFloat(value));
    });
}

// ========================================
// FORMATTING
// ========================================

function formatarMoeda(valor) {
    if (typeof valor !== 'number' || isNaN(valor)) return '0,00';
    return valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function parseMoeda(str) {
    if (!str) return 0;
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
}

// ========================================
// CEP LOOKUP
// ========================================

async function buscarCEP(cep) {
    cep = cep.replace(/\D/g, '');
    if (cep.length !== 8) return null;

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        if (!response.ok) return null;
        const data = await response.json();
        if (data.erro) return null;
        return {
            rua: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            estado: data.uf || ''
        };
    } catch {
        return null;
    }
}

// ========================================
// DATE HELPERS
// ========================================

function formatarData(date) {
    return new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function formatarDataHora(date) {
    return new Date(date).toLocaleString('pt-BR');
}

function dataHoje() {
    return new Date().toISOString().split('T')[0];
}
```

- [ ] **Step 12: Create js/ui.js**

```javascript
// ========================================
// TOAST NOTIFICATIONS
// ========================================

let toastContainer = null;

function initToasts() {
    toastContainer = document.getElementById('toastContainer');
}

function toast(message, type = 'info', duration = 3000) {
    if (!toastContainer) return;

    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    toastContainer.appendChild(el);

    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateX(100%)';
        el.style.transition = 'all 300ms ease';
        setTimeout(() => el.remove(), 300);
    }, duration);
}

function toastSuccess(msg) { toast(msg, 'success'); }
function toastError(msg) { toast(msg, 'error', 5000); }
function toastWarning(msg) { toast(msg, 'warning', 4000); }
function toastInfo(msg) { toast(msg, 'info'); }

// ========================================
// MODALS
// ========================================

function openModal(id) {
    const backdrop = document.getElementById(id);
    if (backdrop) backdrop.classList.add('open');
}

function closeModal(id) {
    const backdrop = document.getElementById(id);
    if (backdrop) backdrop.classList.remove('open');
}

function initModals() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-backdrop')) {
            e.target.classList.remove('open');
        }
        if (e.target.classList.contains('modal-close')) {
            const backdrop = e.target.closest('.modal-backdrop');
            if (backdrop) backdrop.classList.remove('open');
        }
    });
}

// ========================================
// LOADING OVERLAY
// ========================================

function showLoading(message = 'Carregando...') {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.querySelector('.loading-text').textContent = message;
        overlay.classList.add('active');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('active');
}

// ========================================
// TABS
// ========================================

function initTabs() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const targetId = this.dataset.tab;
            switchTab(targetId);
        });
    });
}

function switchTab(tabId) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-page').forEach(p => p.style.display = 'none');

    const tab = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
    const page = document.getElementById(tabId);

    if (tab) tab.classList.add('active');
    if (page) page.style.display = 'block';
}

// ========================================
// COLLAPSIBLE SECTIONS
// ========================================

function initCollapsibles() {
    document.querySelectorAll('.sale-form-section-header').forEach(header => {
        header.addEventListener('click', function() {
            this.closest('.sale-form-section').classList.toggle('collapsed');
        });
    });
}
```

- [ ] **Step 13: Create js/firebase-init.js**

```javascript
// Firebase Configuration — NXT Lojas Dash
const firebaseConfig = {
    apiKey: "AIzaSyDxMhLvzLkYMD9TIEjqUUt7R09p_qBQUnQ",
    authDomain: "nxt-plus.firebaseapp.com",
    projectId: "nxt-plus",
    storageBucket: "nxt-plus.firebasestorage.app",
    messagingSenderId: "649742928491",
    appId: "1:649742928491:web:05257dee6782c298f0ff2e"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const functions = firebase.functions();
```

- [ ] **Step 14: Create manifest.json**

```json
{
    "name": "NXT Lojas",
    "short_name": "NXT Lojas",
    "description": "Sistema de Gestao de Estoque e Vendas",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#0d0d0d",
    "theme_color": "#C6FF00",
    "icons": [
        {
            "src": "assets/logo-nxt.png",
            "sizes": "192x192",
            "type": "image/png"
        }
    ]
}
```

- [ ] **Step 15: Create index.html skeleton**

Create the full SPA shell with: login screen, app header, nav tabs (Estoque, Vendas, Relatorios, Admin), tab pages, modals, toast container, loading overlay. All CSS and JS files linked. Firebase SDK loaded from CDN. jsPDF and html2canvas loaded from CDN.

The HTML must include all element IDs referenced by the JS modules. See spec section 4 for the complete list of tabs and their contents.

- [ ] **Step 16: Create js/app.js (init and router)**

```javascript
// ========================================
// APP STATE
// ========================================

let currentUser = null;
let currentUserData = null;
let lojasDisponiveis = [];
let lojaAtual = null;

// Data caches
let dadosLojas = {};
let dadosProdutos = { modelos: [], cores: [] };
let dadosVendedores = { matriculas: {}, vendedores: [] };
let dadosFiscais = {};

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', async function() {
    // Init UI
    initToasts();
    initModals();
    initTabs();

    // Load static data
    await Promise.all([
        fetch('dados/lojas.json').then(r => r.json()).then(d => dadosLojas = d),
        fetch('dados/produtos.json').then(r => r.json()).then(d => dadosProdutos = d),
        fetch('dados/vendedores_json.json').then(r => r.json()).then(d => dadosVendedores = d),
        fetch('dados/produtos-fiscal.json').then(r => r.json()).then(d => dadosFiscais = d)
    ]);

    // Auth listener
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            try {
                const userDoc = await db.collection('usuarios').doc(user.uid).get();
                if (userDoc.exists) {
                    currentUserData = userDoc.data();
                    await carregarLojasDisponiveis();
                    mostrarApp();
                } else {
                    toastError('Usuario nao cadastrado. Contate o administrador.');
                    auth.signOut();
                }
            } catch (error) {
                console.error('Erro ao carregar dados do usuario:', error);
                toastError('Erro ao carregar dados. Tente novamente.');
                auth.signOut();
            }
        } else {
            currentUser = null;
            currentUserData = null;
            lojasDisponiveis = [];
            lojaAtual = null;
            mostrarLogin();
        }
    });
});

// ========================================
// NAVIGATION
// ========================================

function mostrarLogin() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('appPage').style.display = 'none';
    hideLoading();
}

function mostrarApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appPage').style.display = 'flex';
    hideLoading();

    // Update header
    document.getElementById('headerUserEmail').textContent = currentUser.email;
    document.getElementById('headerUserRole').textContent = currentUserData.role;

    // Configure UI by role
    configurarUIporRole();

    // Populate store selector
    popularSeletorLoja();

    // Default to stock tab
    switchTab('tab-estoque');

    // Init stock listener
    if (typeof initStock === 'function') initStock();
}

function configurarUIporRole() {
    const isAdmin = currentUserData.role === 'admin';
    const isGerente = currentUserData.role === 'gerente';

    // Show/hide admin tab
    const adminTab = document.querySelector('.nav-tab[data-tab="tab-admin"]');
    if (adminTab) adminTab.style.display = isAdmin ? '' : 'none';

    // Show/hide reports tab
    const reportsTab = document.querySelector('.nav-tab[data-tab="tab-relatorios"]');
    if (reportsTab) reportsTab.style.display = (isAdmin || isGerente) ? '' : 'none';

    // Show/hide store selector
    const storeSelector = document.getElementById('storeSelectorContainer');
    if (storeSelector) {
        storeSelector.style.display = lojasDisponiveis.length > 1 ? '' : 'none';
    }
}

async function carregarLojasDisponiveis() {
    lojasDisponiveis = [];
    if (!currentUserData) return;

    try {
        if (currentUserData.role === 'admin') {
            const snapshot = await db.collection('lojas').where('ativo', '==', true).get();
            snapshot.forEach(doc => {
                lojasDisponiveis.push({ id: doc.id, ...doc.data() });
            });
        } else if (currentUserData.role === 'gerente') {
            if (currentUserData.lojas && currentUserData.lojas.length > 0) {
                for (const lojaId of currentUserData.lojas) {
                    const lojaDoc = await db.collection('lojas').doc(lojaId).get();
                    if (lojaDoc.exists) {
                        lojasDisponiveis.push({ id: lojaDoc.id, ...lojaDoc.data() });
                    }
                }
            }
        } else {
            if (currentUserData.loja) {
                const lojaDoc = await db.collection('lojas').doc(currentUserData.loja).get();
                if (lojaDoc.exists) {
                    lojasDisponiveis.push({ id: lojaDoc.id, ...lojaDoc.data() });
                }
            }
        }

        if (lojasDisponiveis.length > 0) {
            lojaAtual = lojasDisponiveis[0].id;
        }
    } catch (error) {
        console.error('Erro ao carregar lojas:', error);
    }
}

function popularSeletorLoja() {
    const select = document.getElementById('storeSelector');
    if (!select) return;
    select.innerHTML = '';
    lojasDisponiveis.forEach(loja => {
        const option = document.createElement('option');
        option.value = loja.id;
        option.textContent = loja.nome;
        if (loja.id === lojaAtual) option.selected = true;
        select.appendChild(option);
    });
    select.addEventListener('change', function() {
        lojaAtual = this.value;
        if (typeof onLojaChanged === 'function') onLojaChanged();
    });
}

// ========================================
// ROLE HELPERS
// ========================================

function isAdmin() {
    return currentUserData && currentUserData.role === 'admin';
}

function isGerente() {
    return currentUserData && currentUserData.role === 'gerente';
}

function temAcessoLoja(lojaId) {
    if (!currentUserData) return false;
    if (currentUserData.role === 'admin') return true;
    if (currentUserData.role === 'gerente') {
        return currentUserData.lojas && currentUserData.lojas.includes(lojaId);
    }
    return currentUserData.loja === lojaId;
}
```

- [ ] **Step 17: Commit — project structure and base**

```bash
git add -A
git commit -m "feat: scaffold NXT Lojas Dash — structure, CSS, base JS modules"
```

---

## Phase 2: Authentication

### Task 2: Login/logout system

**Files:**
- Create: `js/auth.js`
- Modify: `index.html` (login form section)

- [ ] **Step 1: Create js/auth.js**

```javascript
// ========================================
// LOGIN
// ========================================

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const senha = document.getElementById('loginSenha').value;

    if (!email || !senha) {
        showLoginError('Preencha email e senha.');
        return;
    }

    showLoading('Entrando...');
    hideLoginError();

    auth.signInWithEmailAndPassword(email, senha)
        .catch(function(error) {
            hideLoading();
            let msg = 'Erro ao fazer login.';
            if (error.code === 'auth/user-not-found') msg = 'Usuario nao encontrado.';
            else if (error.code === 'auth/wrong-password') msg = 'Senha incorreta.';
            else if (error.code === 'auth/invalid-email') msg = 'Email invalido.';
            else if (error.code === 'auth/too-many-requests') msg = 'Muitas tentativas. Aguarde.';
            showLoginError(msg);
        });
}

function handleLogout() {
    auth.signOut();
}

// ========================================
// UI HELPERS
// ========================================

function showLoginError(msg) {
    const el = document.getElementById('loginError');
    if (el) {
        el.textContent = msg;
        el.classList.add('visible');
    }
}

function hideLoginError() {
    const el = document.getElementById('loginError');
    if (el) el.classList.remove('visible');
}
```

- [ ] **Step 2: Wire login form in index.html**

The login form calls `handleLogin(event)` on submit. The logout button calls `handleLogout()`.

- [ ] **Step 3: Test login locally**

```bash
cd /c/dev/NXT/nxtlojas-dash
npx http-server -p 3000 -o
```

Verify: login page shows, submitting credentials works with Firebase Auth, error messages display on wrong credentials, successful login shows app shell.

- [ ] **Step 4: Commit**

```bash
git add js/auth.js index.html
git commit -m "feat: implement Firebase auth login/logout"
```

---

## Phase 3: Stock Module

### Task 3: Real-time stock display

**Files:**
- Create: `js/stock.js`
- Modify: `index.html` (stock tab content)

- [ ] **Step 1: Create js/stock.js with Firestore listener and rendering**

The stock module must:
- Listen to `estoques/{lojaAtual}/produtos` with `onSnapshot`
- Render stock cards in the grid with left indicator bar (ok/low/zero)
- Show summary: total items, models, items at zero
- Provide `onLojaChanged` callback to restart listener when store changes
- Unsubscribe from previous listener before subscribing to new store

```javascript
let stockUnsubscribe = null;
let currentStockProducts = [];

function initStock() {
    listenStock();
}

function onLojaChanged() {
    listenStock();
    // Re-init other modules that depend on lojaAtual
}

function listenStock() {
    if (stockUnsubscribe) stockUnsubscribe();
    if (!lojaAtual) return;

    const ref = db.collection('estoques').doc(lojaAtual).collection('produtos').orderBy('modelo');
    stockUnsubscribe = ref.onSnapshot(snapshot => {
        currentStockProducts = [];
        snapshot.forEach(doc => {
            currentStockProducts.push({ id: doc.id, ...doc.data() });
        });
        renderStock(currentStockProducts);
    });
}

function renderStock(products) {
    const grid = document.getElementById('stockGrid');
    if (!grid) return;

    if (products.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1">
                <p class="empty-state-title">Nenhum produto no estoque</p>
                <p class="empty-state-text">Use "Entrada" para adicionar produtos.</p>
            </div>`;
        updateStockSummary(products);
        return;
    }

    grid.innerHTML = products.map(p => {
        const level = p.quantidade === 0 ? 'zero' : p.quantidade <= 2 ? 'low' : 'ok';
        const updated = p.updatedAt ? formatarDataHora(p.updatedAt.toDate()) : '';
        return `
            <div class="card stock-card stock-card--${level}">
                <div class="stock-model">${p.modelo}</div>
                <div class="stock-color">${p.cor}</div>
                <div class="stock-qty">${p.quantidade}</div>
                <div class="stock-updated">${updated}</div>
            </div>`;
    }).join('');

    updateStockSummary(products);
}

function updateStockSummary(products) {
    const total = products.reduce((sum, p) => sum + (p.quantidade || 0), 0);
    const models = new Set(products.map(p => p.modelo)).size;
    const zeros = products.filter(p => p.quantidade === 0).length;

    const elTotal = document.getElementById('stockSummaryTotal');
    const elModels = document.getElementById('stockSummaryModels');
    const elZeros = document.getElementById('stockSummaryZeros');

    if (elTotal) elTotal.textContent = total;
    if (elModels) elModels.textContent = models;
    if (elZeros) elZeros.textContent = zeros;
}
```

- [ ] **Step 2: Add stock HTML to index.html tab-estoque**

Stock tab contains: toolbar (summary + buttons), stock grid container.

- [ ] **Step 3: Test stock display**

Manually add a document to Firestore `estoques/{testLoja}/produtos/{juna-preto}` with `{modelo: "Juna", cor: "Preto", quantidade: 5}`. Verify card appears in real time with green indicator. Change quantity to 1 — verify yellow. Change to 0 — verify red.

- [ ] **Step 4: Commit**

```bash
git add js/stock.js index.html
git commit -m "feat: real-time stock display with Firestore onSnapshot"
```

### Task 4: Stock entry and manual exit

**Files:**
- Modify: `js/stock.js`
- Modify: `index.html` (entry/exit modals)

- [ ] **Step 1: Add entry function to stock.js**

```javascript
async function registrarEntradaEstoque(dados) {
    if (!lojaAtual) return false;

    try {
        const produtoId = `${dados.modelo}-${dados.cor}`.toLowerCase().replace(/\s+/g, '-');
        const ref = db.collection('estoques').doc(lojaAtual).collection('produtos').doc(produtoId);

        const docAtual = await ref.get();
        const qtdAtual = docAtual.exists ? docAtual.data().quantidade || 0 : 0;

        await ref.set({
            modelo: dados.modelo,
            cor: dados.cor,
            quantidade: qtdAtual + dados.quantidade,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: currentUser.email
        }, { merge: true });

        // Register movement
        await db.collection('movimentacoes').doc(lojaAtual).collection('registros').add({
            tipo: 'entrada',
            modelo: dados.modelo,
            cor: dados.cor,
            quantidade: dados.quantidade,
            chassi: dados.chassi || '',
            motor: dados.motor || '',
            observacao: dados.motivo || '',
            usuario: currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        toastSuccess(`Entrada: ${dados.quantidade}x ${dados.modelo} ${dados.cor}`);
        return true;
    } catch (error) {
        console.error('Erro na entrada:', error);
        toastError('Erro ao registrar entrada.');
        return false;
    }
}
```

- [ ] **Step 2: Add exit function to stock.js (with atomic transaction)**

```javascript
async function registrarSaidaEstoque(dados) {
    if (!lojaAtual) return false;

    try {
        const produtoId = `${dados.modelo}-${dados.cor}`.toLowerCase().replace(/\s+/g, '-');
        const ref = db.collection('estoques').doc(lojaAtual).collection('produtos').doc(produtoId);

        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(ref);
            if (!doc.exists) throw new Error('Produto nao encontrado no estoque.');
            const novaQtd = (doc.data().quantidade || 0) - dados.quantidade;
            if (novaQtd < 0) throw new Error('Estoque insuficiente.');
            transaction.update(ref, {
                quantidade: novaQtd,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: currentUser.email
            });
        });

        await db.collection('movimentacoes').doc(lojaAtual).collection('registros').add({
            tipo: 'saida',
            modelo: dados.modelo,
            cor: dados.cor,
            quantidade: dados.quantidade,
            chassi: dados.chassi || '',
            motor: dados.motor || '',
            observacao: dados.motivo || '',
            usuario: currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        toastSuccess(`Saida: ${dados.quantidade}x ${dados.modelo} ${dados.cor}`);
        return true;
    } catch (error) {
        console.error('Erro na saida:', error);
        toastError(error.message || 'Erro ao registrar saida.');
        return false;
    }
}
```

- [ ] **Step 3: Add entry/exit modals to index.html and wire form handlers**

Modal with: model dropdown (from dadosProdutos.modelos), color dropdown (from dadosProdutos.cores), quantity input, chassi/motor optional, motivo (quick buttons: Transferencia, Fabrica, Ajuste, Devolucao + free text).

- [ ] **Step 4: Test entry and exit**

Test: add 5 units of Juna Preto via entry form. Verify card updates in real time. Try exit of 3 — verify quantity drops to 2. Try exit of 5 — verify error "Estoque insuficiente."

- [ ] **Step 5: Commit**

```bash
git add js/stock.js index.html
git commit -m "feat: stock entry and exit with atomic transactions"
```

### Task 5: Stock movement history

**Files:**
- Modify: `js/stock.js`
- Modify: `index.html` (history section in stock tab)

- [ ] **Step 1: Add movement history function**

```javascript
let movementsUnsubscribe = null;

function listenMovements() {
    if (movementsUnsubscribe) movementsUnsubscribe();
    if (!lojaAtual) return;

    const ref = db.collection('movimentacoes').doc(lojaAtual)
        .collection('registros')
        .orderBy('createdAt', 'desc')
        .limit(50);

    movementsUnsubscribe = ref.onSnapshot(snapshot => {
        const movements = [];
        snapshot.forEach(doc => {
            movements.push({ id: doc.id, ...doc.data() });
        });
        renderMovements(movements);
    });
}

function renderMovements(movements) {
    const tbody = document.getElementById('movementsTableBody');
    if (!tbody) return;

    if (movements.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state" style="padding:var(--space-xl)">Nenhuma movimentacao registrada.</td></tr>`;
        return;
    }

    tbody.innerHTML = movements.map(m => {
        const date = m.createdAt ? formatarDataHora(m.createdAt.toDate()) : '';
        const tipoClass = m.tipo === 'entrada' ? 'badge-success' :
                          m.tipo === 'venda' ? 'badge-accent' : 'badge-warning';
        const tipoLabel = m.tipo === 'entrada' ? 'Entrada' :
                          m.tipo === 'venda' ? 'Venda' :
                          m.tipo === 'transferencia' ? 'Transferencia' : 'Saida';
        return `
            <tr>
                <td>${date}</td>
                <td><span class="badge ${tipoClass}">${tipoLabel}</span></td>
                <td>${m.modelo}</td>
                <td>${m.cor}</td>
                <td>${m.quantidade}</td>
                <td>${m.usuario || ''}</td>
                <td>${m.observacao || ''}</td>
            </tr>`;
    }).join('');
}
```

- [ ] **Step 2: Add history table HTML to stock tab**

Table with columns: Data, Tipo, Modelo, Cor, Qtd, Usuario, Observacao. Styled with `.table` classes.

- [ ] **Step 3: Wire listenMovements into initStock and onLojaChanged**

- [ ] **Step 4: Test movement history**

Register entries and exits. Verify table updates in real time with correct badge colors.

- [ ] **Step 5: Commit**

```bash
git add js/stock.js index.html
git commit -m "feat: real-time stock movement history"
```

---

## Phase 4: Sales Module

### Task 6: Sales form (5 collapsible sections)

**Files:**
- Create: `js/sales.js`
- Modify: `index.html` (sales tab content)

- [ ] **Step 1: Create js/sales.js with form state management**

The sales module manages: vendor autocomplete (by matricula or name from dadosVendedores), product list accumulator, payment form with multiple methods, delivery section, total calculation. Collapsible sections with progress bar.

Key functions:
- `initSales()` — setup masks, vendor autocomplete, dropdowns
- `configurarBuscaVendedor()` — autocomplete from vendedores_json.json (matches by matricula 4-digit or partial name)
- `adicionarProduto()` — adds to produtosDaVenda array
- `removerProduto(index)` — removes from array
- `calcularTotal()` — sum products + freight
- `toggleFormaPagamento(forma)` — select/deselect payment methods
- `registrarVenda()` — validate, save to Firestore, trigger stock deduction

- [ ] **Step 2: Implement vendor autocomplete**

```javascript
let produtosDaVenda = [];

function configurarBuscaVendedor() {
    const vendedorInput = document.getElementById('vendedorNome');
    const matriculaInput = document.getElementById('vendedorMatricula');
    const suggestionsDiv = document.getElementById('vendedorSuggestions');
    if (!vendedorInput || !suggestionsDiv) return;

    // Search by matricula
    if (matriculaInput) {
        matriculaInput.addEventListener('input', function() {
            const mat = this.value.trim();
            if (mat.length === 4 && dadosVendedores.matriculas[mat]) {
                const dados = dadosVendedores.matriculas[mat];
                if (Array.isArray(dados)) {
                    // Multiple vendors with same matricula
                    suggestionsDiv.innerHTML = '';
                    dados.forEach(v => {
                        const div = document.createElement('div');
                        div.className = 'vendedor-suggestion';
                        div.innerHTML = `<strong>${v.nome}</strong> <span style="color:var(--text-muted)">${v.loja}</span>`;
                        div.addEventListener('click', () => {
                            vendedorInput.value = v.nome;
                            suggestionsDiv.innerHTML = '';
                            suggestionsDiv.style.display = 'none';
                        });
                        suggestionsDiv.appendChild(div);
                    });
                    suggestionsDiv.style.display = 'block';
                } else {
                    vendedorInput.value = dados.nome;
                    suggestionsDiv.style.display = 'none';
                }
            } else {
                suggestionsDiv.style.display = 'none';
            }
        });
    }

    // Search by name
    vendedorInput.addEventListener('input', function() {
        const query = this.value.trim().toLowerCase();
        if (query.length < 2) {
            suggestionsDiv.style.display = 'none';
            return;
        }
        const matches = dadosVendedores.vendedores.filter(v =>
            v.toLowerCase().includes(query)
        ).slice(0, 8);

        if (matches.length === 0) {
            suggestionsDiv.style.display = 'none';
            return;
        }

        suggestionsDiv.innerHTML = matches.map(v =>
            `<div class="vendedor-suggestion" onclick="document.getElementById('vendedorNome').value='${v}';document.getElementById('vendedorSuggestions').style.display='none'">${v}</div>`
        ).join('');
        suggestionsDiv.style.display = 'block';
    });
}
```

- [ ] **Step 3: Implement product accumulator and total calculation**

```javascript
function adicionarProduto() {
    const modelo = document.getElementById('produtoModelo').value;
    const cor = document.getElementById('produtoCor').value;
    const preco = parseMoeda(document.getElementById('produtoPreco').value);
    const chassi = document.getElementById('produtoChassi').value.trim();
    const motor = document.getElementById('produtoMotor').value.trim();
    const capacete = document.getElementById('produtoCapacete').checked;
    const corCapacete = document.getElementById('produtoCorCapacete').value;
    const origem = document.getElementById('produtoOrigem').value;
    const lojaOrigem = document.getElementById('produtoLojaOrigem').value;

    if (!modelo || !cor || preco <= 0) {
        toastWarning('Preencha modelo, cor e preco.');
        return;
    }

    produtosDaVenda.push({
        modelo, cor, preco, chassi, motor,
        capacete: capacete ? 'sim' : 'nao',
        corCapacete: capacete ? corCapacete : '',
        lojaOrigem: origem === 'outra' ? lojaOrigem : lojaAtual
    });

    renderProdutosDaVenda();
    calcularTotal();
    limparFormProduto();
}

function removerProduto(index) {
    produtosDaVenda.splice(index, 1);
    renderProdutosDaVenda();
    calcularTotal();
}

function calcularTotal() {
    const subtotal = produtosDaVenda.reduce((sum, p) => sum + p.preco, 0);
    const frete = parseMoeda(document.getElementById('entregaFrete')?.value || '0');
    const total = subtotal + frete;

    const el = document.getElementById('saleTotal');
    if (el) el.textContent = `R$ ${formatarMoeda(total)}`;
    return total;
}

function renderProdutosDaVenda() {
    const container = document.getElementById('produtosList');
    if (!container) return;

    if (produtosDaVenda.length === 0) {
        container.innerHTML = '<p class="empty-state-text">Nenhum produto adicionado.</p>';
        return;
    }

    container.innerHTML = produtosDaVenda.map((p, i) => `
        <div class="product-item">
            <div>
                <strong>${p.modelo} — ${p.cor}</strong>
                <span style="color:var(--text-secondary);margin-left:var(--space-sm)">R$ ${formatarMoeda(p.preco)}</span>
                ${p.chassi ? `<br><span style="font-size:var(--font-xs);color:var(--text-muted)">Chassi: ${p.chassi}</span>` : ''}
                ${p.lojaOrigem !== lojaAtual ? `<br><span class="badge badge-warning">Estoque: ${p.lojaOrigem}</span>` : ''}
            </div>
            <button class="btn btn-ghost btn-sm" onclick="removerProduto(${i})">Remover</button>
        </div>
    `).join('');
}
```

- [ ] **Step 4: Build full sale form HTML in index.html**

5 collapsible sections with progress bar matching spec section 4.2. Payment options as clickable cards. Delivery type as radio cards.

- [ ] **Step 5: Commit**

```bash
git add js/sales.js index.html
git commit -m "feat: sales form with vendor autocomplete, products, payment"
```

### Task 7: Sale registration with inter-store stock deduction

**Files:**
- Modify: `js/sales.js`

- [ ] **Step 1: Implement registrarVenda with atomic inter-store transaction**

```javascript
async function registrarVenda() {
    // 1. Validate form
    const vendedor = document.getElementById('vendedorNome').value.trim();
    const matricula = document.getElementById('vendedorMatricula').value.trim();
    if (!vendedor || produtosDaVenda.length === 0) {
        toastWarning('Preencha vendedor e adicione pelo menos um produto.');
        return;
    }

    // 2. Build sale object
    const venda = {
        loja: lojaAtual,
        vendedor: vendedor,
        vendedorMatricula: matricula,
        dataVenda: document.getElementById('vendaData').value || dataHoje(),
        cliente: {
            nome: document.getElementById('clienteNome').value.trim(),
            telefone: document.getElementById('clienteTelefone').value.trim(),
            email: document.getElementById('clienteEmail').value.trim(),
            cpf: document.getElementById('clienteCPF').value.trim(),
            cnpj: document.getElementById('clienteCNPJ').value.trim(),
            endereco: {
                cep: document.getElementById('clienteCEP').value.trim(),
                rua: document.getElementById('clienteRua').value.trim(),
                numero: document.getElementById('clienteNumero').value.trim(),
                bairro: document.getElementById('clienteBairro').value.trim(),
                cidade: document.getElementById('clienteCidade').value.trim(),
                estado: document.getElementById('clienteEstado').value.trim()
            }
        },
        produtos: [...produtosDaVenda],
        pagamento: coletarDadosPagamento(),
        entrega: {
            tipo: document.querySelector('input[name="entregaTipo"]:checked')?.value || 'retirada',
            prazo: document.getElementById('entregaPrazo').value || '',
            frete: parseMoeda(document.getElementById('entregaFrete')?.value || '0')
        },
        total: calcularTotal(),
        usuario: currentUser.email,
        status: 'pendente',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    showLoading('Registrando venda...');

    try {
        // 3. Stock deduction per product (grouped by origin store)
        for (const produto of venda.produtos) {
            const lojaEstoque = produto.lojaOrigem || lojaAtual;
            const produtoId = `${produto.modelo}-${produto.cor}`.toLowerCase().replace(/\s+/g, '-');
            const ref = db.collection('estoques').doc(lojaEstoque).collection('produtos').doc(produtoId);

            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(ref);
                if (!doc.exists) throw new Error(`${produto.modelo} ${produto.cor} nao encontrado no estoque de ${lojaEstoque}.`);
                const novaQtd = (doc.data().quantidade || 0) - 1;
                if (novaQtd < 0) throw new Error(`Estoque insuficiente: ${produto.modelo} ${produto.cor} em ${lojaEstoque}.`);
                transaction.update(ref, {
                    quantidade: novaQtd,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedBy: currentUser.email
                });
            });

            // Register movement in origin store
            const obsVenda = lojaEstoque !== lojaAtual
                ? `Venda para loja ${lojaAtual} — Vendedor ${vendedor}`
                : `Venda — Vendedor ${vendedor}`;

            await db.collection('movimentacoes').doc(lojaEstoque).collection('registros').add({
                tipo: 'venda',
                modelo: produto.modelo,
                cor: produto.cor,
                quantidade: 1,
                chassi: produto.chassi || '',
                motor: produto.motor || '',
                observacao: obsVenda,
                vendaLoja: lojaAtual,
                usuario: currentUser.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        // 4. Save sale in seller's store
        const vendaRef = await db.collection('vendas').doc(lojaAtual).collection('registros').add(venda);
        venda.id = vendaRef.id;

        hideLoading();
        toastSuccess('Venda registrada com sucesso!');

        // 5. Trigger async integrations (fire-and-forget)
        enviarIntegracoes(venda);

        // 6. Open post-sale wizard
        abrirWizardPosVenda(venda);

    } catch (error) {
        hideLoading();
        console.error('Erro ao registrar venda:', error);
        toastError(error.message || 'Erro ao registrar venda.');
    }
}

function coletarDadosPagamento() {
    const formas = [];
    const valores = {};
    document.querySelectorAll('.payment-option.selected').forEach(el => {
        const forma = el.dataset.forma;
        formas.push(forma);
        const input = document.getElementById(`pagamento-valor-${forma}`);
        if (input) valores[forma] = parseMoeda(input.value);
    });

    return {
        formas,
        valores,
        parcelas: document.getElementById('pagamentoParcelas')?.value || '1',
        observacoes: document.getElementById('pagamentoObs')?.value || '',
        outrosDescricao: document.getElementById('pagamentoOutrosDesc')?.value || ''
    };
}
```

- [ ] **Step 2: Test inter-store sale**

Setup: Store A has 3x Juna Preto. Seller in Store B registers sale with origin = Store A. Verify: Store A stock drops to 2, movement appears in Store A history with "Venda para loja B", sale appears in Store B sales list.

- [ ] **Step 3: Commit**

```bash
git add js/sales.js
git commit -m "feat: sale registration with atomic inter-store stock deduction"
```

### Task 8: Post-sale wizard and invoice

**Files:**
- Create: `js/invoice.js`
- Modify: `js/sales.js`
- Modify: `index.html` (wizard modal)

- [ ] **Step 1: Create js/invoice.js**

Port `gerarHTMLFatura`, `gerarTextoFatura`, and `gerarPDF` from APP live script.js. Adapt to new CSS classes and remove emojis. Include WhatsApp send via `wa.me/{phone}`.

Key functions:
- `gerarHTMLFatura(venda)` — returns styled HTML string
- `gerarTextoFatura(venda)` — returns plain text for WhatsApp
- `gerarPDF(venda)` — uses jsPDF + html2canvas
- `enviarWhatsApp(telefone, texto)` — opens wa.me link

Include MANUAIS_MOTOS object for manual links.

- [ ] **Step 2: Implement wizard modal in sales.js**

```javascript
function abrirWizardPosVenda(venda) {
    // Step 1: Confirmation + checklist
    // Step 2: Invoice (HTML, copy, PDF, print, WhatsApp)
    // Step 3: Manual link
    // Button: "Nova Venda" — clears form
    openModal('modalWizard');
    renderWizardStep1(venda);
}
```

- [ ] **Step 3: Add wizard modal HTML to index.html**

- [ ] **Step 4: Test wizard flow**

Register sale, verify wizard opens with correct data, copy invoice, generate PDF, WhatsApp link works.

- [ ] **Step 5: Commit**

```bash
git add js/invoice.js js/sales.js index.html
git commit -m "feat: post-sale wizard with invoice, PDF, WhatsApp"
```

### Task 9: Sales history with role-based visibility

**Files:**
- Modify: `js/sales.js`
- Modify: `index.html` (sales history section)

- [ ] **Step 1: Add sales history with filters**

```javascript
async function carregarHistoricoVendas(filtros = {}) {
    if (!lojaAtual) return;

    let query = db.collection('vendas').doc(lojaAtual).collection('registros');

    // Role-based filtering
    if (currentUserData.role === 'funcionario') {
        query = query.where('usuario', '==', currentUser.email);
    }

    if (filtros.dataInicio) {
        query = query.where('createdAt', '>=', new Date(filtros.dataInicio));
    }
    if (filtros.dataFim) {
        query = query.where('createdAt', '<=', new Date(filtros.dataFim + 'T23:59:59'));
    }

    query = query.orderBy('createdAt', 'desc').limit(100);

    const snapshot = await query.get();
    const vendas = [];
    snapshot.forEach(doc => vendas.push({ id: doc.id, ...doc.data() }));
    renderHistoricoVendas(vendas);
}
```

- [ ] **Step 2: Render sales table with status badges and actions (view details, mark as paid)**

- [ ] **Step 3: Test role visibility**

Funcionario sees only their sales. Gerente sees all sales from their stores. Admin sees everything.

- [ ] **Step 4: Commit**

```bash
git add js/sales.js index.html
git commit -m "feat: sales history with role-based visibility and filters"
```

---

## Phase 5: Integrations

### Task 10: Bling ERP integration

**Files:**
- Create: `js/bling.js`
- Create: `js/fiscal.js`

- [ ] **Step 1: Create js/bling.js**

Port Bling integration from APP live: `blingRequest` (proxy call), `buscarOuCriarContato`, `enviarVendaParaBling`, status check. The proxy URL should be configurable (pointing to existing Vercel deployment).

```javascript
const BLING_PROXY_URL = 'https://nxt-app-seven.vercel.app/api/bling';

async function blingRequest(endpoint, options = {}) {
    const url = `${BLING_PROXY_URL}/proxy?endpoint=${encodeURIComponent(endpoint)}`;
    const response = await fetch(url, {
        method: options.method || 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    if (!response.ok) throw new Error(`Bling API error: ${response.status}`);
    return response.json();
}

async function verificarStatusBling() {
    try {
        const res = await fetch(`${BLING_PROXY_URL}/status`);
        const data = await res.json();
        return data;
    } catch {
        return { configured: false, authenticated: false };
    }
}

async function buscarOuCriarContato(cliente) {
    // Search by CPF/CNPJ
    const doc = cliente.cpf?.replace(/\D/g, '') || cliente.cnpj?.replace(/\D/g, '');
    if (doc) {
        const busca = await blingRequest(`/contatos?pesquisa=${doc}`);
        if (busca.data && busca.data.length > 0) {
            return busca.data[0].id;
        }
    }
    // Create new contact
    const novoContato = {
        nome: cliente.nome,
        fantasia: cliente.nome,
        tipoPessoa: cliente.cnpj ? 'J' : 'F',
        numeroDocumento: doc || '',
        telefone: cliente.telefone?.replace(/\D/g, '') || '',
        email: cliente.email || '',
        endereco: {
            endereco: cliente.endereco?.rua || '',
            numero: cliente.endereco?.numero || '',
            bairro: cliente.endereco?.bairro || '',
            cep: cliente.endereco?.cep?.replace(/\D/g, '') || '',
            municipio: cliente.endereco?.cidade || '',
            uf: cliente.endereco?.estado || ''
        }
    };
    const result = await blingRequest('/contatos', { method: 'POST', body: novoContato });
    return result.data?.id;
}
```

- [ ] **Step 2: Create js/fiscal.js**

Port fiscal decomposition logic from APP live `enviarVendaParaBling`. Uses `dadosFiscais` loaded from `produtos-fiscal.json`.

```javascript
function montarItensFiscais(produtos) {
    const itensPedido = [];

    for (const produto of produtos) {
        const fiscal = dadosFiscais[produto.modelo];
        if (!fiscal) {
            // No fiscal mapping — single item
            itensPedido.push({
                descricao: `${produto.modelo} ${produto.cor}`,
                unidade: 'UN',
                quantidade: 1,
                valor: produto.preco
            });
            continue;
        }

        const precoBase = produto.preco;
        const valorCapacete = (produto.capacete === 'sim' && fiscal.capacete) ? (fiscal.capacete.valor || 0.01) : 0;
        const precoItens = Math.round((precoBase - valorCapacete) * 100) / 100;

        let indicePrincipal = 0;
        const itensCalculados = fiscal.itens.map((itemFiscal, j) => {
            const valorUnitario = Math.round(precoItens * itemFiscal.percentual * 100) / 100;
            if (itemFiscal.principal) indicePrincipal = j;
            return { ...itemFiscal, valorCalculado: valorUnitario };
        });

        // Rounding adjustment on principal item
        const totalCalculado = itensCalculados.reduce((sum, ic) =>
            sum + Math.round(ic.valorCalculado * ic.quantidade * 100) / 100, 0);
        const diferenca = Math.round((precoItens - totalCalculado) * 100) / 100;
        if (diferenca !== 0) {
            itensCalculados[indicePrincipal].valorCalculado =
                Math.round((itensCalculados[indicePrincipal].valorCalculado + diferenca) * 100) / 100;
        }

        for (const ic of itensCalculados) {
            itensPedido.push({
                descricao: ic.descricao,
                unidade: ic.unidade,
                quantidade: ic.quantidade,
                valor: ic.valorCalculado,
                codigo: ic.codigo || ''
            });
        }

        // Capacete
        if (produto.capacete === 'sim' && fiscal.capacete) {
            itensPedido.push({
                descricao: fiscal.capacete.descricao || 'Capacete',
                unidade: 'UN',
                quantidade: 1,
                valor: valorCapacete
            });
        }
    }

    return itensPedido;
}
```

- [ ] **Step 3: Wire Bling into sale flow (enviarIntegracoes)**

- [ ] **Step 4: Commit**

```bash
git add js/bling.js js/fiscal.js
git commit -m "feat: Bling ERP integration with fiscal decomposition"
```

### Task 11: Make.com and Cloud Run integrations

**Files:**
- Create: `js/integrations.js`

- [ ] **Step 1: Create js/integrations.js**

```javascript
const WEBHOOK_URLS = {
    vendas: 'https://hook.us2.make.com/ku3pkl5io6mnh7k8tq275vhowhkcwxxo',
    inventario: 'https://hook.us2.make.com/xp9611ae67d4cf47frtwlzc9qmhafzck'
};

const CLOUD_RUN_URL = 'https://estoque-baixa-venda-yr6pk2gb3a-rj.a.run.app';
const CLOUD_RUN_KEY = 'e4218efd6d48b67425efe89efe602c9321b98c31d5c7c7315c6a579b235cafe4';

// Anti-duplicate fingerprint
function gerarFingerprintVenda(dados) {
    const partes = [
        dados.cliente?.nome || '',
        dados.cliente?.cpf || dados.cliente?.cnpj || '',
        dados.dataVenda || '',
        String(dados.total || 0),
        (dados.produtos || []).map(p => `${p.modelo}-${p.cor}`).sort().join('|')
    ];
    const str = partes.join('::');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

const webhookEnviados = new Map();

function vendaJaEnviada(dados) {
    const fp = gerarFingerprintVenda(dados);
    const agora = Date.now();
    // Clean entries older than 24h
    for (const [key, time] of webhookEnviados) {
        if (agora - time > 86400000) webhookEnviados.delete(key);
    }
    return webhookEnviados.has(fp);
}

function marcarVendaEnviada(dados) {
    webhookEnviados.set(gerarFingerprintVenda(dados), Date.now());
}

async function enviarParaMake(tipo, dados) {
    const url = WEBHOOK_URLS[tipo];
    if (!url) return;
    if (tipo === 'vendas' && vendaJaEnviada(dados)) return;

    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 30000);
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
            signal: controller.signal
        });
        if (tipo === 'vendas') marcarVendaEnviada(dados);
    } catch (e) {
        console.error(`Erro ao enviar para Make (${tipo}):`, e);
    }
}

async function enviarBaixaCloudRun(produto, lojaId) {
    if (!produto.chassi) return;
    try {
        await fetch(CLOUD_RUN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': CLOUD_RUN_KEY,
                'X-App-Name': 'nxtlojas-dash'
            },
            body: JSON.stringify({
                chassi: produto.chassi,
                motor: produto.motor || '',
                tipo: 'PF',
                local: lojaId,
                formularioRef: `nxtlojas-dash-${Date.now()}`
            })
        });
    } catch (e) {
        console.error('Erro Cloud Run:', e);
    }
}

// Master integration dispatcher (fire-and-forget)
function enviarIntegracoes(venda) {
    // Make.com
    enviarParaMake('vendas', venda);

    // Bling
    if (typeof enviarVendaParaBling === 'function') {
        enviarVendaParaBling(venda);
    }

    // Cloud Run (per product with chassi)
    for (const produto of venda.produtos) {
        enviarBaixaCloudRun(produto, produto.lojaOrigem || venda.loja);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add js/integrations.js
git commit -m "feat: Make.com and Cloud Run integrations with anti-duplicate"
```

---

## Phase 6: Reports

### Task 12: Stock and sales reports

**Files:**
- Create: `js/reports.js`
- Modify: `index.html` (reports tab)

- [ ] **Step 1: Create js/reports.js with stock reports**

```javascript
async function gerarRelatorioEstoquePosicao() {
    // For each accessible store, get all products
    const resultado = [];
    for (const loja of lojasDisponiveis) {
        const snapshot = await db.collection('estoques').doc(loja.id)
            .collection('produtos').orderBy('modelo').get();
        snapshot.forEach(doc => {
            const d = doc.data();
            resultado.push({
                loja: loja.nome,
                modelo: d.modelo,
                cor: d.cor,
                quantidade: d.quantidade || 0
            });
        });
    }
    return resultado;
}

async function gerarRelatorioGiroProdutos(dataInicio, dataFim) {
    const resultado = [];
    for (const loja of lojasDisponiveis) {
        let query = db.collection('movimentacoes').doc(loja.id)
            .collection('registros')
            .where('createdAt', '>=', new Date(dataInicio))
            .where('createdAt', '<=', new Date(dataFim + 'T23:59:59'));

        const snapshot = await query.get();
        snapshot.forEach(doc => {
            const d = doc.data();
            resultado.push({
                loja: loja.nome,
                tipo: d.tipo,
                modelo: d.modelo,
                cor: d.cor,
                quantidade: d.quantidade || 0
            });
        });
    }
    // Aggregate by modelo+cor
    const agrupado = {};
    resultado.forEach(r => {
        const key = `${r.modelo}|${r.cor}`;
        if (!agrupado[key]) agrupado[key] = { modelo: r.modelo, cor: r.cor, entradas: 0, saidas: 0, vendas: 0 };
        if (r.tipo === 'entrada') agrupado[key].entradas += r.quantidade;
        else if (r.tipo === 'venda') agrupado[key].vendas += r.quantidade;
        else agrupado[key].saidas += r.quantidade;
    });
    return Object.values(agrupado).sort((a, b) => (b.vendas + b.saidas) - (a.vendas + a.saidas));
}

async function gerarRelatorioVendasPeriodo(dataInicio, dataFim) {
    const resultado = [];
    for (const loja of lojasDisponiveis) {
        const snapshot = await db.collection('vendas').doc(loja.id)
            .collection('registros')
            .where('createdAt', '>=', new Date(dataInicio))
            .where('createdAt', '<=', new Date(dataFim + 'T23:59:59'))
            .orderBy('createdAt', 'desc')
            .get();
        snapshot.forEach(doc => {
            const d = doc.data();
            resultado.push({
                loja: loja.nome,
                vendedor: d.vendedor,
                total: d.total || 0,
                status: d.status,
                data: d.createdAt?.toDate()
            });
        });
    }
    return resultado;
}

async function gerarRankingVendedores(dataInicio, dataFim) {
    const vendas = await gerarRelatorioVendasPeriodo(dataInicio, dataFim);
    const ranking = {};
    vendas.forEach(v => {
        if (!ranking[v.vendedor]) ranking[v.vendedor] = { vendedor: v.vendedor, qtd: 0, total: 0 };
        ranking[v.vendedor].qtd++;
        ranking[v.vendedor].total += v.total;
    });
    return Object.values(ranking).sort((a, b) => b.qtd - a.qtd);
}

function exportarCSV(dados, nomeArquivo) {
    if (!dados.length) return;
    const headers = Object.keys(dados[0]);
    const csv = [
        headers.join(';'),
        ...dados.map(row => headers.map(h => {
            let val = row[h];
            if (val instanceof Date) val = formatarData(val);
            if (typeof val === 'number') val = val.toString().replace('.', ',');
            return `"${val || ''}"`;
        }).join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nomeArquivo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: Add reports tab HTML with filter forms and render functions**

Each report has: date range filter, generate button, table container, export CSV button.

- [ ] **Step 3: Test reports with sample data**

- [ ] **Step 4: Commit**

```bash
git add js/reports.js index.html
git commit -m "feat: stock and sales reports with CSV export"
```

---

## Phase 7: Admin

### Task 13: Store and user management

**Files:**
- Create: `js/admin.js`
- Copy: `functions/index.js` (from app-plus, with fixes)
- Modify: `index.html` (admin tab)

- [ ] **Step 1: Create js/admin.js**

Functions for: listing stores, creating store, editing store, listing users, creating user (via Cloud Function), editing user role/stores, deactivating/reactivating user, resetting password.

- [ ] **Step 2: Copy and verify functions/index.js**

Cloud Functions: criarUsuario, desativarUsuario, reativarUsuario, resetarSenha. Port from app-plus with same logic.

- [ ] **Step 3: Add admin HTML (store list, user list, modals for create/edit)**

- [ ] **Step 4: Test admin CRUD**

Create a store, create a user with gerente role and assign stores, verify they can only see assigned stores.

- [ ] **Step 5: Commit**

```bash
git add js/admin.js functions/ index.html
git commit -m "feat: admin panel — store and user management with Cloud Functions"
```

---

## Phase 8: PWA & Deploy

### Task 14: Service worker and PWA

**Files:**
- Create: `service-worker.js`

- [ ] **Step 1: Create service-worker.js**

Network First strategy. Cache: HTML, CSS, JS, JSON data, logo. Exclude: API calls, POST requests. Version based on build date.

- [ ] **Step 2: Register service worker in app.js**

- [ ] **Step 3: Commit**

```bash
git add service-worker.js js/app.js
git commit -m "feat: PWA service worker with network-first caching"
```

### Task 15: Firebase Hosting deploy

- [ ] **Step 1: Apply Firestore Security Rules**

Copy rules from FIREBASE-RULES.txt to Firebase Console. Verify rules enforce role-based access.

- [ ] **Step 2: Deploy Cloud Functions**

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

- [ ] **Step 3: Deploy hosting**

```bash
firebase deploy --only hosting
```

- [ ] **Step 4: Create initial admin user**

In Firebase Console > Authentication: create user with email/password. Then in Firestore > usuarios collection: create document with uid as key, role: 'admin', ativo: true.

- [ ] **Step 5: Test full flow on production URL**

Login as admin, create a store, create a gerente user, create a funcionario user. Test stock entry, sale with inter-store deduction, reports, invoice generation.

- [ ] **Step 6: Push to GitHub**

```bash
git remote add origin https://github.com/claudiarfmoraes-hub/nxtlojas-dash.git
git push -u origin main
```

- [ ] **Step 7: Commit**

```bash
git add firebase.json .firebaserc
git commit -m "feat: Firebase Hosting deploy configuration"
```

---

## Phase 9: Final Polish

### Task 16: Complete index.html with all sections

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Assemble complete HTML**

Ensure all IDs referenced by JS modules exist. All modals (entry, exit, wizard, new store, new user, sale details). All tab pages. All form elements with correct IDs matching the JS code.

- [ ] **Step 2: Visual review**

Open locally, test all tabs, verify responsive layout on mobile viewport, verify dark theme consistency, no emojis anywhere.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: complete HTML assembly with all sections and modals"
```

### Task 17: End-to-end testing

- [ ] **Step 1: Test as funcionario** — login, see only own store, register entry, register sale, verify stock deduction, see own sales only
- [ ] **Step 2: Test as gerente** — login, switch stores, see all vendors' sales, view reports, stock comparison between stores
- [ ] **Step 3: Test as admin** — create store, create users, assign roles, see everything, run all reports, export CSV
- [ ] **Step 4: Test inter-store sale** — sell from Store A stock while logged in Store B, verify both stores update correctly
- [ ] **Step 5: Test integrations** — Bling sends, Make.com receives, Cloud Run fires
- [ ] **Step 6: Fix any issues found**
- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "fix: end-to-end testing fixes and polish"
```
