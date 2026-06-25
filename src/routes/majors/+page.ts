import majorsIndex from '../../../static/data/majors/index.json';
import { sortMajorsByYear } from '$lib/data/content';
import type { MajorIndexEntry } from '$lib/data/types';
import type { PageLoad } from './$types';

export const load: PageLoad = () => ({
	majors: sortMajorsByYear(majorsIndex as MajorIndexEntry[], 'desc')
});
