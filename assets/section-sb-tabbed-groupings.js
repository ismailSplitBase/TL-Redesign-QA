if (!customElements.get('sb-tabbed-grouping')) {
  class SbTabbedGrouping extends HTMLElement {
    constructor() {
      super();
      this.TAB_SELECTORS = this.querySelectorAll('[data-tab-selector]');
      this.TABS = this.querySelectorAll('[data-tab-content]');
      this.VIEW_ALL_SELECTOR = this.querySelector('[data-view-all]');
    }
    connectedCallback() {
      if (this.TABS.length && this.TAB_SELECTORS.length) {
        this.TAB_SELECTORS.forEach((tab) => {
          tab.addEventListener('click', this.handleClick.bind(this, tab));
        });
      }
    }
    handleClick(tab) {
      if (tab.dataset.tabActive == 'false') {
        this.TAB_SELECTORS.forEach((t) => {
          t.setAttribute('data-tab-active', t.dataset.itemId === tab.dataset.itemId ? 'true' : 'false');
        });
        this.TABS.forEach((t) => {
          t.setAttribute('data-tab-active', t.dataset.itemId === tab.dataset.itemId ? 'true' : 'false');
        });
        if (this.VIEW_ALL_SELECTOR) {
          this.VIEW_ALL_SELECTOR.setAttribute('href', tab.dataset.url);
        }
      }
    }
  }
  customElements.define('sb-tabbed-grouping', SbTabbedGrouping);
}
