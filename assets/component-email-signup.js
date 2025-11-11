/**
 * Custom element for the email signup form, handles custom form submission and validation.
 *
 * @typedef {object} Refs
 * @property {HTMLFormElement} form
 * @property {HTMLInputElement} emailInput
 * @property {HTMLInputElement} nameInput
 * @property {HTMLElement} nameError
 * @property {HTMLElement} nameErrorText
 * @property {HTMLElement} emailError
 * @property {HTMLElement} emailErrorText
 *
 * @extends {HTMLElement}
 */

class EmailSignupForm extends HTMLElement {
  constructor() {
    super();
    this.init();
  }

  /**
   * Initializes the form and email input
   */
  init() {
    this.form = this.querySelector('form');
    this.emailInput = this.querySelector('input[type="email"]');
    this.nameInput = this.querySelector('input[name="contact[name]"]');
    this.nameError = this.querySelector('#Email-signup__message-name-error-' + this.getSectionId());
    this.nameErrorText = this.nameError?.querySelector('.sb-footer__newsletter-form__message-text');
    this.emailError = this.querySelector('#Email-signup__message-email-error-' + this.getSectionId());
    this.emailErrorText = this.emailError?.querySelector('.sb-footer__newsletter-form__message-text');

    if (!this.form || !this.emailInput) {
      return;
    }

    this.attachEventListeners();
  }

  /**
   * Gets the section ID from the form's parent section
   * @returns {string} - The section ID
   */
  getSectionId() {
    const section = this.closest('[id^="shopify-section-"]');
    return section ? section.id.replace('shopify-section-', '') : '';
  }

  /**
   * Attaches event listeners to the form and email input
   */
  attachEventListeners() {
    this.form?.addEventListener('submit', this.handleSubmit.bind(this));
    this.emailInput?.addEventListener('input', this.clearError.bind(this));
    this.nameInput?.addEventListener('input', this.clearError.bind(this));
  }

  /**
   * Handles form submission and validates both name and email inputs
   * @param {Event} e - The form submit event
   */
  handleSubmit(e) {
    const emailValue = /** @type {HTMLInputElement} */ (this.emailInput)?.value;
    const nameValue = /** @type {HTMLInputElement} */ (this.nameInput)?.value;

    let hasErrors = false;

    // Clear previous errors
    this.clearAllErrors();

    // Validate name field
    if (this.nameInput && !this.isValidName(nameValue)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      this.showNameError('Name Missing');
      hasErrors = true;
    }

    // Validate email
    if (!this.isValidEmail(emailValue)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      this.showEmailError('Email address not valid.');
      hasErrors = true;
    }
  }

  /**
   * Validates email address using a comprehensive regex pattern
   * @param {string} email - The email address to validate
   * @returns {boolean} - True if email is valid, false otherwise
   */
  isValidEmail(email) {
    if (!email || typeof email !== 'string') {
      return false;
    }
    const emailRegex =
      /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;

    return emailRegex.test(email.trim());
  }

  /**
   * Validates name field - checks if it's not empty and has reasonable length
   * @param {string} name - The name to validate
   * @returns {boolean} - True if name is valid, false otherwise
   */
  isValidName(name) {
    if (!name || typeof name !== 'string') {
      return false;
    }
    const trimmedName = name.trim();
    return trimmedName.length >= 2 && trimmedName.length <= 100;
  }

  /**
   * Shows name error message to the user
   * @param {string} message - The error message to display
   */
  showNameError(message) {
    if (this.nameErrorText) this.nameErrorText.textContent = message;
    if (this.nameError) this.nameError.classList.remove('email-signup-message--hidden');
    if (this.nameInput) this.nameInput.classList.add('sb-footer__input--error');
  }

  /**
   * Shows email error message to the user
   * @param {string} message - The error message to display
   */
  showEmailError(message) {
    if (this.emailErrorText) this.emailErrorText.textContent = message;
    if (this.emailError) this.emailError.classList.remove('email-signup-message--hidden');
    if (this.emailInput) this.emailInput.classList.add('sb-footer__input--error');
  }

  /**
   * Clears all error messages and input error states
   */
  clearAllErrors() {
    if (this.nameError) this.nameError.classList.add('email-signup-message--hidden');
    if (this.emailError) this.emailError.classList.add('email-signup-message--hidden');
    if (this.nameInput) this.nameInput.classList.remove('sb-footer__input--error');
    if (this.emailInput) this.emailInput.classList.remove('sb-footer__input--error');
  }

  /**
   * Clears error messages when user starts typing
   */
  clearError() {
    this.clearAllErrors();
  }
}

customElements.define('email-signup-form', EmailSignupForm);
