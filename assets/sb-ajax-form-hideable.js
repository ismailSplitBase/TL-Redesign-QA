/**
 * TdAjaxFormHideable - A web component that extends TdAjaxForm with form hiding functionality
 *
 * This component adds the ability to hide the form when specific buttons are clicked.
 * It maintains all the AJAX form functionality of the parent class while adding
 * hide/show capabilities triggered by buttons with specific data attributes.
 *
 * @class TdAjaxFormHideable
 * @extends TdAjaxForm
 *
 * @example
 * <sb-ajax-form-hideable data-hide-class="sb-form--hidden">
 *   <form action="/contact" method="post">
 *     <input type="text" name="name" required>
 *     <button type="submit">Submit</button>
 *     <button type="button" data-hide-form>Cancel</button>
 *   </form>
 * </sb-ajax-form-hideable>
 *
 * @fires TdAjaxFormHideable#sb-ajax-form-hideable:hidden - Fired when form is hidden
 * @fires TdAjaxFormHideable#sb-ajax-form-hideable:shown - Fired when form is shown
 */

// Ensure the element is not already defined
if (!customElements.get('sb-ajax-form-hideable')) {
  class TdAjaxFormHideable extends TdAjaxForm {
    /**
     * Creates an instance of TdAjaxFormHideable
     * Calls parent constructor and initializes hide-specific properties
     */
    constructor() {
      super();
      /** @type {HTMLElement[]} Array of buttons that can hide the form */
      this.hideButtons = [];
      /** @type {boolean} Whether the form is currently hidden */
      this.isHidden = false;
    }

    /**
     * Called when the element is connected to the DOM
     * Calls parent connectedCallback and sets up additional functionality
     */
    connectedCallback() {
      super.connectedCallback();
      this.initializeHideVariables();
      this.cacheHideElements();
      this.setupHideEventListeners();
    }

    /**
     * Initializes instance variables specific to hiding functionality
     * Sets default values for CSS classes used for hiding states
     *
     * @private
     */
    initializeHideVariables() {
      /** @type {string} CSS class applied when form is hidden */
      this.hideClass = this.getAttribute('data-hide-class') || 'sb-form--hidden';
    }

    /**
     * Caches DOM elements for hide functionality
     * Finds and stores references to buttons that can hide the form
     *
     * @private
     */
    cacheHideElements() {
      this.hideButtons = Array.from(this.querySelectorAll('[data-hide-form]'));
    }

    /**
     * Sets up event listeners for hide buttons
     * Adds click event listeners to buttons with data-hide-form attribute
     *
     * @private
     */
    setupHideEventListeners() {
      this.hideButtons.forEach((button) => {
        if (button) {
          button.addEventListener('click', (event) => {
            this.handleHideButtonClick(event);
          });
        }
      });
    }

    /**
     * Handles hide button click events
     * Calls the hideForm method when a hide button is clicked
     *
     * @private
     * @param {Event} event - The button click event
     */
    handleHideButtonClick(event) {
      event.preventDefault();
      this.hideForm();
    }

    /**
     * Hides the form by applying the hide CSS class
     * Updates the internal state and emits a custom event
     *
     * @public
     * @fires TdAjaxFormHideable#sb-ajax-form-hideable:hidden
     */
    hideForm() {
      if (this.isHidden) {
        return;
      }

      this.classList.add(this.hideClass);
      this.isHidden = true;

      // Emit hidden event
      this.dispatchEvent(
        new CustomEvent('sb-ajax-form-hideable:hidden', {
          bubbles: true,
          detail: {
            form: this.form,
          },
        })
      );
    }

    /**
     * Shows the form by removing the hide CSS class
     * Updates the internal state and emits a custom event
     *
     * @public
     * @fires TdAjaxFormHideable#sb-ajax-form-hideable:shown
     */
    showForm() {
      if (!this.isHidden) {
        return;
      }

      this.classList.remove(this.hideClass);
      this.isHidden = false;

      // Emit shown event
      this.dispatchEvent(
        new CustomEvent('sb-ajax-form-hideable:shown', {
          bubbles: true,
          detail: {
            form: this.form,
          },
        })
      );
    }

    /**
     * Toggles the form visibility
     * Calls hideForm() or showForm() based on current state
     *
     * @public
     */
    toggleForm() {
      if (this.isHidden) {
        this.showForm();
      } else {
        this.hideForm();
      }
    }

    /**
     * Override parent resetState to also reset hide state
     * Ensures form is visible when state is reset
     *
     * @public
     * @fires TdAjaxForm#sb-ajax-form:reset
     */
    resetState() {
      super.resetState();
      this.showForm();
    }
  }

  // Register the custom element
  customElements.define('sb-ajax-form-hideable', TdAjaxFormHideable);
}
