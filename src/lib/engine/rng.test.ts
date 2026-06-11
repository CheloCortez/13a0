import { describe, expect, test } from 'vitest';
import { Rng, randomSeed } from './rng';

describe('Rng', () => {
	test('mesma seed produz a mesma sequência', () => {
		const a = new Rng(42);
		const b = new Rng(42);
		const seqA = [a.next(), a.next(), a.next()];
		const seqB = [b.next(), b.next(), b.next()];
		expect(seqA).toEqual(seqB);
	});

	test('seeds diferentes produzem sequências diferentes', () => {
		const a = new Rng(1);
		const b = new Rng(2);
		expect([a.next(), a.next()]).not.toEqual([b.next(), b.next()]);
	});

	test('next retorna valores em [0, 1)', () => {
		const rng = new Rng(7);
		for (let i = 0; i < 1000; i++) {
			const v = rng.next();
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThan(1);
		}
	});

	test('estado é serializável: retomar do mesmo estado continua a sequência', () => {
		const a = new Rng(99);
		a.next();
		const resumed = new Rng(a.state);
		const b = new Rng(99);
		b.next();
		expect(resumed.next()).toBe(b.next());
	});

	test('int(n) retorna inteiro em [0, n)', () => {
		const rng = new Rng(5);
		for (let i = 0; i < 200; i++) {
			const v = rng.int(7);
			expect(Number.isInteger(v)).toBe(true);
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThan(7);
		}
	});

	test('randomSeed gera inteiro positivo', () => {
		const s = randomSeed();
		expect(Number.isInteger(s)).toBe(true);
		expect(s).toBeGreaterThan(0);
	});
});
