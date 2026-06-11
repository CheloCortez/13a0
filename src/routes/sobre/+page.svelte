<script lang="ts">
	import { base } from '$app/paths';
</script>

<svelte:head>
	<title>13 a 0 — como jogar</title>
</svelte:head>

<section>
	<h2>Como jogar</h2>

	<div class="panel">
		<h3>1. O draft</h3>
		<p>
			Em cada uma das 5 rodadas, o jogo sorteia um time real que disputou um Major de
			Counter-Strike (de 2013 até hoje). Você escolhe <strong>um jogador</strong> daquele elenco
			para uma função específica do seu time: AWPer, IGL, Entry, Lurker e Suporte.
		</p>
		<p>
			Pode escalar um jogador fora da função natural dele (um AWPer como IGL, por exemplo), mas o
			rating dele sofre penalidade de 15%. Times sem AWPer ou IGL de ofício também perdem força.
		</p>

		<h3>2. Os modos</h3>
		<p><strong>Clássico</strong> — os ratings dos jogadores ficam visíveis e você tem 3 re-sorteios.</p>
		<p>
			<strong>Almanaque</strong> — os ratings ficam ocultos e você só tem 1 re-sorteio: vale o seu
			conhecimento da cena.
		</p>

		<h3>3. O Major</h3>
		<p>
			Seu time disputa um Major no formato real: fase suíça com 16 times (3 vitórias classificam, 3
			derrotas eliminam, decisões em MD3) e playoffs com 8 times em MD3. Os mapas são simulados
			round a round no MR12, com overtime.
		</p>

		<h3>4. O objetivo</h3>
		<p>
			Vencer o Major — e, para a glória máxima, vencer um mapa por <strong>13 a 0</strong>, o
			placar perfeito que dá nome ao jogo.
		</p>
	</div>

	<div class="panel credits">
		<p class="muted">
			Inspirado no <a href="https://7a0.com.br" rel="noopener">7 a 0</a>, o simulador de Copa do
			Mundo criado por @chavozik4, e no 82-0 da NBA. Os elencos, funções e ratings são estimativas
			com base no desempenho histórico de cada jogador. Projeto de fã, sem afiliação com a Valve.
		</p>
	</div>

	<a class="btn" href="{base}/">Voltar</a>
</section>

<style>
	h2 {
		margin: 1rem 0 0.6rem;
	}

	h3 {
		font-size: 1rem;
		margin: 1rem 0 0.3rem;
		color: var(--accent);
	}

	h3:first-child {
		margin-top: 0;
	}

	p {
		margin: 0.4rem 0;
		font-size: 0.95rem;
	}

	.credits {
		margin-top: 1rem;
		font-size: 0.85rem;
	}

	.btn {
		margin-top: 1.2rem;
	}
</style>
