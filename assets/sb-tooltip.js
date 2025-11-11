/**
 * TD Tooltip Web Component
 *
 * A reusable tooltip component that displays rich content on hover.
 * Works with normal DOM elements without Shadow DOM or slots.
 *
 * @example
 * <sb-tooltip tooltip-content="Your tooltip text here">
 *   <button>Learn More</button>
 * </sb-tooltip>
 *
 * @example
 * <sb-tooltip>
 *   <button>Learn More</button>
 *   <div class="sb-tooltip__content">
 *     <div class="sb-tooltip__section">
 *       <h3 class="sb-tooltip__section-title">Certificate of Analysis</h3>
 *       <p class="sb-tooltip__section-description">Description...</p>
 *     </div>
 *   </div>
 * </sb-tooltip>
 */

// Only define the component if it hasn't been defined yet
if (!customElements.get('sb-tooltip')) {
  class TdTooltip extends HTMLElement {
    constructor() {
      super();

      // Instance variables
      this.isVisible = false;
      this.showTimeout = null;
      this.hideTimeout = null;
      this.triggerElement = null;
      this.tooltipElement = null;
      this.contentElement = null;

      // Configuration
      this.showDelay = 200;
      this.hideDelay = 100;
    }

    /**
     * Initialize the component when connected to the DOM
     */
    connectedCallback() {
      this.setupComponent();
      this.setupEventListeners();
    }

    /**
     * Clean up when component is disconnected from DOM
     */
    disconnectedCallback() {
      this.removeEventListeners();
      this.clearTimeouts();
    }

    /**
     * Setup the component structure and elements
     */
    setupComponent() {
      // Add the component class for styling
      this.classList.add('sb-tooltip');

      // Find or create content element
      this.contentElement = this.querySelector('.sb-tooltip__content');

      // If no content element exists but tooltip-content attribute is provided
      if (!this.contentElement && this.getAttribute('tooltip-content')) {
        this.contentElement = document.createElement('div');
        this.contentElement.className = 'sb-tooltip__content';
        this.contentElement.innerHTML = this.getAttribute('tooltip-content');
        this.appendChild(this.contentElement);
      }

      // Create the tooltip popup if content exists
      if (this.contentElement) {
        this.createTooltipPopup();
      }

      // Set up trigger element (first child that's not the content)
      this.triggerElement = Array.from(this.children).find(
        (child) => !child.classList.contains('sb-tooltip__content') && !child.classList.contains('sb-tooltip__popup')
      );

      // Hide content element from normal flow
      if (this.contentElement) {
        this.contentElement.style.display = 'none';
      }
    }

    /**
     * Create the tooltip popup element
     */
    createTooltipPopup() {
      this.tooltipElement = document.createElement('div');
      this.tooltipElement.className = 'sb-tooltip__popup';

      // Create content wrapper and copy the existing content
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'sb-tooltip__popup-content';
      contentWrapper.innerHTML = this.contentElement.innerHTML;

      // Add content to tooltip
      this.tooltipElement.appendChild(contentWrapper);

      // Add tooltip to DOM
      this.appendChild(this.tooltipElement);

      // Setup close button event listener
      const closeButton = this.tooltipElement.querySelector('.sb-tooltip__close');
      if (closeButton) {
        closeButton.addEventListener('click', () => this.hideTooltip());
      }
    }

    /**
     * Setup event listeners for tooltip interaction
     */
    setupEventListeners() {
      // Mouse events for desktop
      this.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
      this.addEventListener('mouseleave', this.handleMouseLeave.bind(this));

      // Focus events for keyboard accessibility
      this.addEventListener('focusin', this.handleFocusIn.bind(this));
      this.addEventListener('focusout', this.handleFocusOut.bind(this));

      // Touch events for mobile
      this.addEventListener('touchstart', this.handleTouchStart.bind(this));

      // Listen for clicks outside to close tooltip
      this.documentClickHandler = this.handleDocumentClick.bind(this);
      document.addEventListener('click', this.documentClickHandler);
    }

    /**
     * Remove event listeners
     */
    removeEventListeners() {
      if (this.documentClickHandler) {
        document.removeEventListener('click', this.documentClickHandler);
      }
    }

    /**
     * Handle mouse enter event
     */
    handleMouseEnter() {
      this.clearTimeouts();
      this.showTimeout = setTimeout(() => {
        this.showTooltip();
      }, this.showDelay);
    }

    /**
     * Handle mouse leave event
     */
    handleMouseLeave() {
      this.clearTimeouts();
      this.hideTimeout = setTimeout(() => {
        this.hideTooltip();
      }, this.hideDelay);
    }

    /**
     * Handle focus in event for keyboard accessibility
     */
    handleFocusIn() {
      this.clearTimeouts();
      this.showTooltip();
    }

    /**
     * Handle focus out event for keyboard accessibility
     */
    handleFocusOut() {
      this.clearTimeouts();
      this.hideTimeout = setTimeout(() => {
        this.hideTooltip();
      }, this.hideDelay);
    }

    /**
     * Handle touch start for mobile devices
     */
    handleTouchStart() {
      if (this.isVisible) {
        this.hideTooltip();
      } else {
        this.showTooltip();
      }
    }

    /**
     * Handle document click to close tooltip
     */
    handleDocumentClick(event) {
      if (!this.contains(event.target) && this.isVisible) {
        this.hideTooltip();
      }
    }

    /**
     * Show the tooltip
     */
    showTooltip() {
      if (!this.tooltipElement || this.isVisible) return;

      this.isVisible = true;
      this.tooltipElement.classList.add('sb-tooltip__popup--visible');
      this.positionTooltip();

      // Emit custom event
      this.dispatchEvent(
        new CustomEvent('tooltip-show', {
          bubbles: true,
          detail: { tooltip: this },
        })
      );
    }

    /**
     * Hide the tooltip
     */
    hideTooltip() {
      if (!this.tooltipElement || !this.isVisible) return;

      this.isVisible = false;
      this.tooltipElement.classList.remove('sb-tooltip__popup--visible');

      // Emit custom event
      this.dispatchEvent(
        new CustomEvent('tooltip-hide', {
          bubbles: true,
          detail: { tooltip: this },
        })
      );
    }

    /**
     * Position the tooltip relative to the trigger element
     */
    positionTooltip() {}

    /**
     * Clear all timeouts
     */
    clearTimeouts() {
      if (this.showTimeout) {
        clearTimeout(this.showTimeout);
        this.showTimeout = null;
      }
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
    }
  }

  // Register the custom element
  customElements.define('sb-tooltip', TdTooltip);
}
