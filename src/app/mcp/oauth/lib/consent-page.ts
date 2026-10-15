import { OAUTH_PATHS } from '../constants/oauth.constants';

/**
 * CSP para la página de consentimiento.
 *
 * `form-action` debe incluir el origen del `redirect_uri`: al enviar el
 * formulario, el navegador sigue el 302 hacia el cliente y lo bloquea si el
 * origen no está permitido (`form-action 'self'` sola rompe el flujo OAuth).
 */
export function buildConsentCsp(redirectOrigin: string): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "font-src 'self' https: data:",
    `form-action 'self' ${redirectOrigin}`,
    "frame-ancestors 'self'",
    "img-src 'self' data:",
    "object-src 'none'",
    "script-src 'self'",
    "script-src-attr 'none'",
    "style-src 'self' https: 'unsafe-inline'",
    'upgrade-insecure-requests',
  ].join('; ');
}

/** Escapa texto para insertarlo de forma segura en HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface ConsentPageData {
  clientName: string;
  client_id: string;
  redirect_uri: string;
  response_type: string;
  code_challenge: string;
  code_challenge_method: string;
  scope: string;
  state: string;
  resource: string;
}

/** Página HTML de consentimiento (mínima) que envía la contraseña de admin. */
export function renderConsentPage(
  data: ConsentPageData,
  showError: boolean,
): string {
  const hidden = (name: string, value: string): string =>
    `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`;

  return (
    `<!doctype html><html><head><meta charset="utf-8">` +
    `<title>Autorizar Inplanner MCP</title></head>` +
    `<body style="font-family:sans-serif;max-width:32rem;margin:3rem auto">` +
    `<h2>Autorizar acceso</h2>` +
    `<p>La aplicación <b>${escapeHtml(data.clientName)}</b> solicita acceso de ` +
    `<b>solo lectura</b> a Inplanner.</p>` +
    (showError
      ? `<p style="color:#b00020">Contraseña incorrecta. Intenta de nuevo.</p>`
      : '') +
    `<form method="post" action="/${OAUTH_PATHS.authorize}">` +
    hidden('client_id', data.client_id) +
    hidden('redirect_uri', data.redirect_uri) +
    hidden('response_type', data.response_type) +
    hidden('code_challenge', data.code_challenge) +
    hidden('code_challenge_method', data.code_challenge_method) +
    hidden('scope', data.scope) +
    hidden('state', data.state) +
    hidden('resource', data.resource) +
    `<label>Contraseña de administrador<br>` +
    `<input type="password" name="password" autofocus required ` +
    `style="width:100%;padding:.5rem;margin-top:.5rem"></label>` +
    `<button type="submit" style="margin-top:1rem;padding:.5rem 1rem">Autorizar</button>` +
    `</form></body></html>`
  );
}

/** Página HTML de error (no se puede redirigir al cliente por seguridad). */
export function renderErrorPage(message: string): string {
  return (
    `<!doctype html><html><head><meta charset="utf-8"><title>Error</title></head>` +
    `<body style="font-family:sans-serif;max-width:32rem;margin:3rem auto">` +
    `<h2>No se pudo autorizar</h2><p>${escapeHtml(message)}</p></body></html>`
  );
}
