import { getPuppeteerController } from '../controllers/puppeteer_controller';
import { SearchRequest, SearchResult } from '../types';

export async function scrapeSearchResultsWithCite(request: SearchRequest): Promise<SearchResult> {
  const controller = getPuppeteerController({ headless: true });
  const page = await controller.getTab();
  try {
    // await page.authenticate({ username: "username", password: "password" });
    await page.setBypassCSP(true);
    const searchUrl = request.query;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
    console.log(`Navigated to: ${searchUrl}`);
    try {
      await page.waitForSelector('body>div', { timeout: 5000 });
    } catch (error) {
      console.log(error);
    };

    await page.title().then(console.log);

    // Extract results
    const items = await page.evaluate(() => {
       function findNearestTextNodeWithMinLength(startNode: any, minLength = 100) {
        // Helper: checks if a node is a valid long-enough text node
        function isValidTextNode(node: { nodeType: number; nodeValue: { trim: () => { (): any; new(): any; length: number; }; }; }) {
          return node.nodeType === Node.TEXT_NODE && node.nodeValue.trim().length > minLength;
        }
      
        // Step 1: Forward search using next nodes
        let forwardNode = startNode;
        while (forwardNode) {
          if (isValidTextNode(forwardNode)) return forwardNode;
          forwardNode = nextNode(forwardNode);
        }
      
        // Step 2: Backward search using previous nodes
        let backwardNode = startNode;
        while (backwardNode) {
          if (isValidTextNode(backwardNode)) return backwardNode;
          backwardNode = previousNode(backwardNode);
        }
      
        return null; // Not found
      }
      
      // DOM walker to go to next node in document order
      function nextNode(node: { firstChild: any; nextSibling: any; parentNode: any; }) {
        if (node.firstChild) return node.firstChild;
        while (node) {
          if (node.nextSibling) return node.nextSibling;
          node = node.parentNode;
        }
        return null;
      }
      
      // DOM walker to go to previous node in document order
      function previousNode(node: { previousSibling: any; lastChild: any; parentNode: any; }) {
        if (node.previousSibling) {
          node = node.previousSibling;
          while (node.lastChild) node = node.lastChild;
          return node;
        }
        return node.parentNode;
      }
      

      const results: any[] = [];
      const nodes = document.querySelectorAll("a:has(cite)");
      if(nodes)
      nodes.forEach((node) => {
        let result={
          title: node.textContent?.trim() || '',
          url: node.getAttribute('href') || '',
          description: findNearestTextNodeWithMinLength(node, 75)?.nodeValue?.trim() || '',
        };
        console.log('result',result.description);
        results.push(result);

      });
      return results;
    });

    return {
      success: true,
      engine: request.engine,
      query: request.query,
      results: items,
      timestamp: new Date()
    };
  } catch (error) {
    return {
      success: false,
      engine: request.engine,
      query: request.query,
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    };
  } finally {
    controller.releaseTab(page);
  }
} 