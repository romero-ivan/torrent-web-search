// State Management
let currentQuery = '';
let currentPage = 1;
let currentSort = 'relevance';
let currentLimit = '20';
let currentCategory = ''; // Empty means "All"

// Trackers to append to magnet links for faster peer discovery
const PUBLIC_TRACKERS = [
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://open.stealth.si:80/announce',
  'udp://tracker.coppersurfer.tk:6969/announce',
  'udp://exodus.desync.com:6991/announce',
  'udp://tracker.torrent.eu.org:451/announce',
  'udp://tracker.tiny-vps.com:6969/announce'
];

// Mapping of category numbers to English names (no emojis)
const CATEGORY_MAP = {
  '1': 'Software',
  '2': 'Movie',
  '3': 'TV Show',
  '4': 'Anime',
  '5': 'Mobile App',
  '6': 'Game',
  '7': 'Music',
  '8': 'Book'
};

// DOM Elements
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const limitSelect = document.getElementById('limit-select');
const tabButtons = document.querySelectorAll('.tab-btn');
const themeToggle = document.getElementById('theme-toggle');

const stateInitial = document.getElementById('state-initial');
const stateLoading = document.getElementById('state-loading');
const stateError = document.getElementById('state-error');
const stateEmpty = document.getElementById('state-empty');
const resultsWrapper = document.getElementById('results-wrapper');

const resultsTbody = document.getElementById('results-tbody');
const resultsCount = document.getElementById('results-count');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');

const prevPageBtn = document.getElementById('prev-page-btn');
const nextPageBtn = document.getElementById('next-page-btn');
const pageIndicator = document.getElementById('page-indicator');

const toast = document.getElementById('toast');
const toastText = document.getElementById('toast-text');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  restoreTheme();
});

// Setup Event Listeners
function setupEventListeners() {
  // Search Form Submit
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    currentQuery = searchInput.value.trim();
    currentPage = 1;
    if (currentQuery) {
      performSearch();
    }
  });

  // Sort Selector Change
  sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    currentPage = 1;
    if (currentQuery) {
      performSearch();
    }
  });

  // Limit Selector Change
  limitSelect.addEventListener('change', () => {
    currentLimit = limitSelect.value;
    currentPage = 1;
    if (currentQuery) {
      performSearch();
    }
  });

  // Category Tabs Click
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      tabButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      });
      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');

      currentCategory = button.getAttribute('data-category');
      currentPage = 1;
      if (currentQuery) {
        performSearch();
      }
    });
  });

  // Pagination buttons
  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      performSearch();
    }
  });

  nextPageBtn.addEventListener('click', () => {
    currentPage++;
    performSearch();
  });

  // Retry Button
  retryBtn.addEventListener('click', () => {
    if (currentQuery) {
      performSearch();
    }
  });

  // Theme Toggle
  themeToggle.addEventListener('click', toggleTheme);
}



// Perform API Search request
async function performSearch() {
  showState('loading');
  
  try {
    // Detect if page was opened via local file protocol (double click on index.html)
    // In that case, fallback to http://localhost:3000 where the local server normally runs
    const baseOrigin = window.location.protocol === 'file:' ? 'http://localhost:3000' : window.location.origin;
    const url = new URL('/api/search', baseOrigin);
    url.searchParams.append('q', currentQuery);
    url.searchParams.append('sort', currentSort);
    url.searchParams.append('page', currentPage);
    url.searchParams.append('limit', currentLimit);
    if (currentCategory) {
      url.searchParams.append('category', currentCategory);
    }

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Failed to retrieve search results.');
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      showState('empty');
      return;
    }

    renderResults(data.results);
    showState('results');
  } catch (error) {
    console.error('Search error:', error);
    
    let userMessage = error.message;
    // Customize connection issues
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      if (window.location.protocol === 'file:') {
        userMessage = 'Could not connect to the backend server. Make sure to run "start.command" to start the server first.';
      } else {
        userMessage = 'Could not connect to the search API. Verify that the terminal window containing the server is still running.';
      }
    }
    
    errorMessage.textContent = userMessage;
    showState('error');
  }
}

// Display UI States
function showState(state) {
  stateInitial.classList.add('hidden');
  stateLoading.classList.add('hidden');
  stateError.classList.add('hidden');
  stateEmpty.classList.add('hidden');
  resultsWrapper.classList.add('hidden');

  if (state === 'initial') {
    stateInitial.classList.remove('hidden');
  } else if (state === 'loading') {
    stateLoading.classList.remove('hidden');
  } else if (state === 'error') {
    stateError.classList.remove('hidden');
  } else if (state === 'empty') {
    stateEmpty.classList.remove('hidden');
  } else if (state === 'results') {
    resultsWrapper.classList.remove('hidden');
  }
}

// Render Results Table
function renderResults(results) {
  resultsTbody.innerHTML = '';
  
  // Set count label
  resultsCount.textContent = `Showing results for "${currentQuery}"`;

  // Render rows
  results.forEach(torrent => {
    const row = document.createElement('tr');

    // Generate magnet link URL
    const trackersQuery = PUBLIC_TRACKERS.map(tr => `&tr=${encodeURIComponent(tr)}`).join('');
    const magnetLink = `magnet:?xt=urn:btih:${torrent.infohash}&dn=${encodeURIComponent(torrent.title)}${trackersQuery}`;

    // Get Human Category Info
    const catId = String(torrent.category);
    const categoryName = CATEGORY_MAP[catId] || 'Other';

    // Format fields
    const formattedSize = formatSize(torrent.size);
    const formattedDate = formatDate(torrent.createdAt);

    row.innerHTML = `
      <td class="col-title">
        <span class="row-title" title="${torrent.title}">${torrent.title}</span>
      </td>
      <td class="col-category">
        <span class="row-category">${categoryName}</span>
      </td>
      <td class="col-size text-right">
        <span class="size-txt">${formattedSize}</span>
      </td>
      <td class="col-seeders text-right">
        <span class="seeders-txt">${torrent.seeders.toLocaleString()}</span>
      </td>
      <td class="col-leechers text-right">
        <span class="leechers-txt">${torrent.leechers.toLocaleString()}</span>
      </td>
      <td class="col-date text-right">
        <span class="date-txt">${formattedDate}</span>
      </td>
      <td class="col-actions">
        <div class="row-actions-wrapper">
          <button class="btn-table-action btn-copy-magnet" data-magnet="${magnetLink}">
            Copy Magnet
          </button>
          <a href="${magnetLink}" class="btn-table-action accent" title="Open in your default torrent client">
            Open
          </a>
        </div>
      </td>
    `;

    // Add Copy Magnet event
    const copyBtn = row.querySelector('.btn-copy-magnet');
    copyBtn.addEventListener('click', () => {
      copyToClipboard(magnetLink);
    });

    resultsTbody.appendChild(row);
  });

  // Update pagination indicator & buttons
  pageIndicator.textContent = `Page ${currentPage}`;
  prevPageBtn.disabled = currentPage === 1;
  
  nextPageBtn.disabled = results.length < parseInt(currentLimit);
}

// Format byte size to human readable (GB, MB, etc.)
function formatSize(bytes) {
  if (bytes === 0 || !bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format Date string to English format
function formatDate(dateStr) {
  if (!dateStr) return 'Unknown';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return 'Unknown';
  }
}

// Copy to Clipboard Utility
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Magnet link copied to clipboard');
  }).catch(err => {
    console.error('Could not copy text: ', err);
    // Fallback if clipboard API fails
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('Magnet link copied (safe mode)');
    } catch (e) {
      showToast('Error copying magnet link');
    }
    document.body.removeChild(textArea);
  });
}

// Show Toast message
let toastTimeout;
function showToast(message) {
  clearTimeout(toastTimeout);
  toastText.textContent = message;
  toast.classList.add('show');
  
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// Theme handling (Dark / Light / Kawaii)
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  let newTheme = 'dark';
  if (currentTheme === 'dark') newTheme = 'light';
  else if (currentTheme === 'light') newTheme = 'kawaii';
  else newTheme = 'dark';
  
  applyTheme(newTheme);
}

function restoreTheme() {
  const savedTheme = localStorage.getItem('color-scheme') || 'dark';
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelector('meta[name="color-scheme"]').content = (theme === 'light' || theme === 'kawaii') ? 'light' : 'dark';
  localStorage.setItem('color-scheme', theme);
  
  const textEl = document.getElementById('theme-btn-text');
  if (textEl) {
    if (theme === 'dark') textEl.textContent = 'Theme: Dark';
    else if (theme === 'light') textEl.textContent = 'Theme: Light';
    else if (theme === 'kawaii') textEl.textContent = 'Theme: Kawaii (uwu)';
  }
}
