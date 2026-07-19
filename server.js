const express = require('express');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS so the app can be run via file:// protocol while accessing the API
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Proxy search requests to Bitsearch API to avoid CORS issues
app.get('/api/search', async (req, res) => {
  try {
    const { q, sort, page = 1, limit = 20, category } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query parameter "q" is required' });
    }

    // Build Bitsearch query URL
    const targetUrl = new URL('https://bitsearch.eu/api/v1/search');
    targetUrl.searchParams.append('q', q);
    if (sort && sort !== 'relevance') {
      targetUrl.searchParams.append('sort', sort);
    }
    targetUrl.searchParams.append('page', page);
    targetUrl.searchParams.append('limit', limit);
    if (category) {
      targetUrl.searchParams.append('category', category);
    }

    console.log(`[Proxy] Fetching: ${targetUrl.toString()}`);

    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Bitsearch API returned status ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('[Error] Search proxy failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch search results from indexer: ' + error.message });
  }
});

// Start server with dynamic port fallback if PORT is already in use
function startServer(port) {
  const server = app.listen(port, () => {
    console.log('==================================================');
    console.log(` Torrent Web Search server is running at:`);
    console.log(`   http://localhost:${port}`);
    console.log('==================================================');
    console.log('Press Ctrl+C to stop the server.');

    // Automatically open the browser
    const url = `http://localhost:${port}`;
    const openCmd = process.platform === 'darwin' ? `open "${url}"` : 
                    process.platform === 'win32' ? `start "${url}"` : 
                    `xdg-open "${url}"`;

    exec(openCmd, (err) => {
      if (err) {
        console.log(`[Info] Could not open browser automatically. Please open: ${url}`);
      } else {
        console.log(`[Info] Automatically opened default browser at: ${url}`);
      }
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[Info] Port ${port} is in use. Trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('[Error] Server error:', err.message);
    }
  });
}

startServer(PORT);
