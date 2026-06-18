<script lang="ts">
	import { base } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
</script>

<Seo
	title="13 a 0 — Política de privacidade"
	description="Como o 13 a 0 trata dados, armazenamento local, cookies e serviços de terceiros (Google AdSense e Vercel Analytics)."
	path="/privacidade"
/>

<section>
	<p class="tag">Transparência</p>
	<h2>Política de privacidade</h2>

	<div class="panel doc">
		<p class="muted updated">Última atualização: 18 de junho de 2026.</p>

		<p>
			O <strong>13 a 0</strong> é um jogo de navegador, gratuito e sem cadastro. Não pedimos nome,
			e-mail nem qualquer dado pessoal para você jogar. Esta página explica, de forma simples, o que
			acontece com informações enquanto você usa o site.
		</p>

		<h3>Dados que guardamos no seu navegador</h3>
		<p>
			O progresso da sua campanha e algumas preferências ficam salvos apenas no
			<strong>armazenamento local (localStorage)</strong> do seu próprio navegador — nunca são
			enviados para um servidor nosso (não temos servidor de contas). Limpar os dados do site no
			navegador apaga essas informações.
		</p>

		<h3>Métricas de uso</h3>
		<p>
			Usamos <strong>Vercel Analytics</strong> e <strong>Speed Insights</strong> para entender o
			volume de acessos e o desempenho das páginas, de forma agregada e anônima. Esses dados não
			identificam você individualmente.
		</p>

		<h3>Anúncios e cookies de terceiros</h3>
		<p>
			Para ajudar a cobrir os custos do site, exibimos anúncios do <strong>Google AdSense</strong>.
			O Google e seus parceiros podem usar cookies para exibir anúncios com base em visitas suas a
			este e a outros sites. Você pode gerenciar ou desativar a personalização de anúncios nas
			<a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer"
				>configurações de anúncios do Google</a
			>
			e saber mais na
			<a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer"
				>política de publicidade do Google</a
			>. Você também pode bloquear ou apagar cookies diretamente nas configurações do seu navegador.
		</p>

		<h3>Conteúdo de terceiros</h3>
		<p>
			Fotos de jogadores, logos e dados de elencos vêm da
			<a href="https://liquipedia.net/counterstrike" target="_blank" rel="noopener noreferrer"
				>Liquipedia</a
			>
			(CC-BY-SA 3.0). Projeto de fã, sem fins lucrativos relevantes e sem afiliação com a Valve;
			Counter-Strike e os nomes de jogadores e equipes pertencem aos seus respectivos detentores.
		</p>

		<h3>Contato</h3>
		<p>
			Dúvidas sobre privacidade? Fale com a gente pela <a href="{base}/contato">página de contato</a>.
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

	.doc {
		padding: 1.3rem 1.4rem;
	}

	.doc p {
		font-size: 0.92rem;
		line-height: 1.55;
		margin: 0 0 0.9rem;
	}

	.doc p:last-child {
		margin-bottom: 0;
	}

	.updated {
		font-size: 0.8rem;
	}

	.doc h3 {
		font-family: var(--font-display);
		font-size: 1.02rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--accent-bright);
		margin: 1.3rem 0 0.5rem;
	}

	.doc a {
		color: var(--accent-bright);
	}

	.back {
		margin-top: 1.2rem;
	}
</style>
