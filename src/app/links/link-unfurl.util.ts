import { isIP } from 'net';

export function validateHttpUrl(input: string): URL | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return null;
  }
  if (url.username || url.password) {
    return null;
  }
  return url;
}

export function isPrivateIp(address: string): boolean {
  if (isIP(address) === 4) {
    return isBlockedIpv4(address);
  }
  if (isIP(address) === 6) {
    return isBlockedIpv6(address);
  }
  return true;
}

function isBlockedIpv4(address: string): boolean {
  const [a, b, c] = address.split('.').map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isBlockedIpv6(address: string): boolean {
  const groups = expandIpv6(address);
  if (!groups) {
    return true;
  }
  const first = groups[0];
  const second = groups[1];
  const allZero = groups.every((g) => g === 0);
  const loopback = groups.slice(0, 7).every((g) => g === 0) && groups[7] === 1;
  if (allZero || loopback) {
    return true;
  }
  if ((first & 0xfc00) === 0xfc00) {
    return true;
  }
  if ((first & 0xffc0) === 0xfe80) {
    return true;
  }
  if ((first & 0xff00) === 0xff00) {
    return true;
  }
  const ipv4Mapped =
    groups.slice(0, 5).every((g) => g === 0) && second === 0xffff;
  if (ipv4Mapped || (first === 0x0064 && second === 0xff9b)) {
    const ipv4 = `${(groups[6] >> 8) & 0xff}.${groups[6] & 0xff}.${(groups[7] >> 8) & 0xff}.${groups[7] & 0xff}`;
    return isBlockedIpv4(ipv4);
  }
  return false;
}

function expandIpv6(address: string): number[] | null {
  let left = '';
  let right = '';
  if (address.includes('::')) {
    const [l, r] = address.split('::');
    left = l;
    right = r;
  } else {
    left = address;
  }

  const parseGroup = (part: string): number[] | null => {
    if (!part) {
      return [];
    }
    const segments = part.split(':');
    const groups: number[] = [];
    for (const segment of segments) {
      if (segment.includes('.')) {
        if (isIP(segment) !== 4) {
          return null;
        }
        const octets = segment.split('.').map(Number);
        groups.push((octets[0] << 8) | octets[1], (octets[2] << 8) | octets[3]);
      } else if (/^[0-9a-fA-F]{1,4}$/.test(segment)) {
        groups.push(parseInt(segment, 16));
      } else {
        return null;
      }
    }
    return groups;
  };

  const leftGroups = parseGroup(left);
  if (!leftGroups) {
    return null;
  }
  const rightGroups = parseGroup(right);
  if (!rightGroups) {
    return null;
  }
  const total = leftGroups.length + rightGroups.length;
  if (total > 8) {
    return null;
  }
  const result = [
    ...leftGroups,
    ...Array<number>(8 - total).fill(0),
    ...rightGroups,
  ];
  return result.length === 8 ? result : null;
}

export function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) {
    return null;
  }
  return (
    decodeBasicEntities(match[1].replace(/<[^>]*>/g, ''))
      .replace(/\s+/g, ' ')
      .trim() || null
  );
}

export function decodeBasicEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(parseInt(code, 16)),
    );
}

export function pickIconLink(html: string, baseUrl: URL): string | null {
  const links: string[] = html.match(/<link\b[^>]*>/gi) ?? [];
  const candidates = links
    .map((tag: string) => {
      const rel = attribute(tag, 'rel');
      const href = attribute(tag, 'href');
      const sizes = attribute(tag, 'sizes');
      if (!rel || !href || !/icon/i.test(rel)) {
        return null;
      }
      const sizeMatch = sizes?.match(/(\d+)\s*x\s*(\d+)/i);
      const area = sizeMatch ? Number(sizeMatch[1]) * Number(sizeMatch[2]) : 0;
      return { href, area };
    })
    .filter((c): c is { href: string; area: number } => c !== null)
    .sort((a, b) => b.area - a.area);
  for (const candidate of candidates) {
    const resolved = resolveIconUrl(candidate.href, baseUrl);
    if (resolved) {
      return resolved;
    }
  }
  return null;
}

function attribute(tag: string, name: string): string | null {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'),
  );
  return match ? match[1] : null;
}

function resolveIconUrl(href: string, baseUrl: URL): string | null {
  let url: URL;
  try {
    url = new URL(href.trim(), baseUrl);
  } catch {
    return null;
  }
  return url.protocol === 'http:' || url.protocol === 'https:'
    ? url.href
    : null;
}
