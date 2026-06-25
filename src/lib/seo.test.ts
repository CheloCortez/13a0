import { describe, it, expect } from 'vitest';
import { buildSitemapXml } from './seo';

describe('buildSitemapXml', () => {
	it('começa com o cabeçalho XML e o urlset', () => {
		const xml = buildSitemapXml(['/']);
		expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
		expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
	});

	it('trata a home sem barra dupla e monta urls absolutas', () => {
		const xml = buildSitemapXml(['/', '/majors', '/majors/katowice-2015']);
		expect(xml).toContain('<loc>https://jogar13a0.com.br</loc>');
		expect(xml).toContain('<loc>https://jogar13a0.com.br/majors</loc>');
		expect(xml).toContain('<loc>https://jogar13a0.com.br/majors/katowice-2015</loc>');
	});
});
