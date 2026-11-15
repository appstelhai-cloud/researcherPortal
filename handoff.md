# Researcher Portal (פורטל חוקר) – KKM MVP – Handoff

Status: mockup approved for discussion, no code yet. Next step: Next.js prototype on mock data, deployed to Vercel, repo on GitHub.
Owner: Tal, Applications Department, Tel-Hai. Audience for the first demo: Research Authority (רשות המחקר) and university management.

**Current phase: concept POC for presentation only.** No real data, no database, no integrations (Priority, Quotes, monday, SSO). Everything runs on fixtures. Sections below about Mongo, adapters, sync and monday describe the *direction* to show and discuss, not work to build now.

## 1. Goal

A portal where each researcher sees their personal **KKM (קק״מ, קרן קשרי מדע)** budget in one screen: available, used, open commitments, balance, and spend distribution by category. A second view gives the Research Authority an aggregate across researchers.

MVP is a **read-only mirror**. No approvals, no forms, no writes back to any system.

## 2. Scope

**MVP (from the whiteboard, both items checked):**
1. Per-researcher view (הצגה לפי חוקר)
2. KKM connected to Quotes (קק״מ – חיבור ל-Quotes): approved purchase requests charged to KKM appear as open commitments

**Later (direction only, no dates, undefined):**
- Approval processes (תהליכי אישורים כללי)
- Project management (ניהול פרויקטים)
- Calls for proposals (קולות קוראים)
- Research proposal submission (הגשת הצעות מחקר)
- Priority view (מבט ב-Priority) and declarations (הצהרות)
- Documents (מסמכים) and alerts (התראות)

Interpretation notes: the grouping of "later" items by color is an assumption. Budget data itself comes from Priority, so a Priority-sourced budget view is inside the MVP even though the whiteboard lists "מבט ב-Priority" separately.

**Not in MVP:** monday.com integration. KKM is a personal budget, not a project budget. monday comes in with "project management", via deep links first, then read-only status. See section 4b for the revised direction (own the process data model, monday as a bridge).

## 3. Domain rules (source: KKM procedure 412-5, updated 26.6.2019)

The procedure predates the university status and refers to "the college". **Verify the current version and amounts with the Research Authority and HR before encoding any rule.**

- **Unit of management is the researcher**, not a grant. Annual personal budget per full-time position, prorated by employment percentage (sec. 5.4, 6).
- **Budget year runs 1 Oct – 30 Sep** (sec. 3.4). Never filter by calendar year. Current year: תשפ״ז (1.10.2026–30.9.2027).
- **Eligibility:** only senior faculty in position. Sabbatical: eligible. Unpaid leave: not eligible for that period (sec. 5).
- **Accrual (צבירה):** veteran faculty up to current year + 2 previous; others current + 1 previous. Nominal values (sec. 7).
- **Surplus and deficit carry over** to next year (sec. 8.1). Negative balance is a legitimate state: show it, never block it.
- **Advance on next year's budget:** up to a total of 40K ₪, once per three years, subject to conditions (sec. 8.2).
- **Leaving the university forfeits accrued funds**, no redemption (sec. 5.5).
- **Allowed expense categories (sec. 9):** conferences (IL/abroad), research trips, courses, translation and editing, research assistants, professional society fees, computers and software, equipment and materials, journals, book funding, professional literature, statistical consulting, participant payments, student research travel, surveys by external firms, map room and analytics services.
- **Category caps:** equipment and materials up to 3K ₪/year; direct payments, vouchers or raffles for participants up to 3K ₪/year.
- **Approval precedes payment.** A request is approved in advance, paid later, and reimbursement requests are due within 60 days of the expense. So "approved but not yet paid" is a real state that must be shown, otherwise the balance misleads.
- Request deadline for a budget year: 31 Aug. Reimbursement deadline: 20 Oct of the following budget year.

## 4. Calculations

```
available = annual_allocation + accrued_from_previous_years
balance   = available - used - committed
utilization = (used + committed) / available   // can exceed 100%
```

- `used`: actual expenses (source: Priority).
- `committed`: approved, not yet paid (source: Quotes, **to be confirmed**).
- Allow negative `balance`. Label it "deficit, carries over to next year".

## 4a. Funding source model (design generic, ship KKM only)

KKM is one of several research funding sources. University research is typically funded by: competitive external grants (national foundations, government ministries, Innovation Authority, EU programs), institutional funds (personal research budget like KKM, new-faculty startup packages, pilot and seed funds, doctoral scholarships), donations from foundations and donors, commercial research contracts, and overhead returned to units. **Which of these exist at Tel-Hai, and which are in Priority, is unconfirmed** (see section 10).

The MVP ships **KKM only**, but the data model must not hard-code KKM, so adding grants later is an extension and not a rewrite.

```ts
type FundingSourceType =
  | 'institutional_personal'   // KKM
  | 'internal_call'            // internal call for proposals (university funds)
  | 'external_call'            // external call for proposals (outside funders)
  | 'external_grant'
  | 'donation'
  | 'commercial'
  | 'other';

interface FundingSource {
  id: string;
  type: FundingSourceType;
  name: string;                       // e.g. "קק״מ"
  managementUnit: 'researcher' | 'grant'; // KKM = researcher; grant = project, possibly shared by several researchers
  periodModel: 'budget_year' | 'custom_period'; // KKM = 1 Oct–30 Sep; grants run on their own agreement dates
  currency: string;                   // 'ILS' default; grants may be USD/EUR
  rules: SourceRules;                 // see below
}

interface SourceRules {
  carryOver?: 'surplus_and_deficit' | 'by_agreement' | 'none';
  accrualYears?: number;              // KKM: depends on seniority
  allowedCategories?: string[];       // KKM: sec. 9 list
  categoryCaps?: Record<string, number>;
  reportingRequiredToFunder?: boolean;
}
```

Rules:
- `Allocation`, `Transaction` and `Commitment` reference a `fundingSourceId`. A transaction is attributed to a researcher, and for grants also to a grant.
- Balance logic is a **per-source strategy**, not a shared formula with `if (kkm)` branches. Section 4 is the KKM strategy.
- The researcher card shows a list of sources, each with its own summary. For the MVP the list has one item.
- A grant can be shared by several researchers: model `GrantParticipant` when grants are added. Do not build it now.
- Currency: store original currency and amount; show ILS conversion only if Accounting confirms the rate to use.

## 4b. Process tracking and the monday question (direction only, not built)

Context: the Research Authority works in monday today. A vendor demo ("מרחב המחקר האישי", 6 slides) showed a task-and-request tracking portal with four role views (researcher, Research Authority, advanced studies, procurement owner). It has no financial data, no integration story, no per-source rules and no permission model. Our KKM budget view covers what it lacks; it covers the process tracking we lack. They are complementary.

Problem with monday as the system of record: no control over board structure changes, and working styles differ between researchers, so there is no data contract.

Direction:
- **Own the process data model** (a stable schema in our store, Mongo when a DB is introduced). Money stays in Priority; we hold process state only. An approved request is a commitment and must reconcile with Quotes and Priority.
- Add a generic `Request` entity, separate from `Transaction`:

```ts
interface Request {
  id: string;
  type: string;                 // e.g. 'purchase', 'report', 'proposal', 'ethics', 'supervisor_approval'
  researcherId: string;
  fundingSourceId?: string;     // links to section 4a
  status: string;               // from a per-type state machine, not free text
  assignee: { role: string; name?: string };
  dueDate?: string;             // deadline rules per type, owned by the Research Authority
  history: { at: string; by: string; from: string; to: string; note?: string }[];
  documents: { name: string; url: string }[];
}
```
- **monday as a one-way bridge first:** an adapter reads boards, normalizes to `Request`, and flags schema drift. No change to how the Authority works. Move request types to native handling one at a time, simple and recurring first.
- Do not remove monday in one step. The Authority needs a mature replacement before they leave it.
- A process owner inside the Research Authority must own state machines and deadlines. We do not guess them.

Concept-POC scope for this: show a request-tracking view (role-based task table like the vendor demo, but on our fixtures) next to the budget view. No engine, no writes, no monday call.

## 5. Data sources (all open until the Accounting meeting)

| Need | Source | Status |
|---|---|---|
| Annual allocation, accrual, actual expenses, expense category | Priority | **Unknown**: API/OData availability, per-researcher project or account structure, whether expenses are classified by sec. 9 categories |
| Open commitments | Quotes (procurement system) | Assumed. Confirm Quotes holds an approved-not-paid state tied to KKM and researcher |
| Researcher identity | University SSO | TBD. Need a stable key shared with Priority (employee number or email) |

**Architecture recommendation:** do not call Priority live per page view. Run a scheduled sync into an intermediate store owned by us, and show an "as of [timestamp]" on every screen. Build the UI against a typed repository interface with a **mock adapter first**, so the Priority/Quotes adapters can replace it without UI changes.

## 6. Screens (see mockup)

Mockup: https://claude.ai/artifact/HBjqhMrGU5WgaxmxMb7fyx (three artboards, RTL Hebrew, demo data).

1. **Researcher card (MVP).** KPI row (available, used, open commitments, balance), stacked utilization bar, spend distribution by category with the 3K cap note on equipment, data-sources panel, recent transactions table (date, description, category, source, status, amount).
2. **Research Authority view.** KPI row, table per researcher (available, used, commitments, balance, utilization bar, deficit chip), aggregate spend by category, filters (department, negative balance only).
3. **Scope and next.** MVP vs later, as above.

Every mockup screen carries a "demo only, fictitious data" banner. Keep that banner on any deployment that uses fixtures.

## 7. Design

- **Source of truth:** the shared repo `appstelhai-cloud/telhai-design-system` and npm package `@appstelhai/brand-tokens` (Tailwind integration, Brandbook 2025 tokens, logo rules). **Use these tokens.**
- The mockup uses approximations, to be replaced: primary green `#2E7D32`, dark green `#1B5E20`, light green `#C8E3C5`, amber `#E0A030`, surface `#F4F6F2`, font Heebo. No logo yet. Add the current university logo per the brandbook (the 2019 procedure shows the old college logo).
- RTL throughout (`dir="rtl"`, `lang="he"`). Numbers and currency isolated LTR (`unicode-bidi: isolate`), format `9,000 ₪`.
- Hebrew typographic punctuation: ״ for gershayim (קק״מ, תשפ״ז), ׳ for geresh in demo names.
- Accessibility: text contrast 4.5:1, touch targets at least 44px, real `<table>`, `<button>`, `<a>`, never color alone (deficit has a chip plus bar color).
- Responsive: tables scroll horizontally inside their own container, KPI grid wraps.

## 8. Tech

- Next.js (App Router), TypeScript, Tailwind with `@appstelhai/brand-tokens`.
- GitHub repo, Vercel deployment. Env vars in Vercel, never in the repo.
- Auth: university SSO, TBD with Infosec. Until it exists, **do not deploy real data**. Use Vercel deployment protection for preview URLs.
- Authorization rules (design from day one): a researcher sees only their own data; Research Authority role sees all; every query is filtered server-side by identity. Do not rely on the client.
- Priority and Quotes credentials: server-side only.

## 9. Privacy

Personal KKM budgets are sensitive. No real researcher names or figures in the repo, fixtures, screenshots, or the demo. Demo data stays clearly fake.

## 10. Open questions (for the Accounting meeting and Research Authority)

1. Does Priority hold annual allocation and accrual as separate fields per researcher? Or only transactions?
2. How are KKM expenses recorded: a project/account per researcher, or a shared one? Is the researcher identifiable on each line?
3. Are expenses classified by the sec. 9 categories, or by accounting accounts that need a manual mapping?
4. What can Priority expose (OData, queries, export), who owns it, and at what refresh frequency?
5. Does Quotes carry the approved-not-paid state tied to KKM? Can its data be read per researcher?
6. Is the 2019 procedure still in force (amounts, caps, accrual rules, forfeiture)? Who is the current KKM coordinator?
7. Should the Research Authority see negative balances for all researchers? Should researchers see their own?
8. What other cuts does the Research Authority want (department, faculty, period)?
9. Which other funding sources exist at Tel-Hai (external grants, startup packages, donations, commercial contracts)? Which are managed in Priority, and which in another unit or system?
10. For grants: how are they identified in Priority (project code), can one grant have several researchers, and in what currency are they held?
11. Which source matters most to researchers after KKM? That decides the first extension.
12. monday: how many boards and users, who can change board structure, which request types run there, how much they really differ between researchers, is any data typed in by hand from Priority, is monday used by other units too (licence), and who in the Authority owns the process definition?
13. Vendor: what systems does their product read from and how often, does it hold its own data, are rules configurable, what is the permission model, is it in production elsewhere, and who owns data and code after the contract?

## 11. First tasks for Claude Code

1. Scaffold Next.js + TypeScript + Tailwind, install `@appstelhai/brand-tokens`, set RTL and Hebrew locale.
2. Define types: `Researcher`, `FundingSource` (section 4a), `BudgetYear`, `Allocation`, `Transaction`, `Commitment`, `Category`. Implement the KKM calculations in section 4 as a pure, tested per-source strategy (include negative balance and utilization over 100%).
3. Define a repository interface and a **mock adapter** loaded from the fixtures below.
4. Build the researcher card, then the Research Authority view, matching the mockup with brand tokens.
5. Add the "demo" banner and "as of" placeholder driven by data.
6. Push to GitHub, connect to Vercel, deploy a protected preview.
7. Stop before any Priority or Quotes adapter: wait for the answers in section 10.

## Appendix: demo fixtures (fictitious, from the mockup)

All fixtures below belong to one funding source: `{ id: 'kkm', type: 'institutional_personal', managementUnit: 'researcher', periodModel: 'budget_year', currency: 'ILS' }`.

Researcher card, budget year 2026-27: annual 10,000; accrued 6,000; used 5,200; committed 1,800; balance 9,000.

Used by category: conferences and research trips 2,300; research assistants 1,500; translation and editing 700; literature and subscriptions 400; equipment and materials 300 (cap 3,000).

Transactions (date, description, category, source, status, amount):
- 02.11.2026, research assistant salary Oct, research assistants, Priority, paid, 750
- 28.10.2026, conference registration [name], conferences, Priority, paid, 1,100
- 21.10.2026, article translation and editing, translation, Priority, paid, 700
- 14.10.2026, research equipment purchase, equipment, Quotes, approved unpaid, 1,200
- 09.10.2026, translation and editing quote, translation, Quotes, approved unpaid, 600

Research Authority rows (name, dept, annual, accrued, used, committed → balance):
- Researcher A, Dept A: 10,000 / 6,000 / 5,200 / 1,800 → 9,000
- Researcher B, Dept A: 10,000 / 10,000 / 2,100 / 0 → 17,900
- Researcher C, Dept B: 5,000 / 2,500 / 3,400 / 900 → 3,200
- Researcher D, Dept B: 10,000 / 0 / 9,300 / 1,500 → **-800 (deficit)**
- Researcher E, Dept C: 10,000 / 6,000 / 800 / 0 → 15,200
- Researcher F, Dept C: 7,500 / 3,000 / 4,600 / 1,200 → 4,700

Totals: available 80,000; used 25,400; committed 5,400; balance 49,200. By category: conferences 10,300; research assistants 7,400; translation 3,300; equipment 2,500; literature 1,900.