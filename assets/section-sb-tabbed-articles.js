if (!customElements.get('sb-tabbed-articles')) {
  class SbTabbedArticles extends HTMLElement {
    constructor() {
      super();
      this.tabSelectors = this.querySelectorAll('[data-tab-selector]');
      this.tabsContent = this.querySelector('[data-tab-content]');
      this.viewAllSelector = this.querySelector('[data-view-all]');
      this.contentContainer = this.querySelector('[data-tab-content]');
      this.paginationContainer = this.querySelector('.pagination-content');

      this.blogUrl = this.getAttribute('data-blog-url') || '';
      this.sectionId = this.getAttribute('data-section-id') || '';

      this.handleTabClick = this.handleTabClick.bind(this);
      this.handleViewAllClick = this.handleViewAllClick.bind(this);
      this.handlePageView = this.handlePageView.bind(this);
    }

    connectedCallback() {
      this.addEventListeners();
      this.setPaginationListeners();
    }

    disconnectedCallback() {
      this.removeEventListeners();
    }

    /**
     * Adds all necessary event listeners.
     */
    addEventListeners() {
      this.tabSelectors.forEach((tab) => {
        tab.addEventListener('click', this.handleTabClick);
      });

      if (this.viewAllSelector) {
        this.viewAllSelector.addEventListener('click', this.handleViewAllClick);
      }
    }

    /**
     * Removes all event listeners to prevent memory leaks.
     */
    removeEventListeners() {
      this.tabSelectors.forEach((tab) => {
        tab.removeEventListener('click', this.handleTabClick);
      });

      if (this.viewAllSelector) {
        this.viewAllSelector.removeEventListener('click', this.handleViewAllClick);
      }
    }

    /**
     * Handles clicks on individual tab selectors.
     * @param {Event} event - The click event.
     */
    handleTabClick(event) {
      const clickedTab = event.currentTarget;
      if (clickedTab.dataset.tabActive === 'true') {
        return;
      }

      this.tabSelectors.forEach((tab) => {
        tab.setAttribute('data-tab-active', 'false');
      });
      clickedTab.setAttribute('data-tab-active', 'true');

      const tag = clickedTab.dataset.tab === 'all' ? '' : `/tagged/${clickedTab.dataset.tab}`;
      const baseUrl = `${window.location.origin}${this.blogUrl}${tag}`;
      const url = `${baseUrl}?sections=${this.sectionId}`;

      this.fetchAndReplaceContent(baseUrl, url);
    }

    /**
     * Fetches new content and replaces the existing content in the tabbed area.
     * @param {string} url - The URL to fetch content from.
     */
    async fetchAndReplaceContent(baseUrl, url) {
      if (!this.contentContainer) {
        console.warn('Content container not found for tabbed grouping.');
        return;
      }

      this.dataset.loading = 'true';
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const htmlString = data[this.sectionId];

        if (!htmlString) {
          console.warn(`No content found for section ID: ${this.sectionId}`);
          this.contentContainer.innerHTML = '';
          this.toggleViewAllVisibility(true);
          return;
        }

        const parser = new DOMParser();
        const parsedDoc = parser.parseFromString(htmlString, 'text/html');
        const newContent = parsedDoc.querySelector('[data-tab-content]');

        if (newContent) {
          this.contentContainer.innerHTML = newContent.innerHTML;
        } else {
          console.warn('New content element [data-tab-content] not found in fetched HTML.');
          this.contentContainer.innerHTML = '';
        }

        const newPaginationContent = parsedDoc.querySelector('.pagination-content');
        this.toggleViewAllVisibility(!newPaginationContent || newPaginationContent.innerHTML.trim() === '');
        this.setPaginationListeners();
        history.pushState(null, '', baseUrl);
      } catch (error) {
        console.error('Error fetching or parsing content:', error);
      } finally {
        this.dataset.loading = 'false';
      }
    }

    /**
     * Toggles the visibility of the "View All" button.
     * @param {boolean} hide - If true, hides the button; otherwise, shows it.
     */
    toggleViewAllVisibility(hide) {
      if (this.viewAllSelector) {
        this.viewAllSelector.classList.toggle('hidden', hide);
      }
    }

    /**
     * Handles the click event for the "View All" button.
     * @param {Event} event - The click event.
     */
    handleViewAllClick(event) {
      event.preventDefault();
      this.dataset.loading = 'true';
      this.viewAllSelector.classList.toggle('active');
      if (this.tabsContent) {
        const currentValue = this.tabsContent.getAttribute('data-tab-content');
        this.tabsContent.setAttribute('data-tab-content', currentValue === 'slider' ? 'grid' : 'slider');
      }
      setTimeout(() => {
        this.dataset.loading = 'false';
      }, 200);
    }

    /**
     * Sets up event listeners for pagination links within the current content.
     */
    setPaginationListeners() {
      const newPagesEl = this.querySelectorAll('.pagination-content a.pagination__item');
      newPagesEl.forEach((page) => {
        page.addEventListener('click', this.handlePageView);
      });
    }

    /**
     * Handles clicks on pagination links.
     * @param {Event} event - The click event.
     */
    async handlePageView(event) {
      event.preventDefault();
      const newPageURL = event.currentTarget.getAttribute('href');
      const gridContainer = this.querySelector('.sb-latest-articles--grid');

      if (!newPageURL || !gridContainer) {
        console.warn('Pagination URL or grid container not found.');
        return;
      }

      this.dataset.loading = 'true';
      const url = new URL(newPageURL, window.location.origin);
      url.searchParams.set('sections', this.sectionId);

      try {
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const htmlString = data[this.sectionId];

        if (!htmlString) {
          console.warn(`No content found for section ID: ${this.sectionId} during pagination.`);
          return;
        }

        const parser = new DOMParser();
        const parsedDoc = parser.parseFromString(htmlString, 'text/html');
        const newGridContent = parsedDoc.querySelector('.sb-latest-articles--grid');

        if (newGridContent) {
          gridContainer.innerHTML = newGridContent.innerHTML;
        } else {
          console.warn(
            'New grid content element (.sb-latest-articles--grid) not found in fetched HTML during pagination.'
          );
        }

        this.setPaginationListeners();
        this.scrollIntoView({ behavior: 'smooth', block: 'start' });

        history.pushState(null, '', newPageURL);
      } catch (error) {
        console.error('Error fetching or parsing paginated content:', error);
      } finally {
        this.dataset.loading = 'false';
      }
    }
  }

  customElements.define('sb-tabbed-articles', SbTabbedArticles);
}
