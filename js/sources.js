/**
 * Groups a researcher's funding items by source type for the main screen (pure).
 * Deliberately has NO totals: money is earmarked per source and fund, so a cross-source sum would mislead (CIO meeting 16.11).
 */
export function groupSources(items, types) {
  const groups = Object.entries(types)
    .map(([type, meta]) => ({ type, label: meta.label, order: meta.order, items: items.filter(i => i.type === type) }))
    .filter(g => g.items.length > 0)
    .sort((a, b) => a.order - b.order);
  return groups.map(({ order, ...g }) => g);
}
