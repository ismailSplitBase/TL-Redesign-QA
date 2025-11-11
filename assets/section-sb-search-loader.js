if (!customElements.get('section-sb-search-loader')) {
  class SectionSbSearchLoader extends HTMLElement {
    constructor() {
      super();
      this.searchTerm = null
      this.objectType = null
      this.section = null
      this.searchParams = null
    }
    connectedCallback() {
      this.initializeData();
      this.loadSearchResults();
      this.overrideAPIMethods()
    }
    initializeData() {
      this.searchTerm = this.dataset.searchTerm;
      this.objectType = this.dataset.objectType;
      this.section = this.dataset.section;
    }
    
    loadSearchResults(href = null, callback = null) {
      let url = '/search';
      if (href) {
        url = href;
      } else {
        if (!this.searchParams) {
          const params = this.objectType === 'product' ? new URLSearchParams(window.location.search) : new URLSearchParams();
          params.set('section_id', this.section);
          params.set('type', this.objectType);
          if (!params.has('q')) {
            params.set('q', this.searchTerm);
          }
          url += `?${params.toString()}`;
        } else {
          url += `?${this.searchParams.toString()}`;
        }
      }
      fetch(url).then((response) => response.text()).then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html');
        const section = html.querySelector(`#${this.section}`);
        if (section.querySelector('.sb-search-empty')) {
          this.remove()
        }
        this.innerHTML = section.innerHTML;
        this.overridePagination();
        if (callback) {
          callback();
        }
      });
    }
    overrideAPIMethods() {
      // Stubbing the history API to prevent issues on the main search
      const originalPushStae = history.pushState;
      const originalReplaceState = history.replaceState;
      history.pushState = (state) => {
        window.dispatchEvent(new CustomEvent('td:custom-search-filter', { detail: state }));
      }
      history.replaceState = () => {}
    }
    overridePagination() {
      const originalPagination = this.querySelectorAll('.pagination__item.link');
      originalPagination.forEach(item => {
        item.addEventListener('click', (event) => {
          event.preventDefault();
          const callback = () => {
            this.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          this.loadSearchResults(event.currentTarget.href + '&section_id=' + this.section, callback);
        });
      });
    }
  }
  customElements.define('section-sb-search-loader', SectionSbSearchLoader);

}

