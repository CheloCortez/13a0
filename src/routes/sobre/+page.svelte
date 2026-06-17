<script lang="ts">
	import { base } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
	import SupportBlock from '$lib/components/SupportBlock.svelte';
</script>

<Seo
	title="13 a 0 — como jogar"
	description="Entenda as regras do 13 a 0: draft de 5 picks com elencos históricos dos Majors, funções, modificadores de força e a simulação do Major completo."
	path="/sobre"
/>

<section>
	<p class="tag">Briefing</p>
	<h2>Como jogar</h2>

	<div class="panel steps rise" style="--i: 0">
		<div class="step">
			<span class="num">01</span>
			<div class="icon-box">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<rect x="3" y="3" width="18" height="18" rx="2"/>
					<circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none"/>
					<circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" stroke="none"/>
					<circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none"/>
					<circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" stroke="none"/>
					<circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>
				</svg>
			</div>
			<strong class="step-title">Sorteie</strong>
			<p class="step-desc">Receba 5 elencos históricos de Majors, um por pick</p>
		</div>

		<div class="divider" aria-hidden="true"></div>

		<div class="step">
			<span class="num">02</span>
			<div class="icon-box">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
					<circle cx="12" cy="7" r="4"/>
				</svg>
			</div>
			<strong class="step-title">Escale</strong>
			<p class="step-desc">Escolha um jogador de cada — qualquer função, sem restrição</p>
		</div>

		<div class="divider" aria-hidden="true"></div>

		<div class="step">
			<span class="num">03</span>
			<div class="icon-box">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
					<path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
					<path d="M4 22h16"/>
					<path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
					<path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
					<path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
				</svg>
			</div>
			<strong class="step-title">Dispute</strong>
			<p class="step-desc">Jogue um Major completo: fase suíça + playoffs</p>
		</div>
	</div>

	<div class="panel credits rise" style="--i: 1">
		<p class="muted">
			Os elencos, funções e ratings são estimativas com base no desempenho histórico de cada
			jogador. Projeto de fã, sem afiliação com a Valve.
		</p>
		<p class="muted">
			Fotos dos jogadores, logos dos times e dados dos elencos da
			<a href="https://liquipedia.net/counterstrike" rel="noopener">Liquipedia</a>
			(CC-BY-SA 3.0). Fotos e logos são escolhidas pela época de cada Major, refletindo a camisa e a
			marca do time de cada jogador naquele torneio.
		</p>
	</div>

	<a class="btn back" href="{base}/">← Voltar</a>
</section>

<section>
	<h2>Apoie o 13 a 0</h2>
	<SupportBlock />
	<p class="disclaimer">
		Projeto de fã, sem fins lucrativos relevantes; não afiliado nem endossado pela Valve.
		Counter-Strike e os nomes de jogadores e equipes pertencem aos seus respectivos detentores.
	</p>
</section>

<style>
	.disclaimer {
		margin-top: 1.5rem;
		font-size: 0.8rem;
		color: var(--muted, #9aa7b4);
	}

	.tag {
		margin: 1.1rem 0 0;
	}

	h2 {
		margin: 0.2rem 0 0.9rem;
		font-size: 1.5rem;
	}

	.steps {
		display: flex;
		align-items: stretch;
		padding: 0;
	}

	.step {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.4rem;
		padding: 1.2rem 1.3rem;
	}

	.divider {
		width: 1px;
		background: var(--border);
		flex-shrink: 0;
	}

	.num {
		font-family: var(--font-display);
		font-size: 1.7rem;
		font-weight: 700;
		color: var(--accent);
		line-height: 1;
	}

	.icon-box {
		display: grid;
		place-items: center;
		width: 2.2rem;
		height: 2.2rem;
		background: var(--panel-2);
		box-shadow: inset 0 0 0 1px var(--border-strong);
		color: var(--muted);
		clip-path: polygon(var(--cut-sm) 0, 100% 0, 100% calc(100% - var(--cut-sm)), calc(100% - var(--cut-sm)) 100%, 0 100%, 0 var(--cut-sm));
	}

	.icon-box svg {
		width: 1.15rem;
		height: 1.15rem;
	}

	.step-title {
		font-family: var(--font-display);
		font-size: 0.95rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text);
	}

	.step-desc {
		margin: 0;
		font-size: 0.85rem;
		color: var(--muted);
		line-height: 1.4;
	}

	.credits {
		margin-top: 0.9rem;
		font-size: 0.85rem;
	}

	.back {
		margin-top: 1.2rem;
	}

	@media (max-width: 540px) {
		.steps {
			flex-direction: column;
		}

		.divider {
			width: auto;
			height: 1px;
		}
	}
</style>
