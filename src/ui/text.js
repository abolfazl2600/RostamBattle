// Presentation only: do not change IDs, save schemas or numeric game values.
export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const numberFa = value => new Intl.NumberFormat('fa-IR').format(value);
export const ltr = value => `<bdi dir="ltr">${escapeHtml(value)}</bdi>`;
