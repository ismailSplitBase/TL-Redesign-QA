/**
 * TD PDF Viewer Web Component
 * Renders as a clickable link that opens PDFs in a modal viewer
 *
 * @class TdPdfViewer
 * @extends HTMLElement
 */
class TdPdfViewer extends HTMLElement {
  /**
   * Define observed attributes for the component
   * @returns {string[]} Array of attribute names to observe
   */
  static get observedAttributes() {
    return ['modal-id'];
  }

  /**
   * Initialize the component when connected to DOM
   */
  connectedCallback() {
    this.initializeComponent();
  }

  /**
   * Handle attribute changes
   * @param {string} name - Attribute name
   * @param {string} oldValue - Previous value
   * @param {string} newValue - New value
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.isConnected) {
      this.render();
    }
  }

  /**
   * Initialize the PDF viewer component
   */
  initializeComponent() {
    this.loadPdfJsLibrary();
    this.render();
    this.setupEventListeners();
  }

  /**
   * Enhance existing anchor tag
   */
  render() {
    // Find the anchor tag within this component
    const anchor = this.querySelector('a.sb-product-testing__link');
    if (!anchor) return;

    // Add data attributes for modal integration
    const modalId = this.getAttribute('modal-id');
    if (modalId) {
      anchor.setAttribute('data-modal-id', modalId);
    }

    // Ensure anchor has proper accessibility attributes
    anchor.setAttribute('role', 'button');
    anchor.setAttribute('aria-label', `Open ${anchor.textContent.trim()} in PDF viewer`);
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Listen for clicks on the internal link
    this.addEventListener('click', this.handleClick.bind(this));
  }

  /**
   * Load PDF.js library if not already loaded
   */
  loadPdfJsLibrary() {
    if (!window.pdfjsLib && !document.querySelector('script[src*="pdf.min.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.179/pdf.min.js';
      script.defer = true;
      document.head.appendChild(script);
    }
  }

  /**
   * Handle click events
   * @param {Event} event - Click event
   */
  handleClick(event) {
    // Only handle clicks on anchor tags
    const anchor = event.target.closest('a.sb-product-testing__link');
    if (!anchor) return;

    event.preventDefault();

    const href = anchor.href;
    const modalId = anchor.getAttribute('data-modal-id');

    if (!href || !modalId) {
      console.warn('sb-pdf-viewer: Missing href or modal-id attribute');
      // Let the browser handle the link normally
      return;
    }

    this.openPdfModal(href, modalId);
  }

  /**
   * Open PDF in modal viewer
   * @param {string} pdfUrl - URL of the PDF to display
   * @param {string} modalId - ID of the modal to use
   */
  async openPdfModal(pdfUrl, modalId) {
    try {
      // Get PDF template
      const pdfTemplate = document.getElementById('sb-pdf-viewer-template');
      if (!pdfTemplate) {
        console.error('PDF viewer template not found');
        window.open(pdfUrl, '_blank');
        return;
      }

      // Prepare modal content
      const tempContainer = document.createElement('div');
      const clone = pdfTemplate.content.cloneNode(true);
      tempContainer.appendChild(clone);

      // Update modal with PDF viewer
      this.dispatchModalUpdate(modalId, tempContainer.innerHTML);

      // Open modal
      this.dispatchModalOpen(modalId);

      // Initialize PDF viewer after modal opens
      setTimeout(() => this.initPdfViewer(pdfUrl), 300);
    } catch (error) {
      console.error('Error opening PDF modal:', error);
      window.open(pdfUrl, '_blank');
    }
  }

  /**
   * Initialize PDF viewer with PDF.js and optimized high-resolution rendering
   * @param {string} pdfUrl - URL of the PDF to render
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
   * Dispatch modal update event
   * @param {string} modalId - Modal ID
   * @param {string} content - HTML content for modal
   */
  dispatchModalUpdate(modalId, content) {
    document.dispatchEvent(
      new CustomEvent('sb-modal:update', {
        detail: {
          modalId: modalId,
          heading: 'Certificate of Analysis',
          children: content,
        },
      })
    );
  }

  /**
   * Dispatch modal open event
   * @param {string} modalId - Modal ID
   */
  dispatchModalOpen(modalId) {
    document.dispatchEvent(
      new CustomEvent('sb-modal:open', {
        detail: {
          modalId: modalId,
        },
      })
    );
  }
}

// Register the custom element if not already defined
if (!customElements.get('sb-pdf-viewer')) {
  customElements.define('sb-pdf-viewer', TdPdfViewer);
}
