import * as dns from 'dns';
import * as http from 'http';
import * as https from 'https';
import { isPrivateIp } from './link-unfurl.util';

export class GuardedHttpError extends Error {}

export interface GuardedResponse {
  status: number;
  contentType: string | null;
  finalUrl: string;
  text: string;
}

interface GuardedOptions {
  maxRedirects?: number;
  timeoutMs?: number;
  sizeLimit?: number;
}

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_SIZE_LIMIT = 512 * 1024;

/**
 * Resuelve el hostname una sola vez y valida que la IP sea publica.
 * La IP retornada se usa como destino fisico de la conexion (no se
 * re-resuelve), evitando TOCTOU por DNS rebinding.
 */
export async function resolveValidated(
  hostname: string,
): Promise<{ ip: string }> {
  let addresses: dns.LookupAddress[];
  try {
    addresses = await dns.promises.lookup(hostname, {
      all: true,
      verbatim: true,
    });
  } catch {
    throw new GuardedHttpError('No se pudo resolver el hostname');
  }
  const safe = addresses.find((a) => !isPrivateIp(a.address));
  if (!safe) {
    throw new GuardedHttpError('La direccion resuelta no es una IP publica');
  }
  return { ip: safe.address };
}

/**
 * Fetch con IP pineada: conecta a la IP validada pero envia Host/servername
 * reales. Los redirects se siguen manualmente, re-validando cada salto.
 */
export async function guardedFetch(
  input: URL,
  options: GuardedOptions = {},
): Promise<GuardedResponse> {
  const maxRedirects = options.maxRedirects ?? 5;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const sizeLimit = options.sizeLimit ?? DEFAULT_SIZE_LIMIT;
  return guardedFetchInternal(input, maxRedirects, timeoutMs, sizeLimit);
}

async function guardedFetchInternal(
  url: URL,
  redirectsLeft: number,
  timeoutMs: number,
  sizeLimit: number,
): Promise<GuardedResponse> {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new GuardedHttpError('Protocolo no soportado');
  }
  if (url.username || url.password) {
    throw new GuardedHttpError('URL con credenciales');
  }

  const { ip } = await resolveValidated(url.hostname);
  const isSecure = url.protocol === 'https:';

  const result = await requestPinned({
    ip,
    isSecure,
    url,
    timeoutMs,
    sizeLimit,
  });

  if (result.status >= 300 && result.status < 400 && redirectsLeft > 0) {
    const location = result.headers.location;
    if (!location) {
      throw new GuardedHttpError('Redirect sin Location');
    }
    const next = new URL(location, url);
    return guardedFetchInternal(next, redirectsLeft - 1, timeoutMs, sizeLimit);
  }

  return {
    status: result.status,
    contentType: result.headers['content-type'] ?? null,
    finalUrl: url.href,
    text: result.text,
  };
}

interface PinnedRequestResult {
  status: number;
  headers: http.IncomingHttpHeaders;
  text: string;
}

function requestPinned({
  ip,
  isSecure,
  url,
  timeoutMs,
  sizeLimit,
}: {
  ip: string;
  isSecure: boolean;
  url: URL;
  timeoutMs: number;
  sizeLimit: number;
}): Promise<PinnedRequestResult> {
  const lib = isSecure ? https : http;
  const requestOptions: http.RequestOptions = {
    host: ip,
    hostname: ip,
    port: Number(url.port) || (isSecure ? 443 : 80),
    path: url.pathname + url.search,
    method: 'GET',
    headers: {
      Host: url.host,
      'User-Agent': 'Inplanner-Unfurl/1.0',
      Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es,en;q=0.8',
    },
    timeout: timeoutMs,
  };
  if (isSecure) {
    (requestOptions as https.RequestOptions).servername = url.hostname;
  }

  return new Promise((resolve, reject) => {
    const req = lib.request(requestOptions, (res) => {
      const chunks: Buffer[] = [];
      let received = 0;
      let oversized = false;
      res.on('data', (chunk: Buffer) => {
        if (oversized) {
          return;
        }
        received += chunk.length;
        if (received > sizeLimit) {
          oversized = true;
          req.destroy();
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            text: Buffer.concat(chunks).toString('utf8'),
          });
          return;
        }
        chunks.push(chunk);
      });
      res.on('end', () => {
        if (oversized) {
          return;
        }
        resolve({
          status: res.statusCode ?? 0,
          headers: res.headers,
          text: Buffer.concat(chunks).toString('utf8'),
        });
      });
    });
    req.on('timeout', () => {
      req.destroy(new GuardedHttpError('Timeout de conexion'));
    });
    req.on('error', (err) => reject(err));
    req.end();
  });
}
