/**
 * Minimal, dependency-free CSV builder.
 *
 * @param {Array<object>} rows
 * @param {Array<{ label: string, key?: string, value?: (row) => any }>} columns
 * @returns {string}
 */
function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows, columns) {
  const header = columns.map((c) => escapeCell(c.label)).join(',');
  const lines = rows.map((row) =>
    columns
      .map((c) => escapeCell(typeof c.value === 'function' ? c.value(row) : row[c.key]))
      .join(',')
  );
  return [header, ...lines].join('\r\n');
}

module.exports = { toCsv, escapeCell };
