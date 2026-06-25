/** URL canônica de produção — fonte única para canonical, Open Graph e sitemap. */
export const SITE_URL = 'https://jogar13a0.com.br';
export const SITE_NAME = '13 a 0';
export const OG_IMAGE = `${SITE_URL}/og.png`;

/** Monta o XML de sitemap a partir de caminhos absolutos no site (ex.: "/", "/majors"). */
export function buildSitemapXml(paths: string[]): string {
	const urls = paths
		.map((p) => `\t<url>\n\t\t<loc>${SITE_URL}${p === '/' ? '' : p}</loc>\n\t</url>`)
		.join('\n');
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
