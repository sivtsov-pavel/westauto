import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Пререндер головної сторінки під час збірки.
 *
 * Маркетинговий сайт має віддавати пошуковику готову розмітку, а не порожній
 * контейнер. Вітрина при цьому лишається клієнтською: її вміст змінюється
 * щодня і все одно не потрапив би у збірку.
 */
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const templatePath = join(root, 'dist', 'index.html');

const { render } = await import(join(root, 'dist-ssr', 'entry-server.js'));

const template = await readFile(templatePath, 'utf8');
const html = render('/');

if (!template.includes('<!--app-html-->')) {
  throw new Error('У dist/index.html немає маркера <!--app-html--> — пререндер неможливий');
}

const output = template
  .replace('<!--app-html-->', html)
  // Позначка для main.tsx: цю сторінку треба гідратувати, а не малювати з нуля
  .replace('<div id="root">', '<div id="root" data-prerendered="true">');

await writeFile(templatePath, output, 'utf8');

console.log(`[prerender] головну сторінку вбудовано в index.html (${html.length} символів)`);
