import { Router, Request, Response } from 'express';
import { webCrawl } from '../../modules/web_crawl';
import { WebCrawlRequest, ApiResponse, CrawlResult } from '../../types';

const router = Router();

/**
 * POST /api/web-crawl
 * Crawl a specific URL with various output formats
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { url, options }: WebCrawlRequest = req.body;

    // Validate request
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      } as ApiResponse);
    }

    if (!options || !options.format) {
      return res.status(400).json({
        success: false,
        error: 'Crawl options with format are required'
      } as ApiResponse);
    }

    // Validate format
    const validFormats = ['text', 'LLMtext', 'screenshot', 'html', 'crawl-links', 'images'];
    if (!validFormats.includes(options.format)) {
      return res.status(400).json({
        success: false,
        error: `Invalid format. Must be one of: ${validFormats.join(', ')}`
      } as ApiResponse);
    }

    // Perform crawl
    const result: CrawlResult = await webCrawl.crawl(url, options);

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data,
        url: result.url,
        timestamp: result.timestamp,
        format: result.format
      } as ApiResponse);
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || 'Crawl failed'
      } as ApiResponse);
    }

  } catch (error) {
    console.error('Web crawl error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ApiResponse);
  }
});

/**
 * GET /api/web-crawl/formats
 * Get available crawl formats
 */
router.get('/formats', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      formats: [
        {
          name: 'text',
          description: 'Extract plain text content from the webpage',
          example: { format: 'text' }
        },
        {
          name: 'LLMtext',
          description: 'Extract structured data for LLM processing (text, links, images, sources, references)',
          example: { format: 'LLMtext' }
        },
        {
          name: 'screenshot',
          description: 'Return base64 PNG screenshot of the webpage',
          example: { format: 'screenshot' }
        },
        {
          name: 'html',
          description: 'Return raw HTML of the webpage',
          example: { format: 'html' }
        },
        {
          name: 'crawl-links',
          description: 'Extract all links from the webpage',
          example: { format: 'crawl-links' }
        },
        {
          name: 'images',
          description: 'Extract all images with alt text from the webpage',
          example: { format: 'images' }
        }
      ],
      additionalOptions: {
        timeout: 'Request timeout in milliseconds (default: 30000)',
        waitForSelector: 'Wait for specific CSS selector before processing',
        userAgent: 'Custom user agent string',
        viewport: 'Custom viewport { width: number, height: number }',
        ignoreAds: 'Remove ads before processing (boolean)'
      }
    }
  } as ApiResponse);
});

export { router as webCrawlRoutes }; 