# TorLink

TorLink is a clean, minimal search interface and proxy for decentralized torrent indexes. It provides a simple, quiet developer dashboard to query metadata (titles, sizes, seeds, and dates) and get magnet links instantly.

> [!WARNING]
> **Disclaimer & Non-Liability:** The creator and contributors of this repository are not responsible for any misuse of this tool. This application does not host, store, index, or distribute any copyrighted files. It is simply a frontend interface that proxies search requests for metadata.

---

## How It Works

This application runs locally and consists of two parts:

* **Backend Server:** A Node.js and Express server that serves the static frontend files and proxies search queries to public search APIs. This prevents cross-origin resource sharing (CORS) blocks.
* **Frontend Web App:** A clean, high-density dashboard built with HTML, CSS, and vanilla JavaScript. It displays results in a structured table and formats magnet links dynamically.

---

## Quick Start

To run the application on your local machine:

1. Double-click the **`start.command`** script (or run `node server.js` in your terminal).
2. The server will start on port `3000` (or the next available port).
3. Your browser will automatically open to `http://localhost:3000`.
