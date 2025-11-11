/**
 * TdProductSearch Web Component
 * Handles product search for third-party testing certificates using local JSON data
 *
 * @class TdProductSearch
 * @extends HTMLElement
 */

/**
 * Simple service class for accessing pre-rendered product data
 */
class ProductDataService {
  constructor() {
    this.productData = {};
    this.isDataLoaded = false;
    this.waitForProductData();
  }

  /**
   * Wait for product data to be available
   */
  waitForProductData() {
    if (window.tdProductData) {
      this.productData = window.tdProductData;
      this.isDataLoaded = true;
      //console.log(`Loaded product data for ${Object.keys(this.productData).length} products`);
    } else {
      console.error('Product data not found. Make sure sb-product-data-map.js.liquid is loaded.');
    }
  }

  /**
   * Get product data by handle (synchronous)
   * @param {string} handle - Product handle
   * @returns {Object|null} Product data or null if not found
   */
  getProductByHandle(handle) {
    if (!this.isDataLoaded) {
      console.warn('Product data not yet loaded');
      return null;
    }

    return this.productData[handle] || null;
  }

  /**
   * Get multiple products by handles (synchronous)
   * @param {Array<string>} handles - Array of product handles
   * @returns {Array<Object>} Array of product data
   */
  getProductsBatch(handles) {
    return handles.map((handle) => this.getProductByHandle(handle)).filter(Boolean);
  }

  /**
   * Check if product data is loaded
   * @returns {boolean} True if data is loaded
   */
  isLoaded() {
    return this.isDataLoaded;
  }
}

// Check if custom element is already defined
if (!customElements.get('sb-product-search')) {
  class TdProductSearch extends HTMLElement {
    constructor() {
      super();
      this.searchInput = null;
      this.searchResults = null;
      this.searchButton = null;
      this.searchTimeout = null;
      this.recentProductContainer = null;
      this.recentProductContent = null;
      this.searchHistoryList = null;
      this.recentSection = null;
      this.searchHistorySection = null;
      this.certificateData = [];
      this.isDataLoaded = false;
      this.productService = new ProductDataService();
      this.modalId = null;
    }

    connectedCallback() {
      this.initializeElements();
      this.waitForCertificateData();
      this.setupEventListeners();
      this.initializeDataDependentSections();
      this.modalId = this.getAttribute('data-modal-id');
    }

    /**
     * Initialize sections that depend on data being loaded
     */
    initializeDataDependentSections() {
      // Only load and show sections if both product and certificate data are available
      if (this.productService.isLoaded() && this.isDataLoaded) {
        this.loadRecentProduct();
        this.loadSearchHistory();
        this.showDataDependentSections();
      } else {
        // Wait a bit and try again
        setTimeout(() => this.initializeDataDependentSections(), 100);
      }
    }

    /**
     * Show the sections that depend on data being loaded
     */
    showDataDependentSections() {
      if (this.recentSection) {
        this.recentSection.classList.add('sb-third-party-testing__recent-section--visible');
      }
      if (this.searchHistorySection) {
        this.searchHistorySection.classList.add('sb-third-party-testing__search-history--visible');
      }
    }

    /**
     * Initialize DOM element references
     */
    initializeElements() {
      this.searchInput = this.querySelector('[data-search-input]');
      this.searchResults = this.querySelector('[data-search-results]');
      this.searchButton = this.querySelector('[data-search-button]');
      this.recentTitle = document.querySelector('[data-recent-title]');
      this.recentProductContainer = document.querySelector('[data-recent-product]');
      this.recentProductContent = document.querySelector('[data-recent-content]');
      this.searchHistoryList = document.querySelector('[data-search-history-list]');
      this.recentSection = document.querySelector('[data-recent-section]');
      this.searchHistorySection = document.querySelector('[data-search-history-section]');
    }

    /**
     * Wait for certificate data to be available and then load it
     */
    waitForCertificateData() {
      if (window.coajd) {
        this.loadCertificateData();
      } else {
        console.error('Certificate data not found. Make sure certificate-of-analysis-json-data.js.liquid is loaded.');
      }
    }

    /**
     * Load and parse certificate data from global variable
     */
    loadCertificateData() {
      try {
        if (window.coajd) {
          this.certificateData = JSON.parse(window.coajd);
          this.isDataLoaded = true;
          //console.log(`Loaded ${this.certificateData.length} certificate records`);
        } else {
          console.error('Certificate data not found. Make sure certificate-of-analysis-json-data.js.liquid is loaded.');
        }
      } catch (error) {
        console.error('Error parsing certificate data:', error);
      }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
      if (!this.searchInput) return;

      this.setupInputEventListeners();
      this.setupSearchButtonListener();
    }

    /**
     * Setup input field event listeners
     */
    setupInputEventListeners() {
      // Debounced input search
      this.searchInput.addEventListener('input', (e) => {
        this.handleInputChange(e.target.value.trim());
      });

      // Hide results when clicking outside
      this.searchInput.addEventListener('blur', () => {
        setTimeout(() => this.hideResults(), 200);
      });

      // Show results when focusing if there are results
      this.searchInput.addEventListener('focus', () => {
        this.handleInputFocus();
      });

      // Handle enter key press
      this.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleSearch();
        }
      });
    }

    /**
     * Setup search button event listener
     */
    setupSearchButtonListener() {
      if (this.searchButton) {
        this.searchButton.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleSearch();
        });
      }
    }

    /**
     * Handle input value changes with debouncing
     * @param {string} query - Search query
     */
    handleInputChange(query) {
      clearTimeout(this.searchTimeout);

      // if (query.length < 2) {
      //   this.hideResults();
      //   return;
      // }
      this.hideResults();
      this.searchTimeout = setTimeout(() => {
        this.performSearch(query);
      }, 300);
    }

    /**
     * Handle input focus events
     */
    handleInputFocus() {
      if (this.searchResults.children.length > 0) {
        this.showResults();
      }
    }

    /**
     * Handle search button click or enter key press
     */
    handleSearch() {
      const query = this.searchInput.value.trim();
      if (query.length >= 2) {
        this.performSearch(query);
      }
    }

    /**
     * Perform search using local certificate data
     * @param {string} query - Search query
     */
    performSearch(query) {
      if (!this.isDataLoaded) {
        this.clearSearchResults();
        this.renderNoResults('Certificate data is still loading...');
        return;
      }

      try {
        this.clearSearchResults();
        this.showLoading();
        const results = this.searchCertificates(query);

        setTimeout(() => {
          this.handleSearchResults(results);
        }, 100);
      } catch (error) {
        console.error('Search error:', error);
        this.clearSearchResults();
        this.renderNoResults('An error occurred while searching.');
      }
    }

    /**
     * Handle search results display
     * @param {Array} results - Search results
     */
    handleSearchResults(results) {
      this.clearSearchResults();
      if (results.length > 0) {
        this.renderSearchResults(results);
      } else {
        this.renderNoResults();
      }
      this.showResults();
    }

    /**
     * Search through certificate data
     * @param {string} query - Search query
     * @returns {Array} Filtered and sorted results
     */
    searchCertificates(query) {
      const queryLower = query.toLowerCase();
      const matches = this.findMatchingCertificates(queryLower);
      const sorted = this.sortCertificatesByRelevance(matches, queryLower);

      return sorted.slice(0, 12); // Increased limit to show more results
    }

    /**
     * Find certificates matching the search query
     * @param {string} queryLower - Lowercase search query
     * @returns {Array} Matching certificates
     */
    findMatchingCertificates(queryLower) {
      return this.certificateData.filter((cert) => {
        const productNameMatch = cert.productName.toLowerCase().includes(queryLower);
        const handleMatch = cert.productHandle.toLowerCase().includes(queryLower);
        const lotNumberMatch = cert.lotNumber && cert.lotNumber.toLowerCase().includes(queryLower);
        return productNameMatch || handleMatch || lotNumberMatch;
      });
    }

    /**
     * Sort certificates by relevance
     * @param {Array} matches - Matching certificates
     * @param {string} queryLower - Lowercase search query
     * @returns {Array} Sorted certificates
     */
    sortCertificatesByRelevance(matches, queryLower) {
      return matches.sort((a, b) => {
        const aExact = a.productName.toLowerCase().startsWith(queryLower);
        const bExact = b.productName.toLowerCase().startsWith(queryLower);

        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // Secondary sort by date (newest first)
        if (a.date && b.date) {
          return new Date(b.date) - new Date(a.date);
        }

        return a.productName.localeCompare(b.productName);
      });
    }

    /**
     * Show loading state
     */
    showLoading() {
      const template = document.getElementById('search-loading-template');
      if (template) {
        const clone = template.content.cloneNode(true);
        this.searchResults.appendChild(clone);
      }
      this.showResults();
    }

    /**
     * Clear search results container
     */
    clearSearchResults() {
      if (this.searchResults) {
        this.searchResults.innerHTML = '';
      }
    }

    /**
     * Render search results with product data
     * @param {Array} results - Array of certificate objects
     */
    renderSearchResults(results) {
      const resultTemplate = this.getTemplate('search-result-item-template');
      const dividerTemplate = this.getTemplate('search-result-divider-template');

      if (!resultTemplate) return;

      results.forEach((cert, index) => {
        this.renderSingleResult(cert, resultTemplate);
        this.addDividerIfNeeded(index, results.length, dividerTemplate);
      });

      this.setupResultClickListeners();
    }

    /**
     * Get template by ID
     * @param {string} templateId - Template ID
     * @returns {HTMLTemplateElement|null} Template element
     */
    getTemplate(templateId) {
      const template = document.getElementById(templateId);
      if (!template) {
        console.error(`Template not found: ${templateId}`);
      }
      return template;
    }

    /**
     * Render a single search result
     * @param {Object} cert - Certificate data
     * @param {HTMLTemplateElement} template - Result template
     */
    renderSingleResult(cert, template) {
      const productData = this.productService.getProductByHandle(cert.productHandle);
      const clone = template.content.cloneNode(true);

      this.populateResultData(clone, cert, productData);
      this.setResultTitle(clone, cert, productData);
      this.setResultImage(clone, cert, productData);
      this.setResultDetails(clone, cert);

      this.searchResults.appendChild(clone);
    }

    /**
     * Populate result data attributes
     * @param {DocumentFragment} clone - Cloned template
     * @param {Object} cert - Certificate data
     * @param {Object} productData - Product data
     */
    populateResultData(clone, cert, productData) {
      const resultEl = clone.querySelector('.sb-third-party-testing__search-result');

      resultEl.dataset.productHandle = cert.productHandle;
      resultEl.dataset.productTitle = cert.productName;
      resultEl.dataset.lotNumber = cert.lotNumber;
      resultEl.dataset.pdfUrl = cert.pdfurl;
      resultEl.dataset.analysisType = cert.AnalysisType;
      resultEl.dataset.testDate = cert.date;
      resultEl.dataset.productData = productData ? JSON.stringify(productData) : '';
    }

    /**
     * Set result title
     * @param {DocumentFragment} clone - Cloned template
     * @param {Object} cert - Certificate data
     * @param {Object} productData - Product data
     */
    setResultTitle(clone, cert, productData) {
      const titleEl = clone.querySelector('[data-title]');
      if (titleEl) {
        const displayTitle = cert?.productName || productData?.title || 'Product';
        titleEl.textContent = displayTitle;
      }
    }

    /**
     * Set result image
     * @param {DocumentFragment} clone - Cloned template
     * @param {Object} cert - Certificate data
     * @param {Object} productData - Product data
     */
    setResultImage(clone, cert, productData) {
      const imageContainer = clone.querySelector('[data-image-container]');
      if (imageContainer && productData?.featured_image) {
        const displayTitle = productData?.title || cert.productName;
        const img = this.createProductImage(
          productData.featured_image ||
            '//cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png?v=1530129081',
          displayTitle
        );
        imageContainer.replaceWith(img);
      }
    }

    /**
     * Create product image element
     * @param {string} imageSrc - Image source URL
     * @param {string} altText - Alt text
     * @returns {HTMLImageElement} Image element
     */
    createProductImage(imageSrc, altText) {
      const img = document.createElement('img');
      img.src = imageSrc;
      img.alt = altText;
      img.className = 'sb-third-party-testing__search-result-image';
      img.loading = 'lazy';
      return img;
    }

    /**
     * Add divider between results if needed
     * @param {number} index - Current index
     * @param {number} totalLength - Total results length
     * @param {HTMLTemplateElement} dividerTemplate - Divider template
     */
    addDividerIfNeeded(index, totalLength, dividerTemplate) {
      if (index < totalLength - 1 && dividerTemplate) {
        const dividerClone = dividerTemplate.content.cloneNode(true);
        this.searchResults.appendChild(dividerClone);
      }
    }

    /**
     * Render no results message
     * @param {string} message - Optional custom message
     */
    renderNoResults(message = 'No results found for your search.') {
      const template = this.getTemplate('search-no-results-template');
      if (template) {
        const clone = template.content.cloneNode(true);
        this.setNoResultsMessage(clone, message);
        this.searchResults.appendChild(clone);
      }
    }

    /**
     * Set no results message text
     * @param {DocumentFragment} clone - Cloned template
     * @param {string} message - Message text
     */
    setNoResultsMessage(clone, message) {
      const messageEl = clone.querySelector('[data-message]');
      if (messageEl) {
        messageEl.textContent = message;
      }
    }

    /**
     * Setup click listeners for search results
     */
    setupResultClickListeners() {
      const results = this.searchResults.querySelectorAll('.sb-third-party-testing__search-result');
      results.forEach((result) => {
        result.addEventListener('click', (e) => {
          const certificateData = this.extractCertificateData(e.currentTarget);
          this.handleCertificateSelection(certificateData);
        });
      });
    }

    /**
     * Extract certificate data from DOM element
     * @param {HTMLElement} element - DOM element with data attributes
     * @returns {Object} Certificate data object
     */
    extractCertificateData(element) {
      return {
        handle: element.dataset.productHandle,
        title: element.dataset.productTitle,
        lotNumber: element.dataset.lotNumber,
        pdfUrl: element.dataset.pdfUrl,
        analysisType: element.dataset.analysisType,
        testDate: element.dataset.testDate,
      };
    }

    /**
     * Handle selection of a certificate from search results
     * @param {Object} certificate - Certificate data object
     */
    handleCertificateSelection(certificate) {
      this.storeCertificateData(certificate);
      this.addToSearchHistory(certificate);
      this.displayRecentProduct(certificate);
      this.openCertificateInModal(certificate.pdfUrl);
      this.clearSearchState();
    }

    /**
     * Store certificate data in localStorage
     * @param {Object} certificate - Certificate data object
     */
    storeCertificateData(certificate) {
      localStorage.setItem('td_recent_product', JSON.stringify(certificate));
    }

    /**
     * Open certificate PDF in modal using PDF.js
     * @param {string} pdfUrl - PDF URL
     */
    openCertificateInModal(pdfUrl) {
      if (!this.modalId) {
        // Fallback to opening in new tab if no modal is available
        window.open(pdfUrl, '_blank');
        return;
      }

      // Get the PDF viewer template
      const pdfTemplate = document.getElementById('sb-pdf-viewer-template');
      if (!pdfTemplate) {
        console.error('PDF viewer template not found');
        window.open(pdfUrl, '_blank');
        return;
      }

      // Convert the template clone to HTML string
      const tempContainer = document.createElement('div');
      const clone = pdfTemplate.content.cloneNode(true);
      tempContainer.appendChild(clone);

      // Dispatch event to update modal with the viewer HTML
      document.dispatchEvent(
        new CustomEvent('sb-modal:update', {
          detail: {
            modalId: this.modalId,
            heading: 'Certificate of Analysis',
            children: tempContainer.innerHTML,
          },
        })
      );

      // Open the modal
      document.dispatchEvent(
        new CustomEvent('sb-modal:open', {
          detail: {
            modalId: this.modalId,
          },
        })
      );

      // Initialize PDF.js once the modal is opened and elements are in the DOM
      this.initPdfViewer(pdfUrl);
    }

    /**
     * Initialize PDF.js viewer with optimized high-resolution rendering
     * @param {string} pdfUrl - PDF URL
     */
    async initPdfViewer(pdfUrl) {
      // Check if PDF.js is available
      if (!window.pdfjsLib) {
        console.error('PDF.js library not found');
        window.open(pdfUrl, '_blank');
        // Show close button so user can close the modal
        this.showCloseButton();
        return;
      }

      // Wait a bit for the modal to be fully in the DOM
      setTimeout(async () => {
        const container = document.querySelector('.sb-modal__body .sb-pdf-viewer__container');

        if (!container) {
          console.error('PDF container not found in modal');
          // Show close button so user can close the modal
          this.showCloseButton();
          return;
        }

        try {
          // Load the PDF document
          const loadingTask = window.pdfjsLib.getDocument(pdfUrl);
          const pdf = await loadingTask.promise;

          // Get the first page
          const page = await pdf.getPage(1);

          // Remove loading indicator
          const loadingElement = container.querySelector('.sb-pdf-viewer__loading');
          if (loadingElement) loadingElement.remove();

          // Calculate optimal viewport with enhanced scaling for large screens
          const containerWidth = container.clientWidth - 40; // Some margin
          const viewport = page.getViewport({ scale: 1 });
          const devicePixelRatio = window.devicePixelRatio || 1;

          // Detect screen size for optimized scaling
          const isLargeScreen = window.innerWidth >= 1024; // Desktop/tablet landscape
          const isHighDPI = devicePixelRatio > 1;

          // Calculate base scale to fit container width
          const baseScale = containerWidth / viewport.width;

          // Enhanced scaling strategy for different screen sizes
          let renderScale;
          let maxScale;

          if (isLargeScreen) {
            // Large screens: prioritize quality, especially on high DPI displays
            const minScale = isHighDPI ? 1.5 : 1.0; // Higher minimum for large screens
            maxScale = isHighDPI ? 4.0 : 3.0; // Allow higher scaling on high DPI

            // For large screens, use more aggressive scaling for quality
            const qualityMultiplier = isHighDPI ? 2.0 : 1.5;
            renderScale = Math.min(maxScale, Math.max(minScale, baseScale * devicePixelRatio * qualityMultiplier));
          } else {
            // Small screens: balance quality and performance
            const minScale = 0.8; // Minimum scale to maintain quality
            maxScale = 2.5; // Conservative max for mobile performance

            // Use standard scaling for mobile devices
            renderScale = Math.min(maxScale, Math.max(minScale, baseScale * devicePixelRatio));
          }

          // Create viewport for rendering (high resolution)
          const renderViewport = page.getViewport({ scale: renderScale });

          // Create canvas with optimized resolution
          const canvas = document.createElement('canvas');
          canvas.className = 'sb-pdf-viewer__canvas';

          // Set canvas size for high-DPI rendering
          canvas.width = renderViewport.width;
          canvas.height = renderViewport.height;

          // Style the canvas for proper display
          canvas.style.maxWidth = '100%';
          canvas.style.height = 'auto';

          // For large screens with high DPI, apply additional sharpening
          if (isLargeScreen && isHighDPI) {
            canvas.style.imageRendering = 'crisp-edges';
            canvas.style.imageRendering = '-webkit-crisp-edges';
          }

          // Add canvas to container
          container.appendChild(canvas);

          // Get context and configure for high-DPI
          const ctx = canvas.getContext('2d');

          // Enable high-quality rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Render PDF page at optimized resolution
          const renderContext = {
            canvasContext: ctx,
            viewport: renderViewport,
          };

          await page.render(renderContext).promise;

          // Show close button after PDF has loaded successfully
          this.showCloseButton();
        } catch (err) {
          console.error('Error rendering PDF:', err);
          container.innerHTML = `
          <div style="padding: 20px; text-align: center;">
            <p>Unable to load PDF. <a href="${pdfUrl}" target="_blank" rel="noopener noreferrer">Open PDF in new tab</a></p>
          </div>
        `;

          // Show close button even if PDF loading fails
          this.showCloseButton();
        }
      }, 300); // Give the modal time to open
    }

    /**
     * Show the close button in the PDF viewer modal
     */
    showCloseButton() {
      const closeButton = document.querySelector('.sb-pdf-viewer__close');
      if (closeButton) {
        closeButton.style.display = 'flex';
      }
    }

    /**
     * Clear search input and hide results
     */
    clearSearchState() {
      this.hideResults();
      // this.searchInput.value = '';
    }

    /**
     * Add search to history
     * @param {Object} certificate - Certificate data object
     */
    addToSearchHistory(certificate) {
      let searchHistory = this.getSearchHistory();
      const searchEntry = this.createSearchHistoryEntry(certificate);

      console.log(certificate);
      searchHistory = this.removeDuplicateHistoryEntries(searchHistory, certificate.pdfUrl);
      searchHistory = this.addAndLimitHistory(searchHistory, searchEntry);

      this.saveSearchHistory(searchHistory);
      this.refreshSearchHistory();
    }

    /**
     * Get search history from localStorage
     * @returns {Array} Search history array
     */
    getSearchHistory() {
      return JSON.parse(localStorage.getItem('td_search_history') || '[]');
    }

    /**
     * Create search history entry
     * @param {Object} certificate - Certificate data object
     * @returns {Object} Search history entry
     */
    createSearchHistoryEntry(certificate) {
      return {
        date: new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }),
        productName: certificate.title,
        testType: certificate.analysisType,
        handle: certificate.handle,
        image: this.productService.getProductByHandle(certificate.handle)?.featured_image || '',
        pdfUrl: certificate.pdfUrl,
        timestamp: Date.now(),
      };
    }

    /**
     * Remove duplicate entries for the same product
     * @param {Array} searchHistory - Current search history
     * @param {string} productName - Product name to remove duplicates for
     * @returns {Array} Filtered search history
     */
    removeDuplicateHistoryEntries(searchHistory, pdfUrl) {
      return searchHistory.filter((item) => item.pdfUrl !== pdfUrl);
    }

    /**
     * Add new entry and limit history size
     * @param {Array} searchHistory - Current search history
     * @param {Object} searchEntry - New search entry
     * @returns {Array} Updated search history
     */
    addAndLimitHistory(searchHistory, searchEntry) {
      searchHistory.unshift(searchEntry);
      return searchHistory.slice(0, 10);
    }

    /**
     * Save search history to localStorage
     * @param {Array} searchHistory - Search history to save
     */
    saveSearchHistory(searchHistory) {
      localStorage.setItem('td_search_history', JSON.stringify(searchHistory));
    }

    /**
     * Load and display search history
     */
    loadSearchHistory() {
      this.refreshSearchHistory();
    }

    /**
     * Refresh and display the entire search history
     * Replaces displaySearchHistory() to ensure full UI update
     */
    refreshSearchHistory() {
      if (!this.searchHistoryList) return;

      const searchHistory = this.getSearchHistory();
      const searchHistorySection = document.querySelector('.sb-third-party-testing__search-history');

      if (searchHistory.length === 0) {
        this.hideSearchHistorySection(searchHistorySection);
        return;
      }

      this.showSearchHistorySection(searchHistorySection);
      this.renderSearchHistoryItems(searchHistory);
    }

    /**
     * Display search history in the sidebar
     * @deprecated Use refreshSearchHistory() instead
     */
    displaySearchHistory() {
      this.refreshSearchHistory();
    }

    /**
     * Hide search history section
     * @param {HTMLElement} section - Search history section element
     */
    hideSearchHistorySection(section) {
      if (section) {
        section.style.display = 'none';
      }
    }

    /**
     * Show search history section
     * @param {HTMLElement} section - Search history section element
     */
    showSearchHistorySection(section) {
      if (section) {
        section.style.display = 'flex';
      }
    }

    /**
     * Render search history items
     * @param {Array} searchHistory - Search history array
     */
    renderSearchHistoryItems(searchHistory) {
      const template = this.getTemplate('search-history-item-template');
      if (!template) return;

      this.searchHistoryList.innerHTML = '';

      searchHistory.forEach((item) => {
        const clone = template.content.cloneNode(true);
        this.populateSearchHistoryItem(clone, item);
        this.searchHistoryList.appendChild(clone);
      });
    }

    /**
     * Populate search history item data
     * @param {DocumentFragment} clone - Cloned template
     * @param {Object} item - History item data
     */
    populateSearchHistoryItem(clone, item) {
      clone.querySelectorAll('[data-date]').forEach((el) => (el.textContent = item.date));
      clone.querySelectorAll('[data-product-name]').forEach((el) => (el.textContent = item.productName));
      clone.querySelectorAll('[data-test-type]').forEach((el) => (el.textContent = item.testType));

      const imgMount = clone.querySelector('[data-history-image]');
      if (imgMount) {
        let imageSrc = item.image || '';
        if (!imageSrc && item.handle) {
          const productData = this.productService.getProductByHandle(item.handle);
          imageSrc = productData?.featured_image || '';
        }

        if (imageSrc) {
          const img = document.createElement('img');
          img.className = 'sb-third-party-testing__search-history-thumb-img sb-only-desktop';
          img.alt = item.productName || 'Product image';
          img.loading = 'lazy';
          img.src = imageSrc;
          imgMount.replaceWith(img);
        } else {
          // Keep mount as a subtle placeholder block
          imgMount.classList.add('sb-third-party-testing__search-history-thumb-img');
          imgMount.style.backgroundColor = '#f0f2f5';
        }
      }

      const linkEl = clone.querySelector('[data-pdf-link]');
      linkEl.href = 'javascript:void(0);'; // Prevent default navigation
      linkEl.removeAttribute('target');

      // Add click event to open in modal instead
      linkEl.addEventListener('click', (e) => {
        e.preventDefault();
        this.openCertificateInModal(item.pdfUrl);
      });
    }

    /**
     * Display recent product in the main section
     * @param {Object} certificate - Certificate data object
     */
    displayRecentProduct(certificate) {
      if (!this.recentProductContainer || !this.recentProductContent) return;

      const template = this.getTemplate('recent-product-template');
      if (!template) return;

      if (this.recentTitle) {
        this.recentTitle.classList.remove('sb-third-party-testing__recent-title--hidden');
      }

      const clone = template.content.cloneNode(true);
      const productData = this.productService.getProductByHandle(certificate.handle);
      console.log('Displaying recent product:', certificate, productData);
      this.setRecentProductImage(clone, certificate, productData);
      this.setRecentProductTitle(clone, certificate, productData);
      this.setRecentProductDescription(clone, certificate, productData);
      this.setRecentProductLink(clone, certificate);
      this.displayRecentProductContent(clone);
    }

    /**
     * Set recent product image
     * @param {DocumentFragment} clone - Cloned template
     * @param {Object} certificate - Certificate data
     * @param {Object} productData - Product data
     */
    setRecentProductImage(clone, certificate, productData) {
      const imageEl = clone.querySelector('[data-image]');
      if (productData?.featured_image) {
        const img = document.createElement('img');
        img.src = productData.featured_image;
        img.alt = certificate.title;
        img.className = 'sb-third-party-testing__recent-image';
        img.loading = 'lazy';
        imageEl.replaceWith(img);
      } else {
        imageEl.style.backgroundColor = '#f8f9fb';
      }
    }

    /**
     * Set recent product title
     * @param {DocumentFragment} clone - Cloned template
     * @param {Object} certificate - Certificate data
     * @param {Object} productData - Product data
     */
    setRecentProductTitle(clone, certificate, productData) {
      const displayTitle = productData?.title || certificate.title;
      clone.querySelector('[data-title]').textContent = displayTitle;
    }

    /**
     * Set recent product description
     * @param {DocumentFragment} clone - Cloned template
     * @param {Object} certificate - Certificate data
     * @param {Object} productData - Product data
     */
    setRecentProductDescription(clone, certificate, productData) {
      const description = this.getProductDescription(certificate, productData);
      const cleanLimitedText = this.cleanAndLimitText(description, 18);
      clone.querySelector('[data-description]').textContent = cleanLimitedText;
    }

    /**
     * Get product description from various sources
     * @param {Object} certificate - Certificate data
     * @param {Object} productData - Product data
     * @returns {string} Description text
     */
    getProductDescription(certificate, productData) {
      if (productData?.description) {
        if (productData.metafields?.plp_product_short_description) {
          return productData.metafields.plp_product_short_description;
        }
        return productData.description;
      }
      return `Lot Number: ${certificate.lotNumber} | Test Type: ${certificate.analysisType} | Date: ${certificate.testDate}`;
    }

    /**
     * Clean HTML and limit text to specified word count
     * @param {string} text - Text to clean and limit
     * @param {number} wordLimit - Maximum number of words
     * @returns {string} Clean, limited text
     */
    cleanAndLimitText(text, wordLimit) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = text;
      const cleanText = tempDiv.textContent || tempDiv.innerText || '';
      return cleanText.split(' ').slice(0, wordLimit).join(' ');
    }

    /**
     * Set recent product link
     * @param {DocumentFragment} clone - Cloned template
     * @param {Object} certificate - Certificate data
     */
    setRecentProductLink(clone, certificate) {
      const linkEl = clone.querySelector('[data-link]');
      linkEl.href = `/products/${certificate.handle}`; // Set product URL
      // Ensure the button becomes visible once a valid link is present
      if (linkEl.classList && linkEl.classList.contains('hidden')) {
        linkEl.classList.remove('hidden');
      }
      // // linkEl.querySelector('.sb-third-party-testing__view-product-text').textContent = 'View Certificate';

      // // Add click event to open in modal
      // linkEl.addEventListener('click', (e) => {
      //   e.preventDefault();
      //   this.openCertificateInModal(certificate.pdfUrl);
      // });
    }

    /**
     * Display recent product content
     * @param {DocumentFragment} clone - Cloned template content
     */
    displayRecentProductContent(clone) {
      this.recentProductContent.innerHTML = '';
      this.recentProductContent.appendChild(clone);
      this.recentProductContainer.classList.add('sb-third-party-testing__recent-product--visible');
    }

    /**
     * Load and display the most recent product
     */
    loadRecentProduct() {
      const recentProduct = localStorage.getItem('td_recent_product');
      if (recentProduct) {
        try {
          const productData = JSON.parse(recentProduct);
          this.displayRecentProduct(productData);
        } catch (error) {
          console.error('Error loading recent product:', error);
        }
      }
    }

    /**
     * Show search results dropdown
     */
    showResults() {
      if (this.searchResults) {
        this.searchResults.classList.add('sb-third-party-testing__search-results--visible');
      }
    }

    /**
     * Hide search results dropdown
     */
    hideResults() {
      if (this.searchResults) {
        this.searchResults.classList.remove('sb-third-party-testing__search-results--visible');
      }
    }

    /**
     * Set result details (test type and date)
     * @param {DocumentFragment} clone - Cloned template
     * @param {Object} cert - Certificate data
     */
    setResultDetails(clone, cert) {
      // const lotEl = clone.querySelector('[data-lot-number-child]');
      const typeEl = clone.querySelector('[data-analysis-display-child]');
      const dateEl = clone.querySelector('[data-test-date-child]');

      // // // Set lot number
      // if (lotEl && cert.lotNumber) {
      //   lotEl.textContent = `Lot: ${cert.lotNumber}`;
      // }

      // Set test type - try both camelCase and PascalCase property names
      if (typeEl) {
        const analysisType = cert.analysisType || cert.AnalysisType;
        typeEl.textContent = analysisType || 'Test';
      }

      // Set date
      if (dateEl && cert.date) {
        try {
          const testDate = new Date(cert.date);
          dateEl.textContent = testDate.toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
          });
        } catch (e) {
          dateEl.textContent = cert.date;
        }
      }
    }
  }

  // Register the custom element
  customElements.define('sb-product-search', TdProductSearch);
}
