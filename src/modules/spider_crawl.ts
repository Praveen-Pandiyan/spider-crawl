import { SpiderCrawlOptions, SpiderCrawlResult, LinkData } from '../types';
import { webCrawl } from './web_crawl';

export class SpiderCrawl {
  private visitedUrls: Set<string> = new Set();
  private linkMap: Map<string, LinkData[]> = new Map();
  private queue: string[] = [];
  private isProcessing = false;

  /**
   * Crawl an entire website and map all links
   */
  public async crawl(url: string, options: SpiderCrawlOptions = {}): Promise<SpiderCrawlResult> {
    try {
      // Reset state
      this.visitedUrls.clear();
      this.linkMap.clear();
      this.queue = [];
      this.isProcessing = false;

      // Validate and normalize URL
      const baseUrl = this.normalizeUrl(url);
      const baseUrlObj = new URL(baseUrl);
      
      // Set default options
      const defaultOptions: SpiderCrawlOptions = {
        maxDepth: 3,
        maxPages: 100,
        sameDomain: true,
        excludePatterns: [
          'mailto:',
          'tel:',
          'javascript:',
          '#',
          '.pdf',
          '.doc',
          '.docx',
          '.xls',
          '.xlsx',
          '.zip',
          '.rar'
        ],
        includePatterns: [],
        delay: 1000
      };

      const finalOptions = { ...defaultOptions, ...options };

      // Start crawling
      this.queue.push(baseUrl);
      await this.processQueue(baseUrlObj, finalOptions);

      return {
        success: true,
        linkMap: this.linkMap,
        totalPages: this.visitedUrls.size,
        totalLinks: this.getTotalLinks(),
        baseUrl
      };

    } catch (error) {
      return {
        success: false,
        linkMap: new Map(),
        totalPages: 0,
        totalLinks: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        baseUrl: url
      };
    }
  }

  /**
   * Process the URL queue
   */
  private async processQueue(baseUrlObj: URL, options: SpiderCrawlOptions): Promise<void> {
    let depth = 0;
    const maxDepth = options.maxDepth || 3;

    while (this.queue.length > 0 && depth < maxDepth) {
      const currentBatch = [...this.queue];
      this.queue = [];

      // Process current batch
      const promises = currentBatch.map(url => this.processUrl(url, baseUrlObj, options));
      await Promise.all(promises);

      depth++;
      
      // Add delay between batches
      if (options.delay && options.delay > 0) {
        await this.delay(options.delay);
      }
    }
  }

  /**
   * Process a single URL
   */
  private async processUrl(url: string, baseUrlObj: URL, options: SpiderCrawlOptions): Promise<void> {
    // Skip if already visited or max pages reached
    if (this.visitedUrls.has(url) || this.visitedUrls.size >= (options.maxPages || 100)) {
      return;
    }

    // Mark as visited
    this.visitedUrls.add(url);

    try {
      // Crawl the page for links
      const result = await webCrawl.crawl(url, { format: 'crawl-links' });

      if (result.success && result.data) {
        const links = result.data as LinkData[];
        this.linkMap.set(url, links);

        // Add new URLs to queue
        for (const link of links) {
          const newUrl = this.normalizeUrl(link.url);
          
          if (this.shouldProcessUrl(newUrl, baseUrlObj, options)) {
            this.queue.push(newUrl);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to process URL ${url}:`, error);
    }
  }

  /**
   * Check if URL should be processed
   */
  private shouldProcessUrl(url: string, baseUrlObj: URL, options: SpiderCrawlOptions): boolean {
    // Skip if already visited
    if (this.visitedUrls.has(url)) {
      return false;
    }

    try {
      const urlObj = new URL(url);

      // Check domain restriction
      if (options.sameDomain && urlObj.hostname !== baseUrlObj.hostname) {
        return false;
      }

      // Check exclude patterns
      if (options.excludePatterns) {
        for (const pattern of options.excludePatterns) {
          if (url.includes(pattern)) {
            return false;
          }
        }
      }

      // Check include patterns
      if (options.includePatterns && options.includePatterns.length > 0) {
        const matchesPattern = options.includePatterns.some(pattern => url.includes(pattern));
        if (!matchesPattern) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Normalize URL
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // Remove fragments
      urlObj.hash = '';
      
      // Normalize path
      urlObj.pathname = urlObj.pathname.replace(/\/+/g, '/');
      
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  /**
   * Get total number of links
   */
  private getTotalLinks(): number {
    let total = 0;
    for (const links of this.linkMap.values()) {
      total += links.length;
    }
    return total;
  }

  /**
   * Add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get crawl statistics
   */
  public getStats(): {
    visitedUrls: number;
    totalLinks: number;
    uniqueDomains: Set<string>;
    averageLinksPerPage: number;
  } {
    const uniqueDomains = new Set<string>();
    
    for (const url of this.visitedUrls) {
      try {
        const urlObj = new URL(url);
        uniqueDomains.add(urlObj.hostname);
      } catch {
        // Skip invalid URLs
      }
    }

    const averageLinksPerPage = this.visitedUrls.size > 0 
      ? this.getTotalLinks() / this.visitedUrls.size 
      : 0;

    return {
      visitedUrls: this.visitedUrls.size,
      totalLinks: this.getTotalLinks(),
      uniqueDomains,
      averageLinksPerPage
    };
  }

  /**
   * Export link map as JSON
   */
  public exportLinkMap(): Record<string, LinkData[]> {
    const exportData: Record<string, LinkData[]> = {};
    
    for (const [url, links] of this.linkMap) {
      exportData[url] = links;
    }
    
    return exportData;
  }

  /**
   * Get internal links only
   */
  public getInternalLinks(): Map<string, LinkData[]> {
    const internalMap = new Map<string, LinkData[]>();
    
    for (const [url, links] of this.linkMap) {
      const internalLinks = links.filter(link => link.isInternal);
      if (internalLinks.length > 0) {
        internalMap.set(url, internalLinks);
      }
    }
    
    return internalMap;
  }

  /**
   * Get external links only
   */
  public getExternalLinks(): Map<string, LinkData[]> {
    const externalMap = new Map<string, LinkData[]>();
    
    for (const [url, links] of this.linkMap) {
      const externalLinks = links.filter(link => !link.isInternal);
      if (externalLinks.length > 0) {
        externalMap.set(url, externalLinks);
      }
    }
    
    return externalMap;
  }
}

// Export singleton instance
export const spiderCrawl = new SpiderCrawl(); 