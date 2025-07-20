import type { Browser, Page, PuppeteerLaunchOptions } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { PuppeteerControllerConfig, TabInfo } from '../types';

export class PuppeteerController {
  private browser: Browser | null = null;
  private tabs: Map<string, TabInfo> = new Map();
  private config: PuppeteerControllerConfig;
  private isInitializing = false;
  private initializationPromise: Promise<void> | null = null;

  constructor(config: Partial<PuppeteerControllerConfig> = {}) {
    this.config = {
      maxTabs: config.maxTabs || 10,
      browserTimeout: config.browserTimeout || 30000,
      requestTimeout: config.requestTimeout || 10000,
      headless: config.headless || false,
      userAgent: config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      viewport: config.viewport || { width: 1920, height: 1080 }
    };
  }

  /**
   * Initialize the browser instance
   */
  public async initialize(): Promise<void> {
    if (this.browser) {
      return;
    }

    if (this.isInitializing) {
      return this.initializationPromise!;
    }

    this.isInitializing = true;
    this.initializationPromise = this._initializeBrowser();

    try {
      await this.initializationPromise;
    } finally {
      this.isInitializing = false;
      this.initializationPromise = null;
    }
  }

  private async _initializeBrowser(): Promise<void> {
    try {
      const launchOptions: PuppeteerLaunchOptions = {
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          // '--disable-dev-shm-usage',
          // '--disable-accelerated-2d-canvas',
          // '--no-first-run',
          // '--no-zygote',
          // '--disable-gpu',
          // '--disable-background-timer-throttling',
          // '--disable-backgrounding-occluded-windows',
          // '--disable-renderer-backgrounding',
          // '--disable-features=TranslateUI',
          // '--disable-ipc-flooding-protection',
          // '--proxy-server=proxyUrl',
          '--user-agent=' + this.config.userAgent
        ],
        timeout: this.config.browserTimeout,
        // executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      };
      puppeteer.use(StealthPlugin());

      this.browser = await puppeteer.launch(launchOptions);

      // Set up browser event listeners
      this.browser.on('disconnected', () => {
        this.handleBrowserDisconnect();
      });

      console.log('Puppeteer browser initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Puppeteer browser:', error);
      throw new Error(`Browser initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get an available tab or create a new one
   */
  public async getTab(): Promise<Page> {
    await this.initialize();

    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    // Check for available tabs
    for (const [tabId, tabInfo] of this.tabs) {
      if (!tabInfo.inUse) {
        tabInfo.inUse = true;
        tabInfo.lastUsed = new Date();
        return this.browser.pages().then(pages => pages.find(page => page.url() === tabInfo.url) || this.createNewTab());
      }
    }

    // Check if we can create a new tab
    if (this.tabs.size < this.config.maxTabs) {
      return this.createNewTab();
    }

    // Wait for a tab to become available
    return this.waitForAvailableTab();
  }

  /**
   * Create a new tab
   */
  private async createNewTab(): Promise<Page> {
    const excludeResource = [
      // 'image', 'stylesheet',
       'font', 'media'];
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();

    // Configure page settings
    if (this.config.viewport) {
      await page.setViewport(this.config.viewport);
    }
    if (this.config.userAgent) {
      await page.setUserAgent(this.config.userAgent);
    }
    await page.setDefaultTimeout(this.config.requestTimeout);

    // Block unnecessary resources to improve performance
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (excludeResource.includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const tabId = page.url();
    const tabInfo: TabInfo = {
      id: tabId,
      url: tabId,
      inUse: true,
      createdAt: new Date(),
      lastUsed: new Date()
    };

    this.tabs.set(tabId, tabInfo);

    // Set up page event listeners
    page.on('close', () => {
      this.tabs.delete(tabId);
    });

    return page;
  }

  /**
   * Wait for an available tab
   */
  private async waitForAvailableTab(): Promise<Page> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        try {
          const page = await this.getTab();
          clearInterval(checkInterval);
          resolve(page);
        } catch (error) {
          // Continue waiting
        }
      }, 100);

      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Timeout waiting for available tab'));
      }, 30000);
    });
  }

  /**
   * Release a tab back to the pool
   */
  public releaseTab(page: Page): void {
    const tabId = page.url();
    const tabInfo = this.tabs.get(tabId);

    if (tabInfo) {
      tabInfo.inUse = false;
      tabInfo.lastUsed = new Date();
    }
  }

  /**
   * Close a specific tab
   */
  public async closeTab(page: Page): Promise<void> {
    const tabId = page.url();
    this.tabs.delete(tabId);

    try {
      await page.close();
    } catch (error) {
      console.warn('Error closing tab:', error);
    }
  }

  /**
   * Get tab statistics
   */
  public getTabStats(): { total: number; inUse: number; available: number } {
    const total = this.tabs.size;
    const inUse = Array.from(this.tabs.values()).filter(tab => tab.inUse).length;
    const available = total - inUse;

    return { total, inUse, available };
  }

  /**
   * Clean up old unused tabs
   */
  public async cleanupOldTabs(maxAgeMinutes: number = 30): Promise<void> {
    const now = new Date();
    const maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds

    for (const [tabId, tabInfo] of this.tabs) {
      if (!tabInfo.inUse && (now.getTime() - tabInfo.lastUsed.getTime()) > maxAge) {
        const pages = await this.browser?.pages();
        const page = pages?.find(p => p.url() === tabId);
        if (page) {
          await this.closeTab(page);
        }
      }
    }
  }

  /**
   * Handle browser disconnection
   */
  private handleBrowserDisconnect(): void {
    console.log('Browser disconnected, cleaning up...');
    this.browser = null;
    this.tabs.clear();
  }

  /**
   * Close the browser and clean up resources
   */
  public async close(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (error) {
        console.warn('Error closing browser:', error);
      } finally {
        this.browser = null;
        this.tabs.clear();
      }
    }
  }

  /**
   * Get the current configuration
   */
  public getConfig(): PuppeteerControllerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<PuppeteerControllerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Singleton instance
let controllerInstance: PuppeteerController | null = null;

export function getPuppeteerController(config?: Partial<PuppeteerControllerConfig>): PuppeteerController {
  if (!controllerInstance) {
    controllerInstance = new PuppeteerController(config);
  }
  return controllerInstance;
} 