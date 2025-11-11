/**
 * TdAjaxForm - A web component for handling AJAX form submissions
 *
 * This component intercepts form submissions, sends them via AJAX, and replaces
 * the component's content with the server response. It provides loading states,
 * error handling, and custom events for integration with other components.
 *
 * @class TdAjaxForm
 * @extends HTMLElement
 *
 * @example
 * <sb-ajax-form data-loading-class="custom-loading">
 *   <form action="/contact" method="post">
 *     <input type="text" name="name" required>
 *     <button type="submit">Submit</button>
 *   </form>
 * </sb-ajax-form>
 *
 * @fires TdAjaxForm#sb-ajax-form:success - Fired when form submission succeeds
 * @fires TdAjaxForm#sb-ajax-form:error - Fired when form submission fails
 * @fires TdAjaxForm#sb-ajax-form:reset - Fired when form state is reset
 */

// Ensure the element is not already defined
if (!customElements.get('sb-ajax-form')) {
  class TdAjaxForm extends HTMLElement {
    /**
     * Creates an instance of TdAjaxForm
     * Initializes component properties
     */
    constructor() {
      super();
      /** @type {HTMLFormElement|null} The form element within the component */
      this.form = null;
      /** @type {HTMLButtonElement|null} The submit button within the form */
      this.submitButton = null;
      /** @type {boolean} Whether the form is currently being submitted */
      this.isSubmitting = false;
    }

    /**
     * Called when the element is connected to the DOM
     * Initializes the component and sets up event listeners
     */
    connectedCallback() {
      this.initializeInstanceVariables();
      this.cacheElements();
      this.setupEventListeners();
    }

    /**
     * Initializes instance variables from data attributes
     * Sets default values for CSS classes used for different states
     *
     * @private
     */
    initializeInstanceVariables() {
      /** @type {string} CSS class applied during form submission */
      this.loadingClass = this.getAttribute('data-loading-class') || 'sb-ajax-form--loading';
      /** @type {string} CSS class applied after successful submission */
      this.successClass = this.getAttribute('data-success-class') || 'sb-ajax-form--success';
      /** @type {string} CSS class applied after failed submission */
      this.errorClass = this.getAttribute('data-error-class') || 'sb-ajax-form--error';
    }

    /**
     * Caches DOM elements for later use
     * Finds and stores references to the form and submit button
     *
     * @private
     */
    cacheElements() {
      this.form = this.querySelector('form');
      this.submitButton = this.form ? this.form.querySelector('[type="submit"]') : null;
    }

    /**
     * Sets up event listeners for form submission
     * Adds submit event listener to prevent default behavior and handle AJAX submission
     *
     * @private
     */
    setupEventListeners() {
      if (!this.form) {
        console.warn('sb-ajax-form: No form element found within the component');
        return;
      }

      this.form.addEventListener('submit', (event) => {
        this.handleFormSubmit(event);
      });
    }

    /**
     * Handles form submission via AJAX
     * Prevents default form submission, sends data via fetch, and updates component content
     *
     * @private
     * @param {Event} event - The form submit event
     * @throws {Error} When the HTTP request fails or returns an error status
     *
     * @fires TdAjaxForm#sb-ajax-form:success
     * @fires TdAjaxForm#sb-ajax-form:error
     */
    async handleFormSubmit(event) {
      event.preventDefault();

      if (this.isSubmitting) {
        return;
      }

      try {
        this.setLoadingState(true);

        const formData = new FormData(this.form);
        const actionUrl = this.form.getAttribute('action') || window.location.href;
        const method = this.form.getAttribute('method') || 'POST';

        const response = await fetch(actionUrl, {
          method: method.toUpperCase(),
          body: formData,
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseText = await response.text();

        // Replace the component contents with the response
        this.innerHTML = responseText;

        // Re-initialize after content replacement
        this.cacheElements();
        this.setupEventListeners();

        // Add success class
        this.classList.add(this.successClass);

        // Emit success event
        this.dispatchEvent(
          new CustomEvent('sb-ajax-form:success', {
            bubbles: true,
            detail: {
              response: responseText,
              form: this.form,
            },
          })
        );
      } catch (error) {
        console.error('Form submission error:', error);

        // Add error class
        this.classList.add(this.errorClass);

        // Emit error event
        this.dispatchEvent(
          new CustomEvent('sb-ajax-form:error', {
            bubbles: true,
            detail: {
              error: error.message,
              form: this.form,
            },
          })
        );

        // Remove loading state on error
        this.setLoadingState(false);
      }
    }

    /**
     * Sets the submit button's disabled state and applies visual styling
     *
     * @private
     * @param {boolean} isDisabled - Whether the button should be disabled
     */
    setSubmitButtonState(isDisabled) {
      if (!this.submitButton) return;

      this.submitButton.disabled = isDisabled;

      // Optionally add visual state classes to the button
      this.submitButton.classList.toggle('sb-ajax-form__button--disabled', isDisabled);
    }

    /**
     * Sets the loading state of the component
     * Manages the loading CSS class and submit button state
     *
     * @private
     * @param {boolean} isLoading - Whether the component is in loading state
     */
    setLoadingState(isLoading) {
      this.isSubmitting = isLoading;
      this.classList.toggle(this.loadingClass, isLoading);
      this.setSubmitButtonState(isLoading);
    }

    /**
     * Resets the form state to its initial condition
     * Removes all state classes and re-enables the submit button
     * Useful for external control or after handling success/error states
     *
     * @public
     * @fires TdAjaxForm#sb-ajax-form:reset
     */
    resetState() {
      this.classList.remove(this.loadingClass, this.successClass, this.errorClass);
      this.setLoadingState(false);

      // Emit reset event
      this.dispatchEvent(
        new CustomEvent('sb-ajax-form:reset', {
          bubbles: true,
          detail: {
            form: this.form,
          },
        })
      );
    }
  }

  // Register the custom element
  customElements.define('sb-ajax-form', TdAjaxForm);
}
