if (!customElements.get('sb-modal-youtube')) {
  class TDModalYoutube extends HTMLElement {
    constructor() {
      super();
      this.modalId = null;
      this.videoId = null;
      this.player = null;
      this.playerContainer = null;
    }

    connectedCallback() {
      this.maybeSetupScript();
      this.initializeInstanceVariables();
      this.setupEventListeners();
    }

    maybeSetupScript() {
      if (!document.querySelector('script[src*="https://www.youtube.com/iframe_api"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      }
    }
    /**
     * Initializes instance variables from data attributes
     */
    initializeInstanceVariables() {
      this.modalId = this.getAttribute('data-modal-id');
      this.videoId = this.getAttribute('data-video-id');
      this.playerContainer = this.querySelector('[data-player-container]');
    }

    /**
     * Sets up event listeners for modal events
     */
    setupEventListeners() {
      if (!this.videoId || !this.modalId) {
        return;
      }

      // Listen for modal opened events
      document.addEventListener('sb-modal:opened', (event) => {
        if (event.detail.modalId === this.modalId) {
          this.handleModalOpened(event);
        }
      });

      // Listen for modal closed events
      document.addEventListener('sb-modal:closed', (event) => {
        if (event.detail.modalId === this.modalId) {
          this.handleModalClosed(event);
        }
      });
    }

    /**
     * Handles modal closed event
     * @param {CustomEvent} event - The modal closed event
     */
    handleModalClosed(event) {
      // Hook for sb-modal:closed event
      // Add your custom logic here
      console.log('Modal closed:', event.detail);
      if (this.player) {
        this.player.destroy();
      }
    }

    handleModalOpened(event) {
      console.log('Modal opened:', event.detail);
      try {
        this.player = new YT.Player(this.playerContainer, {
          videoId: this.videoId,
          playerVars: {
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: this.onPlayerReady.bind(this),
            onError: this.handlePlayerError.bind(this),
          },
        });
      } catch (e) {
        console.error('Error creating YouTube player:', e);
        this.handlePlayerError();
      }
    }

    onPlayerReady(event) {
      console.log('Player ready:', event.target);
      this.setAttribute('data-loading', 'false');
      event.target.playVideo();
    }

    handlePlayerError(event) {
      if (event) {
        console.error('Player error:', event.data);
      }
      this.setAttribute('data-loading', 'false');
      this.setAttribute('data-is-error', 'true');
    }
  }

  customElements.define('sb-modal-youtube', TDModalYoutube);
}
