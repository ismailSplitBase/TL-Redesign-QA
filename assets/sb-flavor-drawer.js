/**
 * TdFlavorDrawer Web Component
 * Handles slide-in drawer functionality for flavor variant selection
 * Content rendering is handled by Liquid templates
 *
 * @class TdFlavorDrawer
 * @extends HTMLElement
 */
// Ensure the element is not already defined
if (!customElements.get('sb-flavor-drawer')) {
  class TdFlavorDrawer extends HTMLElement {
    constructor() {
      super();
      this.isOpen = false;
      this.optionName = null;
      this.variantChangeUnsubscribe = null;
    }

    /**
     * Called when element is connected to DOM
     * Initializes component and sets up event listeners
     */
    connectedCallback() {
      this.optionName = this.getAttribute('data-option-name');
      this.setupEventListeners();
      this.moveToBody();
      this.setupTriggerListeners();
      this.subscribeToVariantChange();
      this.setupDefault()
      
    }

    setupDefault() {
      const selected = this.querySelector('.sb-flavor-option--selected')
      if (selected) {
        this.updateHiddenSelect(selected.dataset.value)
      }
    }

    /**
     * Called when element is disconnected from DOM
     * Cleans up event listeners
     */
    disconnectedCallback() {
      this.removeEventListeners();
      if (this.variantChangeUnsubscribe) {
        this.variantChangeUnsubscribe();
      }
    }

    /**
     * Subscribe to variant change events
     * @private
     */
    subscribeToVariantChange() {
      if (typeof subscribe !== 'undefined') {
        this.variantChangeUnsubscribe = subscribe(PUB_SUB_EVENTS.variantChange, () => {
          this.handleVariantChange();
        });
      }
    }

    /**
     * Handle variant change event by resetting up event listeners
     * @private
     */
    handleVariantChange() {
      // Re-setup trigger listeners as variants may have changed the DOM
      this.setupTriggerListeners();
    }

    /**
     * Move drawer to body to avoid positioning issues
     * @private
     */
    moveToBody() {
      if (this.parentElement !== document.body) {
        document.body.appendChild(this);
      }
    }

    /**
     * Set up event listeners for drawer controls
     * @private
     */
    setupEventListeners() {
      // Close button
      const closeBtn = this.querySelector('[data-flavor-close]');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.close());
      }

      // Overlay click
      const overlay = this.querySelector('[data-flavor-overlay]');
      if (overlay) {
        overlay.addEventListener('click', () => this.close());
      }

      // Option buttons
      const options = this.querySelectorAll('[data-flavor-option]');
      options.forEach((option) => {
        option.addEventListener('click', (e) => {
          const value = e.currentTarget.getAttribute('data-value');
          this.selectValue(value);
        });
      });

      // Keyboard navigation
      this.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    /**
     * Set up listeners for trigger buttons
     * @private
     */
    setupTriggerListeners() {
      const triggers = document.querySelectorAll(`[data-flavor-trigger="${this.optionName}"]`);
      triggers.forEach((trigger) => {
        trigger.addEventListener('click', () => {
          this.open();
        });
      });

      this.addEventListener('sb-flavor-drawer:refreshed', () => {
        this.setupEventListeners();
      });
    }

    /**
     * Remove event listeners
     * @private
     */
    removeEventListeners() {
      // Event listeners are automatically removed when element is removed from DOM
    }

    /**
     * Handle keyboard navigation
     * @private
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyDown(e) {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    }

    /**
     * Open the drawer
     * @public
     */
    open() {
      this.isOpen = true;
      this.classList.add('sb-flavor-drawer--open');
      document.body.classList.add('sb-flavor-drawer-open');

      // Focus management
      const firstOption = this.querySelector('[data-flavor-option]:not([disabled])');
      if (firstOption) {
        firstOption.focus();
      }

      // Dispatch custom event
      this.dispatchEvent(
        new CustomEvent('sb-flavor-drawer:opened', {
          bubbles: true,
          detail: { optionName: this.optionName },
        })
      );
    }

    /**
     * Close the drawer
     * @public
     */
    close() {
      this.isOpen = false;
      this.classList.remove('sb-flavor-drawer--open');
      document.body.classList.remove('sb-flavor-drawer-open');

      // Dispatch custom event
      this.dispatchEvent(
        new CustomEvent('sb-flavor-drawer:closed', {
          bubbles: true,
          detail: { optionName: this.optionName },
        })
      );
    }

    /**
     * Select a value and close drawer
     * @public
     * @param {string} value - The selected value
     */
    selectValue(value) {
      // Update visual state for options in the drawer
      const options = this.querySelectorAll('[data-flavor-option]');
      options.forEach((option) => {
        option.classList.remove('sb-flavor-option--selected');
        if (option.getAttribute('data-value') === value) {
          option.classList.add('sb-flavor-option--selected');
        }
      });

      // Update the trigger display
      this.updateTriggerDisplay(value);

      // Update hidden select for form submission
      this.updateHiddenSelect(value);

      // Dispatch selection event
      this.dispatchEvent(
        new CustomEvent('sb-flavor-drawer:selected', {
          bubbles: true,
          detail: {
            optionName: this.optionName,
            selectedValue: value,
          },
        })
      );

      this.close();
    }

    /**
     * Update the trigger button display
     * @private
     * @param {string} value - The selected value
     */
    updateTriggerDisplay(value) {
      const triggers = document.querySelectorAll(`[data-flavor-trigger="${this.optionName}"]`);
      triggers.forEach((trigger) => {
        const textElement = trigger.querySelector('.sb-flavor-selected__text');
        if (textElement) {
          textElement.textContent = value;
        }

        // Update swatch if available - get from the selected option in drawer
        const selectedOption = this.querySelector(`[data-flavor-option][data-value="${value}"]`);
        if (selectedOption) {
          const optionSwatch = selectedOption.querySelector('.sb-flavor-option__swatch');
          const triggerSwatch = trigger.querySelector('.sb-flavor-swatch');
          if (optionSwatch && triggerSwatch) {
            triggerSwatch.innerHTML = optionSwatch.innerHTML;
          }
        }

        trigger.setAttribute('data-selected-value', value);
      });
    }

    /**
     * Update hidden select for form submission
     * @private
     * @param {string} value - The selected value
     */
    updateHiddenSelect(value) {
      const hiddenSelect = document.querySelector(`.sb-flavor-hidden-select[name="options[${this.optionName}]"]`);
      if (!hiddenSelect) return;

      // Step 1: Remove all selected flags
      Array.from(hiddenSelect.options).forEach((option) => {
        option.selected = false;
        option.removeAttribute('selected');
      });

      // Step 2: Apply the correct one in a microtask (Safari-safe)
      requestAnimationFrame(() => {
        const selectedOption = Array.from(hiddenSelect.options).find((opt) => opt.value === value);
        if (selectedOption) {
          selectedOption.selected = true;
          selectedOption.setAttribute('selected', 'selected');
        }
        hiddenSelect.value = value;

        // Step 3: Force Shopify event updates
        hiddenSelect.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
  }

  // Register the custom element
  customElements.define('sb-flavor-drawer', TdFlavorDrawer);
}
