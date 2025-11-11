// Ensure the element is not already defined
if (!customElements.get('sb-modal')) {
  class TdModal extends HTMLElement {
    constructor() {
      super();
      this.isOpen = false;
      this.closeButtons = null;
      this.overlay = null;
      this.dialog = null;
      this.headingElement = null;
      this.bodyElement = null;
    }

    connectedCallback() {
      this.initializeInstanceVariables();
      this.cacheElements();
      this.setupEventListeners();
    }

    initializeInstanceVariables() {
      this.modalId = this.getAttribute('data-modal-id') || `modal-${Math.random().toString(36).substr(2, 9)}`;
      this.heading = this.getAttribute('data-heading') || '';
    }

    cacheElements() {
      // Cache important elements from the existing DOM structure
      this.overlay = this.querySelector('[data-modal-overlay]') || this.querySelector('.sb-modal__overlay');
      this.dialog = this.querySelector('.sb-modal__dialog');
      this.closeButtons = this.querySelectorAll('[data-modal-close]') || this.querySelectorAll('.sb-modal__close');
      this.headingElement = this.querySelector('.sb-modal__title');
      this.bodyElement = this.querySelector('.sb-modal__body');
    }

    setupEventListeners() {
      // Setup click handlers only if elements are present
      if (this.closeButtons) {
        this.closeButtons.forEach((button) => {
          button.addEventListener('click', () => this.closeModal());
        });
      }

      if (this.overlay) {
        this.overlay.addEventListener('click', (event) => {
          // Note need to account for the case when this is in the body but no int actual content
          if (event.target === this.overlay) {
            this.closeModal();
          }
        });
      }

      // Listen for modal open events
      document.addEventListener('sb-modal:open', (event) => {
        if (event.detail.modalId === this.modalId) {
          this.openModal();
        }
      });

      // Listen for modal update events
      document.addEventListener('sb-modal:update', (event) => {
        if (event.detail.modalId === this.modalId) {
          this.updateContent(event.detail);
        }
      });

      // Close modal on escape key
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && this.isOpen) {
          this.closeModal();
        }
      });

      // Prevent body scroll when modal is open
      this.addEventListener('sb-modal:opened', () => {
        document.body.classList.add('sb-modal-open');
        document.body.style.overflow = 'hidden';
      });

      this.addEventListener('sb-modal:closed', () => {
        document.body.classList.remove('sb-modal-open');
        document.body.style.overflow = '';
      });
    }

    openModal() {
      if (!this.overlay || !this.dialog) {
        console.warn('Modal elements not found. Make sure the HTML structure is present.');
        return;
      }

      this.isOpen = true;
      this.overlay.classList.add('sb-modal__overlay--active');
      this.dialog.classList.add('sb-modal__dialog--active');

      // Focus the modal for accessibility
      this.dialog.focus();

      // Emit opened event
      this.dispatchEvent(
        new CustomEvent('sb-modal:opened', {
          bubbles: true,
          detail: { modalId: this.modalId },
        })
      );
    }

    closeModal() {
      this.isOpen = false;
      this.overlay?.classList.remove('sb-modal__overlay--active');
      this.dialog?.classList.remove('sb-modal__dialog--active');
      // Pause or stop any video or iframe inside the modal
      if (this.bodyElement) {
        // Pause <video> tags
        const videos = this.bodyElement.querySelectorAll('video');
        videos.forEach((video) => {
          if (!video.paused) {
            video.pause();
          }
        });
        // Stop YouTube iframes by resetting src
        const iframes = this.bodyElement.querySelectorAll('iframe');
        iframes.forEach((iframe) => {
          // Only reset if it's a YouTube or Vimeo embed
          const src = iframe.getAttribute('src');
          if (src && (src.includes('youtube.com') || src.includes('vimeo.com'))) {
            iframe.setAttribute('src', src);
          }
        });
      }
      // Emit closed event
      this.dispatchEvent(
        new CustomEvent('sb-modal:closed', {
          bubbles: true,
          detail: { modalId: this.modalId },
        })
      );
    }

    updateContent(data) {
      if (data.heading !== undefined) {
        if (data.heading && !this.headingElement) {
          // Add heading if it doesn't exist
          const headerElement = this.querySelector('.sb-modal__header');
          if (headerElement) {
            const titleElement = document.createElement('h2');
            titleElement.className = 'sb-modal__title';
            titleElement.id = `modal-title-${this.modalId}`;
            titleElement.textContent = data.heading;

            // Insert before first close button
            const closeButton = headerElement.querySelector('[data-modal-close]');
            headerElement.insertBefore(titleElement, closeButton);
            this.headingElement = titleElement;
          }
        } else if (data.heading && this.headingElement) {
          // Update existing heading
          this.headingElement.textContent = data.heading;
        } else if (!data.heading && this.headingElement) {
          // Remove heading
          this.headingElement.remove();
          this.headingElement = null;
        }
      }

      if (data.children !== undefined && this.bodyElement) {
        this.bodyElement.innerHTML = data.children;
      }
      this.cacheElements();
      this.setupEventListeners();
      // Emit updated event
      this.dispatchEvent(
        new CustomEvent('sb-modal:updated', {
          bubbles: true,
          detail: { modalId: this.modalId, ...data },
        })
      );
    }
  }

  // Register the custom element
  customElements.define('sb-modal', TdModal);
}
