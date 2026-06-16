// Shared visual tokens for priority / confidence color-coding (Recall palette).
// high = needs attention (coral), medium = amber, low = comfortable (mint).
export const PRIORITY = {
  high: { label: 'High', hex: '#FF6B6B', chip: 'bg-coral/15 text-coral' },
  medium: { label: 'Medium', hex: '#FFC857', chip: 'bg-amber/15 text-amber' },
  low: { label: 'Low', hex: '#6FCF97', chip: 'bg-mint/15 text-mint' },
};

export const priorityOf = (p) => PRIORITY[p] || PRIORITY.medium;
