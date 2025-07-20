export interface CrawlOptions {
  format: 'text' | 'LLMtext' | 'screenshot' | 'html' | 'crawl-links' | 'images';
  timeout?: number;
  waitForSelector?: string;
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
  ignoreAds?: boolean;
}

export interface CrawlResult {
  success: boolean;
  data?: any;
  error?: string;
  url: string;
  timestamp: Date;
  format: string;
}

export interface LLMTextData {
  text: string;
  links: Array<{
    url: string;
    text: string;
  }>;
  images: Array<{
    src: string;
    alt: string;
  }>;
  sources: Array<{
    type: string;
    url: string;
  }>;
  references: Array<{
    type: string;
    content: string;
  }>;
}

export interface ImageData {
  src: string;
  alt: string;
  title?: string;
  width?: number;
  height?: number;
}

export interface LinkData {
  url: string;
  text: string;
  title?: string;
  isInternal: boolean;
}

export interface SpiderCrawlOptions {
  maxDepth?: number;
  maxPages?: number;
  sameDomain?: boolean;
  excludePatterns?: string[];
  includePatterns?: string[];
  delay?: number;
}

export interface SpiderCrawlResult {
  success: boolean;
  linkMap: Map<string, LinkData[]>;
  totalPages: number;
  totalLinks: number;
  error?: string;
  baseUrl: string;
}

export interface PuppeteerControllerConfig {
  maxTabs: number;
  browserTimeout: number;
  requestTimeout: number;
  headless: boolean;
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
}

export interface TabInfo {
  id: string;
  url: string;
  inUse: boolean;
  createdAt: Date;
  lastUsed: Date;
}

export interface WebCrawlRequest {
  url: string;
  options: CrawlOptions;
}

export interface SpiderCrawlRequest {
  url: string;
  options?: SpiderCrawlOptions;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Search engine scraping types
export type SearchEngine = 'google' | 'bing' | 'brave';

export interface SearchRequest {
  engine: SearchEngine;
  query: string;
  options?: Record<string, any> | undefined;
}

export interface SearchResultItem {
  title: string;
  link: string;
  snippet: string;
}

export interface SearchResult {
  success: boolean;
  engine: SearchEngine;
  query: string;
  results: SearchResultItem[];
  error?: string;
  timestamp: Date;
} 