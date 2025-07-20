import { webCrawl } from './modules/web_crawl';
import { spiderCrawl } from './modules/spider_crawl';

async function testWebCrawl(): Promise<void> {
  console.log('Testing web crawl...');
  
  try {
    const result = await webCrawl.crawl('https://example.com', { format: 'text' });
    console.log('Web crawl result:', result.success ? 'SUCCESS' : 'FAILED');
    if (result.success) {
      console.log('Text length:', (result.data as string).length);
    } else {
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.error('Web crawl test failed:', error);
  }
}

async function testSpiderCrawl(): Promise<void> {
  console.log('Testing spider crawl...');
  
  try {
    const result = await spiderCrawl.crawl('https://example.com', { maxDepth: 1, maxPages: 5 });
    console.log('Spider crawl result:', result.success ? 'SUCCESS' : 'FAILED');
    if (result.success) {
      console.log('Pages crawled:', result.totalPages);
      console.log('Total links:', result.totalLinks);
    } else {
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.error('Spider crawl test failed:', error);
  }
}

async function runTests(): Promise<void> {
  console.log('🚀 Starting Spider-Crawl tests...\n');
  
  await testWebCrawl();
  console.log('');
  await testSpiderCrawl();
  
  console.log('\n✅ Tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
} 