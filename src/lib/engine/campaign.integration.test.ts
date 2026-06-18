import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import type { Major } from '$lib/data/types';
import { createDraft, isComplete, pick, reroll } from './draft';
import { buildOpponents } from './opponents';
import { Rng } from './rng';
import { computeAchievements, shareText } from './share';
import { teamStrength } from './strength';
import { simulateTournament } from './tournament';

const dataDir = join(__dirname, '..', '..', '..', 'static', 'data', 'majors');
const majors: Major[] = readdirSync(dataDir)
	.filter((f) => f.endsWith('.json') && f !== 'index.json')
	.map((f) => JSON.parse(readFileSync(join(dataDir, f), 'utf-8')));

describe('campanha completa com os dados reais', () => {
	test('draft → torneio → compartilhamento funcionam de ponta a ponta', () => {
		let draft = createDraft(majors, 'classic', 2026);
		draft = reroll(draft, majors);
		while (!isComplete(draft)) {
			draft = pick(draft, majors, draft.offer!.team.players[0].nick);
		}

		expect(draft.picks).toHaveLength(5);
		const strength = teamStrength(draft.picks);
		expect(strength).toBeGreaterThan(0.7);
		expect(strength).toBeLessThan(1.45);

		const rng = new Rng((draft.seed ^ 0x9e3779b9) >>> 0);
		const opponents = buildOpponents(majors, rng);
		const user = { id: 'user', name: 'Seu Time', strength, isUser: true };
		const result = simulateTournament(user, opponents, rng);

		expect(result.swiss.qualified).toHaveLength(8);
		expect(result.userMatches.length).toBeGreaterThanOrEqual(3);
		expect(['fase suíça', 'quartas', 'semi', 'vice', 'campeão']).toContain(result.userFinish);

		const text = shareText({
			finish: result.userFinish,
			matches: result.userMatches,
			seed: draft.seed,
			mode: 'classic',
			picks: draft.picks
		});
		expect(text).toContain('#2026');
		expect(computeAchievements(result.userMatches)).toBeDefined();
	});

	test('mesma seed reproduz exatamente a mesma campanha', () => {
		const run = () => {
			let draft = createDraft(majors, 'almanac', 777);
			while (!isComplete(draft)) {
				draft = pick(draft, majors, draft.offer!.team.players[1].nick);
			}
			const rng = new Rng((draft.seed ^ 0x9e3779b9) >>> 0);
			const result = simulateTournament(
				{ id: 'user', name: 'Seu Time', strength: teamStrength(draft.picks), isUser: true },
				buildOpponents(majors, rng),
				rng
			);
			return {
				picks: draft.picks.map((p) => p.nick),
				finish: result.userFinish,
				grid: result.userMatches.map((m) => m.userWon)
			};
		};
		expect(run()).toEqual(run());
	});
});
