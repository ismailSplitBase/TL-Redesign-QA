/**
 * TdMiniNewsletterForm - A web component for handling newsletter signup
 *
 * This component extends TdAjaxForm to provide specialized functionality for newsletter
 * signup forms, including success message display, dismissal, and local storage persistence.
 *
 * @class TdMiniNewsletterForm
 * @extends TdAjaxForm
 *
 * @example
 * <sb-mini-newsletter-form success-message="Thank you!" dismissable="true" timeout="3000">
 *   <form action="/contact#contact_form" method="post">
 *     <input type="email" name="contact[email]" required>
 *     <button type="submit">Submit</button>
 *   </form>
 * </sb-mini-newsletter-form>
 */

// Make sure TdAjaxForm is loaded before this component
if (!customElements.get('sb-mini-newsletter-form') && customElements.get('sb-ajax-form')) {
  class TdMiniNewsletterForm extends customElements.get('sb-ajax-form') {
    /**
     * Creates an instance of TdMiniNewsletterForm
     * Initializes additional component properties
     */
    constructor() {
      super();
      this.successMessage = this.getAttribute('success-message') || 'Thank you for subscribing!';
      this.dismissable = this.hasAttribute('dismissable');
      this.timeout = parseInt(this.getAttribute('timeout') || '3', 10) * 1000;
      this.storageKey = 'sb-mini-newsletter-dismissed';
      this.successMessageElement = null;
      this.closeButton = null;
      this.formElement = null;
    }

    /**
     * Called when the element is connected to the DOM
     * Initializes the component and sets up event listeners
     */
    connectedCallback() {
      //console.log('connectedCallback');
      // Call the parent class's connectedCallback first
      super.connectedCallback();

      // Check if previously dismissed
      if (this.dismissable && this.wasFormDismissed()) {
        this.style.display = 'none';
        return;
      }

      // Check if form was previously submitted successfully
      if (this.wasFormSubmitted()) {
        this.style.display = 'none';
        return;
      }

      this.cacheAdditionalElements();
      this.setupAdditionalEventListeners();
    }

    /**
     * Caches additional DOM elements specific to this component
     */
    cacheAdditionalElements() {
      this.closeButton = this.querySelector('.sb-mini-newsletter__close');
      this.successMessageElement = this.querySelector('.sb-mini-newsletter__success-message');
      this.formElement = this.querySelector('.sb-mini-newsletter__form');
    }

    /**
     * Sets up additional event listeners for this component
     */
    setupAdditionalEventListeners() {
      // Setup close button
      if (this.dismissable && this.closeButton) {
        this.closeButton.addEventListener('click', () => this.dismiss());
      }

      // Listen for form submission success from parent class
      this.addEventListener('sb-ajax-form:success', () => this.handleFormSuccess());
    }

    /**
     * Handles successful form submission
     */
    handleFormSuccess() {
      // Show success message
      if (this.successMessageElement && this.formElement) {
        this.formElement.style.display = 'none';
        this.successMessageElement.style.display = 'block';
      }

      // Store submission in localStorage
      localStorage.setItem('sb-mini-newsletter-submitted', 'true');

      // Fade out after timeout
      setTimeout(() => {
        this.classList.add('sb-mini-newsletter--fade-out');
        setTimeout(() => {
          this.style.display = 'none';
        }, 500); // Match transition duration in CSS
      }, this.timeout);
    }

    /**
     * Dismisses the newsletter form
     */
    dismiss() {
      this.classList.add('sb-mini-newsletter--fade-out');
      setTimeout(() => {
        this.style.display = 'none';
        localStorage.setItem(this.storageKey, 'true');
      }, 500); // Match transition duration in CSS
    }

    /**
     * Checks if the form was previously dismissed
     * @returns {boolean} True if the form was dismissed
     */
    wasFormDismissed() {
      return localStorage.getItem(this.storageKey) === 'true';
    }

    /**
     * Checks if the form was previously submitted successfully
     * @returns {boolean} True if the form was submitted
     */
    wasFormSubmitted() {
      return localStorage.getItem('sb-mini-newsletter-submitted') === 'true';
    }
  }

  // Register the custom element
  customElements.define('sb-mini-newsletter-form', TdMiniNewsletterForm);
}
