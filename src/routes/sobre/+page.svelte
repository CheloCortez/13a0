<script lang="ts">
	import { base } from '$app/paths';
</script>

<svelte:head>
	<title>13 a 0 — como jogar</title>
</svelte:head>

<section>
	<p class="tag">Briefing</p>
	<h2>Como jogar</h2>

	<div class="steps">
		<div class="panel step rise" style="--i: 0">
			<h3><span class="num">01</span> O draft</h3>
			<p>
				Em cada um dos 5 picks, o jogo sorteia um time real que disputou um Major de Counter-Strike
				(de 2013 até hoje). Você escolhe <strong>um jogador</strong> daquele elenco — qualquer
				função, sem restrição: pode até fechar o time com 5 AWPers.
			</p>
			<p>
				As funções (AWPer, IGL, Entry, Lurker e Suporte) se ajustam sozinhas a cada pick: quem tem o
				melhor rating assume a função natural e os demais são realocados. Jogador fora da função
				natural sofre penalidade de 15% no rating, times sem AWPer ou IGL de ofício perdem força, e
				cada AWPer de ofício além do primeiro custa 5% — só cabe uma AWP por rodada.
			</p>
		</div>

		<div class="panel step rise" style="--i: 1">
			<h3><span class="num">02</span> Os modos</h3>
			<p><strong>Clássico</strong> — os ratings dos jogadores ficam visíveis e você tem 3 re-sorteios.</p>
			<p>
				<strong>Almanaque</strong> — jogo às cegas: ratings, funções dos jogadores, colocações dos
				times, modificadores e a força do seu time ficam ocultos, e você só tem 1 re-sorteio. Vale o
				seu conhecimento da cena.
			</p>
		</div>

		<div class="panel step rise" style="--i: 2">
			<h3><span class="num">03</span> O Major</h3>
			<p>
				Seu time disputa um Major no formato real: fase suíça com 16 times (3 vitórias classificam, 3
				derrotas eliminam, decisões em MD3) e playoffs com 8 times em MD3. Os mapas são simulados
				round a round no MR12, com overtime.
			</p>
		</div>

		<div class="panel step rise" style="--i: 3">
			<h3><span class="num">04</span> O objetivo</h3>
			<p>
				Vencer o Major — e, para a glória máxima, vencer um mapa por <strong>13 a 0</strong>, o
				placar perfeito que dá nome ao jogo.
			</p>
		</div>
	</div>

	<div class="panel credits rise" style="--i: 4">
		<p class="muted">
			Inspirado no <a href="https://7a0.com.br" rel="noopener">7 a 0</a>, o simulador de Copa do
			Mundo criado por @chavozik4, e no 82-0 da NBA. Os elencos, funções e ratings são estimativas
			com base no desempenho histórico de cada jogador. Projeto de fã, sem afiliação com a Valve.
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

<style>
	.tag {
		margin: 1.1rem 0 0;
	}

	h2 {
		margin: 0.2rem 0 0.9rem;
		font-size: 1.5rem;
	}

	.steps {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}

	.step h3 {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		font-size: 1rem;
		margin: 0 0 0.4rem;
		color: var(--accent);
		letter-spacing: 0.08em;
	}

	.num {
		display: inline-grid;
		place-items: center;
		min-width: 1.9rem;
		padding: 0.06rem 0.3rem 0;
		background: var(--panel-3);
		box-shadow: inset 0 0 0 1px var(--border-strong);
		color: var(--accent-bright);
		font-variant-numeric: tabular-nums;
		clip-path: polygon(var(--cut-sm) 0, 100% 0, 100% calc(100% - var(--cut-sm)), calc(100% - var(--cut-sm)) 100%, 0 100%, 0 var(--cut-sm));
	}

	p {
		margin: 0.4rem 0;
		font-size: 0.95rem;
	}

	.credits {
		margin-top: 0.9rem;
		font-size: 0.85rem;
	}

	.back {
		margin-top: 1.2rem;
	}
</style>
