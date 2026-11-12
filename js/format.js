const nf = new Intl.NumberFormat('en-US');

/** "9,000 ₪" (negative: "-800 ₪"). Wrap in an LTR-isolated span when rendered. */
export function formatILS(n) {
  return `${nf.format(Math.round(n))} ₪`;
}

const SYMBOL = { ILS: '₪', EUR: '€', USD: '$' };
/** Amount in its original currency (grants may be EUR/USD). ILS conversion is out of scope until Accounting confirms a rate. */
export function formatMoney(n, currency = 'ILS') {
  return `${nf.format(Math.round(n))} ${SYMBOL[currency] ?? currency}`;
}

export function formatPercent(ratio) {
  return `${Math.round(ratio * 100)}%`;
}

/** ISO date -> DD.MM.YYYY */
export function formatDate(iso) {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
}

/** Small DOM helper. Always uses textContent, never innerHTML. */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) if (c != null) node.append(c);
  return node;
}

/** Number/currency span isolated LTR inside RTL text. */
export function ltr(text) {
  return el('span', { class: 'ltr', text });
}
