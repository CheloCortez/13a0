import { error } from '@sveltejs/kit';
import type { Major } from '$lib/data/types';
import type { EntryGenerator, PageLoad } from './$types';

const modules = import.meta.glob<Major>(
	['../../../../static/data/majors/*.json', '!../../../../static/data/majors/index.json'],
	{ eager: true, import: 'default' }
);

const byId = new Map<string, Major>();
for (const major of Object.values(modules)) byId.set(major.id, major);

export const entries: EntryGenerator = () => [...byId.keys()].map((id) => ({ id }));

export const load: PageLoad = ({ params }) => {
	const major = byId.get(params.id);
	if (!major) throw error(404, 'Major não encontrado');
	return { major };
};
