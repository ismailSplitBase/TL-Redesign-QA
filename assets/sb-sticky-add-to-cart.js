/**
 * Sticky Add To Cart Web Component
 * Handles the sticky Add To Cart bar functionality that appears when the main product form is scrolled out of view
 */
if (!customElements.get('sb-sticky-add-to-cart')) {
  class TdStickyAddToCart extends HTMLElement {
    constructor() {
      super();
      this.stickyVisible = false;
      this.ticking = false;
    }

    connectedCallback() {
      this.initializeElements();
      this.setupEventListeners();
      this.initializeJudgeMeIntegration();
      //console.log('connectedCallback');
    }

    disconnectedCallback() {
      this.removeEventListeners();
    }

    /**
     * Initialize required DOM elements
     */
    initializeElements() {
      this.productForm = document.querySelector(`[data-section-id="${this.dataset.sectionId}"].product-form`);
      this.addToCartButton = this.querySelector('.sb-sticky-atc__button');
      this.mainAddToCartButton = document.getElementById(`ProductSubmitButton-${this.dataset.sectionId}`);

      if (!this.productForm || !this.addToCartButton || !this.mainAddToCartButton) {
        console.warn('TdStickyAddToCart: Required elements not found');
        console.table({
          productForm: this.productForm,
          addToCartButton: this.addToCartButton,
          mainAddToCartButton: this.mainAddToCartButton,
        });
        return;
      }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
      if (!this.productForm || !this.addToCartButton || !this.mainAddToCartButton) return;

      this.handleScroll = this.handleScroll.bind(this);
      this.handleResize = this.handleResize.bind(this);
      this.handleAddToCartClick = this.handleAddToCartClick.bind(this);

      window.addEventListener('scroll', this.handleScroll);
      window.addEventListener('resize', this.handleResize);
      this.addToCartButton.addEventListener('click', this.handleAddToCartClick);

      // Initial check
      this.toggleStickyVisibility();
    }

    /**
     * Remove event listeners
     */
    removeEventListeners() {
      window.removeEventListener('scroll', this.handleScroll);
      window.removeEventListener('resize', this.handleResize);
      if (this.addToCartButton) {
        this.addToCartButton.removeEventListener('click', this.handleAddToCartClick);
      }
    }

    /**
     * Handle scroll events with performance optimization
     */
    handleScroll() {
      if (!this.ticking) {
        requestAnimationFrame(() => {
          this.toggleStickyVisibility();
          this.ticking = false;
        });
        this.ticking = true;
      }
    }

    /**
     * Handle resize events
     */
    handleResize() {
      this.toggleStickyVisibility();
    }

    /**
     * Handle sticky Add To Cart button click
     */
    handleAddToCartClick(event) {
      event.preventDefault();
      if (this.mainAddToCartButton && !this.mainAddToCartButton.disabled) {
        this.mainAddToCartButton.click();
      }
    }

    /**
     * Toggle sticky bar visibility based on product form position
     */
    toggleStickyVisibility() {
      // //console.log('toggleStickyVisibility');
      if (!this.productForm) return;
      // //console.log('productForm', this.productForm);
      const productFormRect = this.productForm.getBoundingClientRect();
      const shouldShow = productFormRect.bottom < 0;
      // //console.log('shouldShow', shouldShow, productFormRect.bottom);
      if (shouldShow && !this.stickyVisible) {
        this.showStickyBar();
      } else if (!shouldShow && this.stickyVisible) {
        this.hideStickyBar();
      }
    }

    /**
     * Show the sticky bar
     */
    showStickyBar() {
      // Ensure element is visible before triggering animation
      this.style.display = 'block';

      // Force a reflow to ensure the element is rendered
      this.offsetHeight;

      // Add visible class to trigger animation
      requestAnimationFrame(() => {
        document.body.style.setProperty('--sticky-atc-height', this.offsetHeight + 5 + 'px');
        document.body.classList.add('sb-sticky-atc-active');
        this.classList.add('sb-sticky-atc--visible');
      });

      this.stickyVisible = true;
    }

    /**
     * Hide the sticky bar
     */
    hideStickyBar() {
      document.body.classList.remove('sb-sticky-atc-active');
      this.classList.remove('sb-sticky-atc--visible');
      document.body.style.removeProperty('--sticky-atc-height');

      // Wait for animation to complete before hiding
      setTimeout(() => {
        if (!this.stickyVisible) {
          this.style.display = 'none';
        }
      }, 300);

      this.stickyVisible = false;
    }

    /**
     * Initialize Judge.me integration for the sticky bar
     */
    initializeJudgeMeIntegration() {
      // Wait for Judge.me to load
      const checkJudgeMe = () => {
        if (window.jdgm && typeof window.jdgm.customizeBadge === 'function') {
          this.syncJudgeMeData();
        } else {
          setTimeout(checkJudgeMe, 500);
        }
      };

      setTimeout(checkJudgeMe, 1000);
    }

    /**
     * Sync Judge.me review data from main product to sticky bar
     */
    syncJudgeMeData() {
      const stickyRatingCount = this.querySelector('.jdgm-rating-count');
      const mainWidget = document.querySelector('.sb-product-card .jdgm-widget, .product .jdgm-widget');

      if (mainWidget && stickyRatingCount) {
        const mainRatingCount = mainWidget.querySelector('.jdgm-rating-count');
        if (mainRatingCount && mainRatingCount.textContent) {
          stickyRatingCount.textContent = mainRatingCount.textContent;
        }
      }
    }
  }

  // Register the custom element if not already defined

  customElements.define('sb-sticky-add-to-cart', TdStickyAddToCart);
}
