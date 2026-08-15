import { BadRequestException, Injectable } from '@nestjs/common';
import { UnfurlLinkDto, UnfurlResponseDto } from './dtos/unfurl-link.dto';
import {
  extractTitle,
  pickIconLink,
  validateHttpUrl,
} from './link-unfurl.util';
import { guardedFetch, GuardedHttpError } from './guarded-http.client';

@Injectable()
export class LinksService {
  async unfurl(dto: UnfurlLinkDto): Promise<UnfurlResponseDto> {
    const url = validateHttpUrl(dto.url);
    if (!url) {
      throw new BadRequestException('URL invalida');
    }

    const response = new UnfurlResponseDto();
    response.url = url.href;
    response.domain = url.hostname;
    response.title = url.hostname;
    response.icon = this.googleFavicon(url.hostname);

    let pageUrl = url;
    try {
      const page = await guardedFetch(url);
      if (page.status >= 200 && page.status < 400) {
        pageUrl = new URL(page.finalUrl);
        response.url = page.finalUrl;
        response.domain = pageUrl.hostname;
        const title = extractTitle(page.text);
        if (title) {
          response.title = title;
        }
        response.icon = await this.resolveIcon(page.text, pageUrl);
      }
    } catch (error) {
      if (error instanceof GuardedHttpError) {
        return response;
      }
      throw error;
    }
    return response;
  }

  private async resolveIcon(html: string, pageUrl: URL): Promise<string> {
    const declared = pickIconLink(html, pageUrl);
    if (declared && (await this.isImageUrl(declared))) {
      return declared;
    }
    const faviconIco = `${pageUrl.origin}/favicon.ico`;
    if (await this.isImageUrl(faviconIco)) {
      return faviconIco;
    }
    return this.googleFavicon(pageUrl.hostname);
  }

  private async isImageUrl(candidate: string): Promise<boolean> {
    try {
      const url = new URL(candidate);
      if (url.username || url.password) {
        return false;
      }
      const res = await guardedFetch(url, {
        maxRedirects: 3,
        sizeLimit: 512 * 1024,
      });
      return (
        res.status >= 200 &&
        res.status < 300 &&
        /^image\//i.test(res.contentType ?? '')
      );
    } catch {
      return false;
    }
  }

  private googleFavicon(domain: string): string {
    return `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(
      domain,
    )}`;
  }
}
