import { describe, it, expect } from 'vitest';
import { sortMajorsByYear } from './content';
import type { MajorIndexEntry } from './types';

const sample: MajorIndexEntry[] = [
	{ id: 'a', name: 'A', year: 2014, city: 'X', champion: 'T1' },
	{ id: 'b', name: 'B', year: 2013, city: 'Y', champion: 'T2' },
	{ id: 'c', name: 'C', year: 2014, city: 'Z', champion: 'T3' }
];

describe('sortMajorsByYear', () => {
	it('ordena ascendente por ano, preservando ordem original em empates', () => {
		expect(sortMajorsByYear(sample, 'asc').map((m) => m.id)).toEqual(['b', 'a', 'c']);
	});

	it('ordena descendente por ano, mantendo ordem original dentro do mesmo ano', () => {
		expect(sortMajorsByYear(sample, 'desc').map((m) => m.id)).toEqual(['a', 'c', 'b']);
	});

	it('não muta o array original', () => {
		const copy = [...sample];
		sortMajorsByYear(sample, 'desc');
		expect(sample).toEqual(copy);
	});
});
