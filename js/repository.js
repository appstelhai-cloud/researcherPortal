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
import { kkmStrategy } from './kkm.js';
import { grantStrategy } from './grant.js';
import { LATENCY_MS } from './config.js';

// One strategy per funding source: no if(kkm) branches in shared code.
const strategies = { kkm: kkmStrategy, grant: grantStrategy };

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

  async getCallKinds() {
    return Object.fromEntries(Object.entries(cx.CALL_KINDS).map(([k, v]) => [k, { label: v.label }]));
  },
  async listCalls({ kind } = {}) {
    return cx.CALLS.filter(c => !kind || c.kind === kind).sort((a, b) => a.deadline.localeCompare(b.deadline));
  },

  async getResearchRoles() { return rx.ROLES; },

  async listResearcherSummaries() { return fx.RESEARCHERS.map(summarizeResearcher); },
  async getCategoryTotals() { return fx.CATEGORY_USED_ALL; }
};

/** Simulated network latency, so loading states are real. Zero in static mode and tests. getAsOf stays instant. */
const wait = () => new Promise(res => setTimeout(res, LATENCY_MS));
export const mockRepository = Object.fromEntries(Object.entries(base).map(([name, fn]) => [
  name,
  async (...args) => { if (LATENCY_MS && name !== 'getAsOf') await wait(); return fn(...args); }
]));
