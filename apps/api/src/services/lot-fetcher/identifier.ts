/** Общая для адаптеров классификация — вынесена, чтобы не тянуть index.ts по кругу. */
export function classifyIdentifierLocal(raw: string): 'lot' | 'vin' | 'unknown' {
  const value = raw.trim().toUpperCase();
  if (/^\d{6,10}$/.test(value)) return 'lot';
  if (/^[A-HJ-NPR-Z0-9]{17}$/.test(value)) return 'vin';
  return 'unknown';
}
