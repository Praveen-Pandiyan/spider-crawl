import { Page } from 'puppeteer';
import { getPuppeteerController } from '../controllers/puppeteer_controller';
import { CrawlOptions, CrawlResult, LLMTextData, ImageData, LinkData } from '../types';

export class WebCrawl {
  private controller = getPuppeteerController({headless:true});

  /**
   * Crawl a specific URL with the specified format
   */
  public async crawl(url: string, options: CrawlOptions): Promise<CrawlResult> {
    let page: Page | null = null;
    
    try {
      // Validate URL
      if (!this.isValidUrl(url)) {
        throw new Error('Invalid URL provided');
      }

      // Get a tab from the controller
      page = await this.controller.getTab();
      
      // Navigate to the URL
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: options.timeout || 30000 
      });

      // Wait for specific selector if provided
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
      }

      // Remove ads if ignoreAds is true
      if (options.ignoreAds) {
        await this.removeAds(page);
      }

      // Process based on format
      let data: any;
      switch (options.format) {
        case 'text':
          data = await this.extractText(page);
          break;
        case 'LLMtext':
          data = await this.extractLLMText(page);
          break;
        case 'screenshot':
          data = await this.takeScreenshot(page);
          break;
        case 'html':
          data = await this.extractHTML(page);
          break;
        case 'crawl-links':
          data = await this.extractLinks(page, url);
          break;
        case 'images':
          data = await this.extractImages(page);
          break;
        default:
          throw new Error(`Unsupported format: ${options.format}`);
      }

      return {
        success: true,
        data,
        url,
        timestamp: new Date(),
        format: options.format
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        url,
        timestamp: new Date(),
        format: options.format
      };
    } finally {
      if (page) {
        this.controller.releaseTab(page);
      }
    }
  }

  /**
   * Extract plain text from the page
   */
  private async extractText(page: Page): Promise<string> {
    return await page.evaluate(() => {
      // Remove script and style elements
      const scripts = document.querySelectorAll('script, style, noscript');
      scripts.forEach(script => script.remove());

      // Get text content
      const text = document.body.innerText || document.body.textContent || '';
      
      // Clean up the text
      return text
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();
    });
  }

  /**
   * Extract LLM-friendly structured data
   */
  private async extractLLMText(page: Page): Promise<LLMTextData> {
    return await page.evaluate(() => {
      // Remove script and style elements
      const scripts = document.querySelectorAll('script, style, noscript');
      scripts.forEach(script => script.remove());

      // Extract text
      const text = document.body.innerText || document.body.textContent || '';
      const cleanText = text.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n').trim();

      // Extract links
      const links = Array.from(document.querySelectorAll('a[href]')).map(link => ({
        url: (link as HTMLAnchorElement).href,
        text: (link as HTMLAnchorElement).textContent?.trim() || ''
      })).filter(link => link.url && link.text);

      // Extract images
      const images = Array.from(document.querySelectorAll('img')).map(img => ({
        src: (img as HTMLImageElement).src,
        alt: (img as HTMLImageElement).alt || ''
      })).filter(img => img.src);

      // Extract sources (scripts, stylesheets, etc.)
      const sources = [
        ...Array.from(document.querySelectorAll('script[src]')).map(script => ({
          type: 'script',
          url: (script as HTMLScriptElement).src
        })),
        ...Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(link => ({
          type: 'stylesheet',
          url: (link as HTMLLinkElement).href
        }))
      ];

      // Extract references (meta tags, citations, etc.)
      const references = [
        ...Array.from(document.querySelectorAll('meta[name="description"]')).map(meta => ({
          type: 'meta-description',
          content: (meta as HTMLMetaElement).content || ''
        })),
        ...Array.from(document.querySelectorAll('meta[name="keywords"]')).map(meta => ({
          type: 'meta-keywords',
          content: (meta as HTMLMetaElement).content || ''
        })),
        ...Array.from(document.querySelectorAll('cite')).map(cite => ({
          type: 'citation',
          content: cite.textContent?.trim() || ''
        }))
      ];

      return {
        text: cleanText,
        links,
        images,
        sources,
        references
      };
    });
  }

  /**
   * Take a screenshot of the page
   */
  private async takeScreenshot(page: Page): Promise<string> {
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: true,
      encoding: 'base64'
    });
    
    return screenshot as string;
  }

  /**
   * Extract raw HTML
   */
  private async extractHTML(page: Page): Promise<string> {
    return await page.content();
  }

  /**
   * Extract links from the page
   */
  private async extractLinks(page: Page, baseUrl: string): Promise<LinkData[]> {
    return await page.evaluate((baseUrl) => {
      const baseUrlObj = new URL(baseUrl);
      const links = Array.from(document.querySelectorAll('a[href]'));
      
      return links.map(link => {
        const href = (link as HTMLAnchorElement).href;
        const text = (link as HTMLAnchorElement).textContent?.trim() || '';
        const title = (link as HTMLAnchorElement).title || '';
        
        try {
          const url = new URL(href);
          const isInternal = url.hostname === baseUrlObj.hostname;
          
          return {
            url: href,
            text,
            title,
            isInternal
          };
        } catch {
          return {
            url: href,
            text,
            title,
            isInternal: false
          };
        }
      }).filter(link => link.url && link.text);
    }, baseUrl);
  }

  /**
   * Extract images from the page
   */
  private async extractImages(page: Page): Promise<ImageData[]> {
    return await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      
      return images.map(img => {
        const imageData: ImageData = {
          src: (img as HTMLImageElement).src,
          alt: (img as HTMLImageElement).alt || ''
        };
        
        const title = (img as HTMLImageElement).title;
        const width = (img as HTMLImageElement).width;
        const height = (img as HTMLImageElement).height;
        
        if (title) imageData.title = title;
        if (width) imageData.width = width;
        if (height) imageData.height = height;
        
        return imageData;
      }).filter(img => img.src);
    });
  }

  /**
   * Remove ads from the page
   */
  private async removeAds(page: Page): Promise<void> {
    await page.evaluate(() => {
      // Common ad selectors
      const adSelectors = [
        '[class*="ad"]',
        '[class*="ads"]',
        '[class*="advertisement"]',
        '[id*="ad"]',
        '[id*="ads"]',
        '[id*="advertisement"]',
        '[data-ad]',
        '[data-ads]',
        'iframe[src*="doubleclick"]',
        'iframe[src*="googlesyndication"]',
        'iframe[src*="ad"]',
        '.ad',
        '.ads',
        '.advertisement',
        '#ad',
        '#ads',
        '#advertisement'
      ];

      adSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => element.remove());
      });
    });
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const webCrawl = new WebCrawl(); 