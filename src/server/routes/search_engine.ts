import { Router, Request, Response } from 'express';
import { scrapeSearchResultsWithCite } from '../../modules/search_engine_scraper';
import { SearchRequest, ApiResponse } from '../../types';

const router = Router();

/**
 * POST /api/search-engine
 * Scrape search engine results (currently only Google supported)
 */
router.post('/', async (req: Request, res: Response) => {
  const { engine, query, options }: SearchRequest = req.body;

  if (!engine || !query) {
    return res.status(400).json({
      success: false,
      error: 'engine and query are required'
    } as ApiResponse);
  }

  try {
    let result;
    switch (engine) {
      case 'google':
        result = await scrapeSearchResultsWithCite({ engine, query: `https://www.google.com/search?q=${encodeURIComponent(query)}`, options });
        break;
      case 'bing':
        result = await scrapeSearchResultsWithCite({ engine, query: `https://www.bing.com/search?q=${encodeURIComponent(query)}`, options });
        break;
      case 'brave':
        result = await scrapeSearchResultsWithCite({ engine, query: `https://search.brave.com/search?q=${encodeURIComponent(query)}`, options });
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Engine '${engine}' not supported yet.`
        } as ApiResponse);
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ApiResponse);
  }
});

export { router as searchEngineRoutes }; 