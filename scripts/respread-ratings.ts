/**
 * Espalha os ratings grosseiros (passos de 0,05) dos JSONs de Majors em valores
 * granulares e mais realistas, de forma DETERMINÍSTICA.
 *
 * Uso: npm run respread-ratings
 *
 * Migração de mão única: lê os valores atuais e os reescreve. Para retunar a
 * fórmula, restaure os JSONs do git antes de re-rodar:
 *   git checkout static/data/majors && npm run respread-ratings
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ===== Parâmetros do spread =====
const PIVOT = 1.05; // centro em torno do qual a distribuição é expandida
const GAIN = 1.5; // >1 afasta estrelas (p/ cima) e elos fracos (p/ baixo)
const JITTER = 0.05; // amplitude do ruído determinístico (± por jogador)
const RATING_MIN = 0.8;
const RATING_MAX = 1.45;

const PLACEMENT_BIAS: Record<string, number> = {
	Campeão: 0.03,
	Vice: 0.02,
	'3º-4º': 0.01,
	'5º-8º': 0.0
};
const placementBias = (placement: string): number => PLACEMENT_BIAS[placement] ?? -0.01;

/** FNV-1a 32-bit → mulberry32 → 1 float em [0,1). Estável por string. */
function hash01(str: string): number {
	let h = 0x811c9dc5;
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	let s = h >>> 0;
	s = (s + 0x6d2b79f5) | 0;
	let t = Math.imul(s ^ (s >>> 15), 1 | s);
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const round2 = (x: number) => Math.round(x * 100) / 100;

function newRating(v: number, nick: string, majorId: string, placement: string): number {
	const expanded = PIVOT + (v - PIVOT) * GAIN;
	const bias = placementBias(placement);
	const jitter = (hash01(`${nick}|${majorId}`) - 0.5) * 2 * JITTER;
	return round2(clamp(expanded + bias + jitter, RATING_MIN, RATING_MAX));
}

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'static', 'data', 'majors');
const files = readdirSync(dataDir).filter((f) => f.endsWith('.json') && f !== 'index.json');

let totalPlayers = 0;
const samples: string[] = [];

for (const file of files) {
	const majorId = file.replace(/\.json$/, '');
	const raw = readFileSync(join(dataDir, file), 'utf-8');
	const major = JSON.parse(raw);

	// nick -> colocação do time (nicks são únicos dentro de um major)
	const placementByNick = new Map<string, string>();
	for (const team of major.teams ?? []) {
		for (const p of team.players ?? []) placementByNick.set(p.nick, team.placement);
	}

	// Substituição linha a linha (cada jogador está numa única linha) p/ preservar o layout.
	const lineRe = /"nick":\s*"([^"]+)"[\s\S]*?"rating":\s*(-?\d+(?:\.\d+)?)/;
	const out = raw
		.split('\n')
		.map((line) => {
			const m = line.match(lineRe);
			if (!m) return line;
			const nick = m[1];
			const old = Number(m[2]);
			const placement = placementByNick.get(nick) ?? '';
			const next = newRating(old, nick, majorId, placement);
			totalPlayers++;
			if (samples.length < 8) samples.push(`${majorId} ${nick}: ${old} -> ${next}`);
			return line.replace(/("rating":\s*)-?\d+(?:\.\d+)?/, `$1${next}`);
		})
		.join('\n');

	writeFileSync(join(dataDir, file), out);
}

console.log(`✓ ${files.length} majors, ${totalPlayers} jogadores reescritos.`);
console.log('Amostras:\n  ' + samples.join('\n  '));
