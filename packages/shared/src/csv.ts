/**
 * Разбор и сборка табличных данных для импорта тарифов.
 *
 * Намеренно без библиотеки чтения .xlsx: и Excel, и Google Sheets умеют
 * сохранять в CSV, а скопированный из таблицы фрагмент приезжает в буфер
 * обмена как TSV. Эти два формата покрывают задачу целиком и не тянут
 * тяжёлую зависимость с собственной историей уязвимостей.
 */

/** Разбирает CSV или TSV, разделитель определяется по первой строке. */
export function parseDelimited(text: string): string[][] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (normalized === '') return [];

  const delimiter = detectDelimiter(normalized);
  const rows: string[][] = [];

  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i]!;

    if (inQuotes) {
      if (char === '"') {
        // Удвоенная кавычка внутри поля — это экранированная кавычка
        if (normalized[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field.trim());
      field = '';
    } else if (char === '\n') {
      row.push(field.trim());
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  row.push(field.trim());
  rows.push(row);

  // Пустые строки в конце файла — обычное дело, они не данные
  return rows.filter((r) => r.some((cell) => cell !== ''));
}

function detectDelimiter(text: string): string {
  const firstLine = text.split('\n')[0] ?? '';
  const counts: [string, number][] = [
    ['\t', (firstLine.match(/\t/g) ?? []).length],
    [';', (firstLine.match(/;/g) ?? []).length],
    [',', (firstLine.match(/,/g) ?? []).length],
  ];
  counts.sort((a, b) => b[1] - a[1]);
  // Ни одного разделителя — считаем запятой, разбор просто даст один столбец
  return counts[0]![1] > 0 ? counts[0]![0] : ',';
}

/** Собирает CSV с разделителем «;» — его Excel открывает без диалога импорта. */
export function toCsv(rows: (string | number | null)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell === null || cell === undefined ? '' : String(cell);
          return /[";\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(';'),
    )
    .join('\n');
}

/** «1 640», «$1,640.00», «1640,5» → 1640 / 1640.5. Мусор → null. */
export function parseNumericCell(raw: string): number | null {
  const cleaned = raw
    .replace(/[\s  ]/g, '')
    .replace(/[$€₴%]/g, '')
    .trim();
  if (cleaned === '') return null;

  // «1,640.00» — запятая как разделитель тысяч; «1640,5» — как десятичный
  const normalized =
    /,\d{3}(\D|$)/.test(cleaned) || (cleaned.includes(',') && cleaned.includes('.'))
      ? cleaned.replace(/,/g, '')
      : cleaned.replace(',', '.');

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** Строка заголовка похожа на заголовок, а не на данные. */
export function looksLikeHeader(row: string[]): boolean {
  return row.every((cell) => parseNumericCell(cell) === null);
}
