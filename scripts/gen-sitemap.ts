import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildSitemapXml } from '../src/lib/seo.ts';

const indexPath = fileURLToPath(new URL('../static/data/majors/index.json', import.meta.url));
const index = JSON.parse(readFileSync(indexPath, 'utf-8')) as { id: string }[];

const staticPaths = ['/', '/jogo', '/sobre', '/contato', '/privacidade', '/majors', '/campeoes'];
const majorPaths = index.map((m) => `/majors/${m.id}`);

const xml = buildSitemapXml([...staticPaths, ...majorPaths]);
const out = fileURLToPath(new URL('../static/sitemap.xml', import.meta.url));
writeFileSync(out, xml);

console.log(`sitemap.xml gerado com ${staticPaths.length + majorPaths.length} URLs`);
