// Configuração de monetização. Campos vazios fazem a UI esconder o respectivo elemento.

/**
 * Número WhatsApp para contato de anunciantes.
 * Formato: código do país + DDD + número, sem +, espaços ou traços.
 * Exemplo (SP): '5511999999999'
 * Vazio = link de contato mostra '#' (colunas de anúncio ainda aparecem).
 */
export const WHATSAPP_NUMBER = '5511955771210';

/** Payload "Pix Copia e Cola" (BR Code/EMV) gerado pelo banco a partir da chave aleatória. */
export const PIX_PAYLOAD =
	'00020126580014BR.GOV.BCB.PIX0136b1c7adf2-7ade-44c5-9fcd-e406fb6b0c0f5204000053039865802BR5923Marcelo Cortez Monteiro6009SAO PAULO62140510fDt5sjmTEY63044FDD';

/** Caminho (em static/) do QR gerado a partir do PIX_PAYLOAD. Vazio = sem imagem de QR. */
export const PIX_QR_SRC = '/pix-qr.svg';

/** URL do perfil/página Ko-fi. Vazio = esconde o botão. */
export const KOFI_URL = '';

/** AdSense: client (ex: 'ca-pub-XXXXXXXXXXXXXXXX') e slot (ex: '1234567890'). Vazios = sem anúncio. */
export const ADSENSE_CLIENT = 'ca-pub-7295597162305772';
export const ADSENSE_SLOT = '6574391059';
