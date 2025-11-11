/**
 * TdAccordion - A web component for creating expandable accordion content
 *
 * This component manages a set of accordion items, allowing them to expand and collapse.
 * It supports single or multiple open items simultaneously and allows setting default open items.
 *
 * @class TdAccordion
 * @extends HTMLElement
 *
 * @example
 * <sb-accordion data-allow-multiple="true">
 *   <div class="sb-accordion__item" data-default-open>
 *     <button class="sb-accordion__trigger">Item 1</button>
 *     <div class="sb-accordion__content">Content for item 1</div>
 *   </div>
 *   <div class="sb-accordion__item">
 *     <button class="sb-accordion__trigger">Item 2</button>
 *     <div class="sb-accordion__content">Content for item 2</div>
 *   </div>
 * </sb-accordion>
 *
 * @fires TdAccordion#sb-accordion:opened - Fired when an accordion item is opened
 * @fires TdAccordion#sb-accordion:closed - Fired when an accordion item is closed
 */

// Ensure the element is not already defined
if (!customElements.get('sb-accordion')) {
  class TdAccordion extends HTMLElement {
    constructor() {
      super();
      this.allowMultiple = false;
      this.accordionItems = [];
      this.triggers = [];
      this.contents = [];
    }

    /**
     * Called when the element is connected to the DOM
     * Initializes the component and sets up event listeners
     */
    connectedCallback() {
      this.initializeInstanceVariables();
      this.cacheElements();
      this.setupEventListeners();
      this.setupResizeListener();
      this.setupDefaultOpenItems();
    }

    /**
     * Initializes instance variables from data attributes
     *
     * @private
     */
    initializeInstanceVariables() {
      this.allowMultiple =
        this.hasAttribute('data-allow-multiple') || this.getAttribute('data-allow-multiple') === 'true';

      // Define constant class names and attributes as properties
      this.expandedClass = 'sb-accordion__item--expanded';
      this.expandedAttribute = 'aria-expanded';
      this.defaultOpenAttribute = 'data-default-open';

      // Define selector constants
      this.itemSelector = '.sb-accordion__item';
      this.triggerSelector = '.sb-accordion__trigger';
      this.contentSelector = '.sb-accordion__content';
    }

    /**
     * Caches DOM elements for later use
     *
     * @private
     */
    cacheElements() {
      this.accordionItems = Array.from(this.querySelectorAll(this.itemSelector));
      this.triggers = Array.from(this.querySelectorAll(this.triggerSelector));
      this.contents = Array.from(this.querySelectorAll(this.contentSelector));
    }

    /**
     * Sets up event listeners for accordion triggers
     *
     * @private
     */
    setupEventListeners() {
      if (this.triggers.length === 0) {
        console.warn('sb-accordion: No trigger elements found');
        return;
      }

      this.triggers.forEach((trigger, index) => {
        if (trigger) {
          trigger.addEventListener('click', () => this.toggleItem(index));
        }
      });
    }

    /**
     * Sets up resize event listener to handle content height adjustments
     *
     * @private
     */
    setupResizeListener() {
      // Debounce resize events to improve performance
      let resizeTimeout;

      this.resizeHandler = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          this.handleResize();
        }, 150);
      };

      window.addEventListener('resize', this.resizeHandler);
    }

    /**
     * Handles window resize events by updating heights of expanded items
     *
     * @private
     */
    handleResize() {
      this.accordionItems.forEach((item, index) => {
        if (item.classList.contains(this.expandedClass)) {
          const content = this.contents[index];
          if (content) {
            // Temporarily remove the height constraint to get accurate scrollHeight
            content.style.maxHeight = 'none';
            // Set the new height based on current content size
            this.setContentHeight(content, true);
          }
        }
      });
    }

    /**
     * Sets up any items that should be open by default
     *
     * @private
     */
    setupDefaultOpenItems() {
      this.accordionItems.forEach((item, index) => {
        if (item.hasAttribute(this.defaultOpenAttribute)) {
          this.openItem(index);
        }
      });
    }

    /**
     * Sets the content height based on its expanded state
     *
     * @private
     * @param {HTMLElement} content - The content element
     * @param {boolean} isExpanded - Whether the content should be expanded
     */
    setContentHeight(content, isExpanded) {
      content.style.maxHeight = isExpanded ? `${content.scrollHeight}px` : '0';
    }

    /**
     * Toggles an accordion item open or closed
     *
     * @private
     * @param {number} index - The index of the item to toggle
     */
    toggleItem(index) {
      const item = this.accordionItems[index];
      const content = this.contents[index];

      if (!item || !content) {
        return;
      }

      const isExpanded = item.classList.contains(this.expandedClass);

      if (isExpanded) {
        this.closeItem(index);
      } else {
        if (!this.allowMultiple) {
          // Close all other items if we only allow one open at a time
          this.accordionItems.forEach((_, i) => {
            if (i !== index) {
              this.closeItem(i);
            }
          });
        }
        this.openItem(index);
      }
    }

    /**
     * Opens an accordion item
     *
     * @private
     * @param {number} index - The index of the item to open
     *
     * @fires TdAccordion#sb-accordion:opened
     */
    openItem(index) {
      const item = this.accordionItems[index];
      const trigger = this.triggers[index];
      const content = this.contents[index];

      if (!item || !trigger || !content) {
        return;
      }

      item.classList.add(this.expandedClass);
      trigger.setAttribute(this.expandedAttribute, 'true');
      this.setContentHeight(content, true);

      // Emit opened event
      this.dispatchEvent(
        new CustomEvent('sb-accordion:opened', {
          bubbles: true,
          detail: {
            index,
            item,
          },
        })
      );
    }

    /**
     * Closes an accordion item
     *
     * @private
     * @param {number} index - The index of the item to close
     *
     * @fires TdAccordion#sb-accordion:closed
     */
    closeItem(index) {
      const item = this.accordionItems[index];
      const trigger = this.triggers[index];
      const content = this.contents[index];

      if (!item || !trigger || !content) {
        return;
      }

      item.classList.remove(this.expandedClass);
      trigger.setAttribute(this.expandedAttribute, 'false');
      this.setContentHeight(content, false);

      // Emit closed event
      this.dispatchEvent(
        new CustomEvent('sb-accordion:closed', {
          bubbles: true,
          detail: {
            index,
            item,
          },
        })
      );
    }

    /**
     * Public method to programmatically open an accordion item
     *
     * @public
     * @param {number} index - The index of the item to open
     */
    open(index) {
      if (!this.allowMultiple) {
        // Close all other items first
        this.accordionItems.forEach((_, i) => {
          if (i !== index) {
            this.closeItem(i);
          }
        });
      }
      this.openItem(index);
    }

    /**
     * Public method to programmatically close an accordion item
     *
     * @public
     * @param {number} index - The index of the item to close
     */
    close(index) {
      this.closeItem(index);
    }

    /**
     * Public method to programmatically close all accordion items
     *
     * @public
     */
    closeAll() {
      this.accordionItems.forEach((_, index) => {
        this.closeItem(index);
      });
    }

    /**
     * Called when the element is disconnected from the DOM
     * Clean up event listeners
     */
    disconnectedCallback() {
      if (this.resizeHandler) {
        window.removeEventListener('resize', this.resizeHandler);
      }
    }
  }

  // Register the custom element
  customElements.define('sb-accordion', TdAccordion);
}
