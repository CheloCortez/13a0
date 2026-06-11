/**
 * PRNG determinístico (mulberry32) com estado serializável,
 * para campanhas reproduzíveis via seed na URL e retomada do localStorage.
 */
export class Rng {
	constructor(public state: number) {
		this.state = state >>> 0;
	}

	/** Próximo número em [0, 1). */
	next(): number {
		this.state = (this.state + 0x6d2b79f5) >>> 0;
		let t = this.state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}

	/** Inteiro em [0, n). */
	int(n: number): number {
		return Math.floor(this.next() * n);
	}
}

/** Seed aleatória para novas campanhas. */
export function randomSeed(): number {
	return Math.floor(Math.random() * 0xffffffff) + 1;
}
