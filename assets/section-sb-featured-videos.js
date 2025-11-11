if (!customElements.get('sb-featured-videos')) {
  class SbFeaturedVideos extends HTMLElement {
    constructor() {
      super();
      this.viewAllSelector = this.querySelector('[data-view-all]');
      this.handleViewAllClick = this.handleViewAllClick.bind(this);
    }

    connectedCallback() {
      this.addEventListeners();
    }

    disconnectedCallback() {
      this.removeEventListeners();
    }

    /**
     * Adds all necessary event listeners.
     */
    addEventListeners() {
      if (this.viewAllSelector) {
        this.viewAllSelector.addEventListener('click', this.handleViewAllClick);
      }
    }

    /**
     * Removes all event listeners to prevent memory leaks.
     */
    removeEventListeners() {
      if (this.viewAllSelector) {
        this.viewAllSelector.removeEventListener('click', this.handleViewAllClick);
      }
    }

    handleViewAllClick(event) {
      event.preventDefault();
      this.dataset.loading = 'true';
      this.viewAllSelector.classList.toggle('active');
      const currentValue = this.getAttribute('data-tab-content');
      this.setAttribute('data-tab-content', currentValue === 'slider' ? 'grid' : 'slider');
      setTimeout(() => {
        this.dataset.loading = 'false';
      }, 200);
    }
  }

  customElements.define('sb-featured-videos', SbFeaturedVideos);
}
