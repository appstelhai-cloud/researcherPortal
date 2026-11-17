/**
 * Repository interface (JSDoc) + mock adapter.
 * UI code depends only on this interface. Priority/Quotes adapters will replace the mock later.
 *
 * NOTE: authorization (researcher sees only own data; Research Authority sees all) MUST be
 * enforced server-side by identity in a real adapter. This client-only mock does not enforce it
 * and must never hold real data.
 *
 * @typedef {Object} PortalRepository
 * @property {() => Promise<string>} getAsOf
 * @property {() => Promise<{label:string, range:string, start:string, end:string}>} getBudgetYear
 * @property {() => Promise<Object>} getCategories
 * @property {(researcherId:string) => Promise<Object>} getResearcherCard
 * @property {() => Promise<Array>} listResearcherSummaries
 * @property {() => Promise<Object>} getCategoryTotals
 */
import * as fx from './fixtures.js';
import * as rx from './research-fixtures.js';
import * as cx from './calls-fixtures.js';
import * as qx from './requests-fixtures.js';
import * as dx from './donors-fixtures.js';
import * as mx from './monday-fixtures.js';
import { kkmStrategy } from './kkm.js';
import { grantStrategy } from './grant.js';
import { groupSources } from './sources.js';
import { MAPPING, MONDAY_BOARD } from './config-mapping.js';
import { checkMondayColumns } from './monday-monitor.js';
import { LATENCY_MS } from './config.js';
import { donationFlags, nextReportDue } from './donors-logic.js';
import { elapsedShare } from './pace.js';

// One strategy per funding source: no if(kkm) branches in shared code. The startup package behaves like a fixed-budget grant.
const strategies = { kkm: kkmStrategy, grant: grantStrategy, intake: grantStrategy };

function withResearchDetail(r) {
  return {
    ...r,
    source: rx.GRANT_SOURCE,
    summary: strategies.grant.summarize(r),
    participants: r.participants.map(p => {
      const person = fx.RESEARCHERS.find(x => x.id === p.id);
      return { id: p.id, name: person.name, dept: person.dept, role: p.role };
    })
  };
}

function summarizeResearcher(r) {
  return { ...r, summary: strategies[r.fundingSourceId].summarize(r) };
}

const base = {
  async getAsOf() { return fx.AS_OF; },
  async getBudgetYear() { return fx.BUDGET_YEAR; },
  async getCategories() { return fx.CATEGORIES; },

  async getResearcherCard(researcherId) {
    const r = fx.RESEARCHERS.find(x => x.id === researcherId);
    if (!r) throw new Error('researcher not found');
    const source = fx.FUNDING_SOURCES.find(s => s.id === r.fundingSourceId);
    // Demo detail (categories, transactions) exists for researcher A only.
    const hasDetail = r.id === 'a';
    return {
      researcher: { id: r.id, name: r.name, dept: r.dept },
      sources: [{
        source,
        summary: strategies[source.id].summarize(r),
        categoryUsed: hasDetail ? fx.CATEGORY_USED_A : {},
        transactions: hasDetail ? fx.TRANSACTIONS_A : []
      }]
    };
  },

  /** All researches, each with its summary and participant names. Real adapter: filtered server-side by role. */
  async listResearches({ researcherId } = {}) {
    return rx.RESEARCHES
      .filter(r => !researcherId || r.participants.some(p => p.id === researcherId))
      .map(withResearchDetail);
  },

  async getResearch(id) {
    const r = rx.RESEARCHES.find(x => x.id === id);
    if (!r) throw new Error('research not found');
    return withResearchDetail(r);
  },

  /** External calls only, from the aggregator. Exposure/routing is applied by the caller (calls-logic.js). */
  async listCalls() {
    return [...cx.CALLS].sort((a, b) => a.deadline.localeCompare(b.deadline));
  },
  async getCallAreas() { return cx.AREAS; },

  /** The researcher's funding items grouped by source type. Only relevant sources appear; there is no cross-source total. */
  async listSourcesForResearcher(researcherId) {
    const r = fx.RESEARCHERS.find(x => x.id === researcherId);
    if (!r) throw new Error('researcher not found');
    const items = [{
      type: 'kkm', kind: 'source', id: 'kkm', title: 'קרן קשרי מדע (קק״מ)', summary: strategies.kkm.summarize(r), href: 'source.html?id=kkm'
    }];
    const pkg = fx.STARTUP_PACKAGES.find(p => p.researcherId === researcherId);
    if (pkg) items.push({
      type: 'intake', kind: 'source', id: 'intake', title: 'תקציב קליטה', summary: strategies.intake.summarize(pkg),
      period: { start: pkg.start, end: pkg.end }, href: 'source.html?id=intake'
    });
    for (const res of rx.RESEARCHES.filter(x => x.participants.some(p => p.id === researcherId))) {
      const d = withResearchDetail(res);
      items.push({
        type: res.sourceType, kind: 'research', id: res.id, title: res.title, center: res.center, funder: res.funder,
        summary: d.summary, period: { start: res.start, end: res.end }, href: `research.html?id=${res.id}&from=mine`
      });
    }
    return groupSources(items, fx.SOURCE_TYPES);
  },

  /** One source of one researcher: summary and transactions (with budget item and expense type). */
  async getSourceDetail(researcherId, sourceId) {
    const r = fx.RESEARCHERS.find(x => x.id === researcherId);
    if (!r) throw new Error('researcher not found');
    if (sourceId === 'kkm') {
      const card = await base.getResearcherCard(researcherId);
      return { researcher: card.researcher, type: 'kkm', ...card.sources[0] };
    }
    const pkg = fx.STARTUP_PACKAGES.find(p => p.id === `intake-${researcherId}`);
    if (sourceId !== 'intake' || !pkg) throw new Error('source not found');
    return {
      researcher: { id: r.id, name: r.name, dept: r.dept }, type: 'intake',
      source: fx.FUNDING_SOURCES.find(s => s.id === 'intake'),
      summary: strategies.intake.summarize(pkg), period: { start: pkg.start, end: pkg.end },
      categoryUsed: {}, transactions: researcherId === 'a' ? fx.TRANSACTIONS_INTAKE_A : []
    };
  },
  async getSourceTypes() { return fx.SOURCE_TYPES; },
  async getBudgetItems(type) { return fx.BUDGET_ITEMS[type] ?? []; },

  /**
   * Donor reports show ACTUAL spend only (no open commitments, no balance): a donor sees what was executed.
   * Real adapter: a donor identity may only read its own donations, filtered server-side.
   */
  async listDonors() { return dx.DONORS.map(d => ({ id: d.id, name: d.name })); },
  async getDonorReport(donorId) {
    const donor = dx.DONORS.find(d => d.id === donorId);
    if (!donor) throw new Error('donor not found');
    return {
      donor: { id: donor.id, name: donor.name },
      donations: donor.donations.map(don => {
        const res = rx.RESEARCHES.find(x => x.id === don.researchId);
        const paid = res.transactions.filter(t => t.status === 'paid');
        const byCategory = {};
        for (const t of paid) byCategory[t.budgetItem ?? 'אחר'] = (byCategory[t.budgetItem ?? 'אחר'] ?? 0) + t.amount;
        return {
          researchId: res.id, title: res.title, center: res.center, since: don.since,
          pledged: don.pledged, actualSpent: res.used, share: res.used / don.pledged,
          paid, byCategory, purpose: don.purpose, outputs: don.outputs, updates: don.updates,
          nextReport: nextReportDue(don), contact: donor.contact, period: { start: res.start, end: res.end }
        };
      })
    };
  },

  /** External Relations unit: every donation with fundraising facts and the flags to act on. Internal only, never shown to donors. */
  async listDonationsOverview() {
    const rows = [];
    for (const donor of dx.DONORS) for (const don of donor.donations) {
      const res = rx.RESEARCHES.find(x => x.id === don.researchId);
      const pi = res.participants.find(p => p.role === 'pi');
      const f = donationFlags({ don, research: res, asOfIso: fx.AS_OF });
      rows.push({
        donorId: donor.id, donor: donor.name, researchId: res.id, title: res.title, center: res.center,
        pi: fx.RESEARCHERS.find(x => x.id === pi.id).name, coordinator: don.coordinator, lastContact: don.lastContact,
        pledged: don.pledged, received: don.received, used: res.used, committed: res.committed, currency: res.currency,
        start: res.start, end: res.end, lastReport: don.lastReport, ...f
      });
    }
    return rows;
  },
  async listCoordinators() { return dx.COORDINATORS; },

  /** Research Authority: every funding item in the institution, one flat list (no totals). Real adapter: role-filtered server-side. */
  async listAllSources() {
    const asOf = fx.AS_OF, year = fx.BUDGET_YEAR;
    const items = fx.RESEARCHERS.map(r => ({
      type: 'kkm', id: `kkm-${r.id}`, title: r.name, center: r.dept, owner: r.name, ownerIds: [r.id],
      period: { start: year.start, end: year.end }, currency: 'ILS', summary: strategies.kkm.summarize(r)
    }));
    for (const p of fx.STARTUP_PACKAGES) {
      const r = fx.RESEARCHERS.find(x => x.id === p.researcherId);
      items.push({ type: 'intake', id: p.id, title: r.name, center: r.dept, owner: r.name, ownerIds: [r.id],
        period: { start: p.start, end: p.end }, currency: p.currency, summary: strategies.intake.summarize(p) });
    }
    for (const res of rx.RESEARCHES.map(withResearchDetail)) {
      const pi = res.participants.find(p => p.role === 'pi');
      items.push({ type: res.sourceType, id: res.id, title: res.title, center: res.center, funder: res.funder,
        owner: `${pi.name} · ${res.participants.length} חוקרים`, ownerIds: res.participants.map(p => p.id),
        period: { start: res.start, end: res.end }, currency: res.currency, summary: res.summary, href: `research.html?id=${res.id}` });
    }
    return items.map(i => ({ ...i, elapsed: elapsedShare(i.period, asOf) }));
  },
  async listResearchers() { return fx.RESEARCHERS.map(r => ({ id: r.id, name: r.name, dept: r.dept })); },

  async getMapping() { return MAPPING; },
  async getMondayHub() {
    return { required: MAPPING.mondayRequired, connection: mx.MONDAY_CONNECTION, boards: mx.MONDAY_BOARDS, templates: mx.BOARD_TEMPLATES, rules: mx.SYNC_RULES, log: mx.SYNC_LOG };
  },
  async getMondayMonitor() {
    return { board: MONDAY_BOARD, results: checkMondayColumns(MAPPING.mondayRequired, MONDAY_BOARD.columns) };
  },

  async getResearchRoles() { return rx.ROLES; },

  /** Request tracking (concept). Real adapter: researchers see only their own, the Authority sees all, filtered server-side. */
  async getRequestMeta() { return { types: qx.REQUEST_TYPES, roles: qx.ROLE_LABELS }; },
  async listRequests({ researcherId } = {}) {
    return qx.REQUESTS
      .filter(r => !researcherId || r.researcherId === researcherId)
      .map(r => ({ ...r, researcher: fx.RESEARCHERS.find(x => x.id === r.researcherId)?.name ?? '' }));
  },

  async listResearcherSummaries() { return fx.RESEARCHERS.map(summarizeResearcher); },
  async getCategoryTotals() { return fx.CATEGORY_USED_ALL; }
};

/** Simulated network latency, so loading states are real. Zero in static mode and tests. getAsOf stays instant. */
const wait = () => new Promise(res => setTimeout(res, LATENCY_MS));
export const mockRepository = Object.fromEntries(Object.entries(base).map(([name, fn]) => [
  name,
  async (...args) => { if (LATENCY_MS && name !== 'getAsOf') await wait(); return fn(...args); }
]));
