import { Router, Request, Response } from 'express';
import { spiderCrawl } from '../../modules/spider_crawl';
import { SpiderCrawlRequest, ApiResponse, SpiderCrawlResult } from '../../types';

const router = Router();

/**
 * POST /api/spider-crawl
 * Crawl entire website and map all links
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { url, options }: SpiderCrawlRequest = req.body;

    // Validate request
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      } as ApiResponse);
    }

    // Perform spider crawl
    const result: SpiderCrawlResult = await spiderCrawl.crawl(url, options);

    if (result.success) {
      // Convert Map to object for JSON serialization
      const linkMapObject: Record<string, any[]> = {};
      result.linkMap.forEach((links, pageUrl) => {
        linkMapObject[pageUrl] = links;
      });

      return res.status(200).json({
        success: true,
        data: {
          linkMap: linkMapObject,
          totalPages: result.totalPages,
          totalLinks: result.totalLinks,
          baseUrl: result.baseUrl
        },
        url: result.baseUrl,
        timestamp: new Date()
      } as ApiResponse);
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || 'Spider crawl failed'
      } as ApiResponse);
    }

  } catch (error) {
    console.error('Spider crawl error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ApiResponse);
  }
});

/**
 * GET /api/spider-crawl/stats
 * Get spider crawl statistics
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = spiderCrawl.getStats();
    
    res.json({
      success: true,
      data: {
        visitedUrls: stats.visitedUrls,
        totalLinks: stats.totalLinks,
        uniqueDomains: Array.from(stats.uniqueDomains),
        averageLinksPerPage: stats.averageLinksPerPage
      }
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get statistics'
    } as ApiResponse);
  }
});

/**
 * GET /api/spider-crawl/options
 * Get available spider crawl options
 */
router.get('/options', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      options: [
        {
          name: 'maxDepth',
          description: 'Maximum depth to crawl (default: 3)',
          type: 'number',
          example: 3
        },
        {
          name: 'maxPages',
          description: 'Maximum number of pages to crawl (default: 100)',
          type: 'number',
          example: 100
        },
        {
          name: 'sameDomain',
          description: 'Only crawl pages from the same domain (default: true)',
          type: 'boolean',
          example: true
        },
        {
          name: 'excludePatterns',
          description: 'URL patterns to exclude from crawling',
          type: 'string[]',
          example: ['mailto:', 'tel:', 'javascript:', '#', '.pdf']
        },
        {
          name: 'includePatterns',
          description: 'URL patterns to include in crawling (if empty, all are included)',
          type: 'string[]',
          example: ['/blog/', '/articles/']
        },
        {
          name: 'delay',
          description: 'Delay between batch requests in milliseconds (default: 1000)',
          type: 'number',
          example: 1000
        }
      ]
    }
  } as ApiResponse);
});

/**
 * GET /api/spider-crawl/export
 * Export the current link map
 */
router.get('/export', (req: Request, res: Response) => {
  try {
    const linkMap = spiderCrawl.exportLinkMap();
    
    res.json({
      success: true,
      data: linkMap,
      timestamp: new Date()
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export link map'
    } as ApiResponse);
  }
});

export { router as spiderCrawlRoutes }; 