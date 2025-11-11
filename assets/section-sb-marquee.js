if (!customElements.get('sb-marquee')) {
  class TDMarquee extends HTMLElement {
    constructor() {
      super();
      // Count all track elements that may have been pre-rendered by Liquid
      const TRACK_ELEMENTS = this.querySelectorAll('.sb-track');
      this.trackCount = TRACK_ELEMENTS.length || 1; // Default to 1 if none found

      // The number 10 is arbitrary
      // This component can stutter during the animation reset
      // A large size reduces stutters and delays the first until a low importance time
      this.SIZE_MULTIPLIER = 10;

      // Use the first track as the reference for cloning
      this.TRACK = TRACK_ELEMENTS[0];

      // Calculate the total width of all existing tracks
      this.trackWidth = 0;
      if (this.TRACK) {
        const SINGLE_TRACK_WIDTH = this.TRACK.offsetWidth;
        // Sum up the width of all existing tracks
        this.trackWidth = SINGLE_TRACK_WIDTH * this.trackCount;
      }
    }

    connectedCallback() {
      this.duplicateTrackIfNeeded();
      window.addEventListener(
        'resize',
        this.debounce(() => this.handleResize(), 100)
      );
    }

    duplicateTrackIfNeeded() {
      // This check prevents infinite duplication
      if (!this.TRACK || this.trackWidth === 0) {
        console.warn('TDMarquee: Track width is zero or track element not found. Cannot duplicate track.');
        return;
      }

      const originalTrackWidth = this.TRACK.offsetWidth;

      while (this.trackWidth < window.innerWidth * this.SIZE_MULTIPLIER) {
        const newTrack = this.TRACK.cloneNode(true);
        newTrack.setAttribute('aria-hidden', 'true');
        this.TRACK.parentNode.appendChild(newTrack);
        this.trackWidth += originalTrackWidth;
        this.trackCount++;
      }

      this.style.setProperty('--track-count', this.trackCount);
    }

    handleResize() {
      if (window.innerWidth >= 767) {
        this.duplicateTrackIfNeeded();
      }
    }

    debounce(func, delay) {
      let timeoutId;
      return function () {
        const context = this;
        const args = arguments;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(context, args);
        }, delay);
      };
    }
  }

  customElements.define('sb-marquee', TDMarquee);
}
