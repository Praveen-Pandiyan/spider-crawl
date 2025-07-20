import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { webCrawlRoutes } from './routes/web_crawl';
import { spiderCrawlRoutes } from './routes/spider_crawl';
import { searchEngineRoutes } from './routes/search_engine';
import { errorHandler } from './middleware/error_handler';
import { notFoundHandler } from './middleware/not_found_handler';

// Load environment variables
dotenv.config();

export class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Disable CSP for development
      crossOriginEmbedderPolicy: false
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Compression
    this.app.use(compression());

    // Logging
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined'));
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request timeout
    this.app.use((req, res, next) => {
      req.setTimeout(300000); // 5 minutes
      res.setTimeout(300000);
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // API routes
    this.app.use('/api/web-crawl', webCrawlRoutes);
    this.app.use('/api/search-engine', searchEngineRoutes);
    this.app.use('/api/spider-crawl', spiderCrawlRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Spider-Crawl API',
        version: '1.0.0',
        endpoints: {
          'POST /api/web-crawl': 'Crawl a specific URL',
          'POST /api/spider-crawl': 'Crawl entire website',
          'POST /api/search-engine': 'Crawl entire website',
          'GET /health': 'Health check'
        }
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Error handler
    this.app.use(errorHandler);
  }

  public listen(port: number): void {
    this.app.listen(port, () => {
      console.log(`🚀 Server is running on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`🌐 API Documentation: http://localhost:${port}/`);
    });
  }
} 