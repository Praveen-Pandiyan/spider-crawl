# Spider-Crawl

Spider-Crawl is a web crawling and spidering tool built with TypeScript. It leverages Puppeteer for web scraping and provides APIs for crawling specific URLs, entire websites, and search engine results.

> **Note**: Use proxy to avoid getting blocked by search engines especially google.
## Features

- **Web Crawling**: Extract text, HTML, screenshots, links, and images from web pages.
- **Spider Crawling**: Crawl entire websites and map all links.
  ***Customizable Options***: Configure crawl depth, timeout, user agent, viewport, and more.
- **Search Engine Scraping**: Scrape search engine results (Google, Bing, Brave).


## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/your-username/spider-crawl.git
    cd spider-crawl
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Create a `.env` file based on `env.example`:
    ```bash
    cp env.example .env
    ```

4. Build the project:
    ```bash
    npm run build
    ```

## Usage

### Start the Server

Run the server in production mode:
```bash
npm start
```

Run the server in development mode:
```bash
npm run dev
```

The server will start on the port specified in the `.env` file (default: `3000`).

### API Endpoints

#### Web Crawl
- **POST** `/api/web-crawl`: Crawl a specific URL with various output formats.
- **GET** `/api/web-crawl/formats`: Get available crawl formats.

#### Spider Crawl
- **POST** `/api/spider-crawl`: Crawl an entire website and map all links.
- **GET** `/api/spider-crawl/stats`: Get spider crawl statistics.
- **GET** `/api/spider-crawl/options`: Get available spider crawl options.
- **GET** `/api/spider-crawl/export`: Export the current link map.

#### Search Engine
- **POST** `/api/search-engine`: Scrape search engine results.

#### Health Check
- **GET** `/health`: Check the health of the server.

## Configuration

The application can be configured using environment variables in the `.env` file:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Puppeteer Configuration
MAX_TABS=10
BROWSER_TIMEOUT=30000
REQUEST_TIMEOUT=10000

# CORS Configuration
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info
```

## Development

### Linting
Run ESLint to check for code quality:
```bash
npm run lint
```

Fix linting issues:
```bash
npm run lint:fix
```

### Testing
Run tests using Jest:
```bash
npm test
```

### Build
Compile TypeScript to JavaScript:
```bash
npm run build
```

## Project Structure

- `src/`: Source code
  - `server/`: Express server and routes
  - `modules/`: Core modules for crawling and scraping
  - `controllers/`: Puppeteer controller
  - `middleware/`: Express middleware
  - `types/`: TypeScript type definitions
- `dist/`: Compiled output
- `tests/`: Test files
- `README.md`: Project documentation

## Dependencies

- [Express](https://expressjs.com/)
- [Puppeteer](https://pptr.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [dotenv](https://github.com/motdotla/dotenv)
- [Helmet](https://helmetjs.github.io/)
- [Jest](https://jestjs.io/)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## Acknowledgments

- [Puppeteer Extra](https://github.com/berstend/puppeteer-extra) for stealth plugins.
- [TypeScript ESLint](https://typescript-eslint.io/) for linting support.

## Contact

For questions or support, please contact the project maintainer.
