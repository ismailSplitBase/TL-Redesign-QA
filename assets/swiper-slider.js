if (!customElements.get('swiper-slider')) {
  class SwiperSlider extends HTMLElement {
    constructor() {
      super();
      this.slideContainer = this.querySelector('[data-swiper]:not([data-swiper-thumbs])');
      this.slides = this.querySelectorAll('[data-swiper-slide]');
      this.sliderOptions = this.applyDefaultOptions(this.getSliderOptions());
      this.activeIndex = 0;
      this.initialized = false;
      this.resizeBound = false;
      if (this.dataset.swiperThumbs) {
        this.thumbnails = this.querySelector('[data-swiper-thumbs]');
      }
      this.boundInitializeSwiper = this.initializeSwiper.bind(this);
      this.boundSlideToIndex = this.slideToIndex.bind(this);
    }

    connectedCallback() {
      if (this.dataset.customEvent) {
        this.attachCustomListeners(this.dataset.customEvent);
      }
      if (this.slideContainer && this.slides.length > 0) {
        this.initializeSwiper();
      } else {
        console.warn('SwiperSlider - Slider or Slides Not Found');
      }
    }

    attachCustomListeners(customEvent) {
      switch (customEvent) {
        case 'reinitialize':
          this.addEventListener('reinitialize-swiper', this.boundInitializeSwiper);
          break;
        case 'slide-to-index':
          document.addEventListener('slide-to-index', this.boundSlideToIndex);
          break;
      }
    }

    disconnectedCallback() {
      window.removeEventListener('resize', this.handleResize);
      if (this.dataset.customEvent) {
        switch (this.dataset.customEvent) {
          case 'reinitialize':
            this.removeEventListener('reinitialize-swiper', this.boundInitializeSwiper);
            break;
          case 'slide-to-index':
            document.removeEventListener('slide-to-index', this.boundSlideToIndex);
            break;
        }
      }
    }

    applyDefaultOptions(options) {
      if (options.loop === undefined) {
        options.loop = true;
      }
      if (options.speed === undefined) {
        options.speed = 400;
      }
      return options;
    }

    getSliderOptions() {
      try {
        return JSON.parse(this.dataset.swiperOptions);
      } catch (err) {
        //console.log(err);
        return {};
      }
    }

    initializeSwiper() {
      if (window.Swiper && !this.initialized) {
        this.initialized = true;
        if (this.thumbnails) {
          this.setThumbnails();
        }
        if (this.dataset.hasOwnProperty('fractionPagination')) {
          this.sliderOptions.on = {
            slideChange: this.updateFractions.bind(this),
            reachEnd: this.updateFractions.bind(this, 'reachEnd'),
          };
        }
        this.slider = new Swiper(this.slideContainer, this.sliderOptions);
        this.initializeSliderEventListeners();
        if (this.dataset.hasOwnProperty('fractionPagination')) {
          this.updateFractions();
        }
      } else if (!window.Swiper) {
        console.warn('SwiperSlider - Swiper.js not found');
      }
      this.bindResizeEvent();
    }

    bindResizeEvent() {
      if (!this.resizeBound) {
        window.addEventListener('resize', this.handleResize.bind(this));
        window.addEventListener('resize', this.updateFractions.bind(this));
        this.resizeBound = true;
      }
    }

    handleResize(e) {
      if (this.slider) {
        setTimeout(() => {
          this.slider.updateSize();
        }, 300);
      }
    }
    updateFractions(e, evt) {
      const currentContainer = this.parentElement?.querySelector('.sb-swiper-pagination-current');
      const totalContainer = this.parentElement?.querySelector('.sb-swiper-pagination-total');
      if (currentContainer && totalContainer && this.slider) {
        setTimeout(() => {
          const activeIndex = this.slider.pagination.bullets.findIndex((bullet) =>
            bullet.classList.contains('swiper-pagination-bullet-active')
          );
          currentContainer.innerHTML = `${activeIndex + 1}`.padStart(2, '0');
          totalContainer.innerHTML = `${this.slider.pagination.bullets.length}`.padStart(2, '0');
        }, 100);
      }
    }

    setThumbnails() {
      const thumbsSlideContainer = this.thumbnails;
      const thumbOptions = JSON.parse(this.thumbnails.dataset.swiperOptions);
      const thumbnailsSlider = new Swiper(thumbsSlideContainer, thumbOptions);
      this.sliderOptions.thumbs = { swiper: thumbnailsSlider };
      this.sliderOptions.on = {
        slideChange: function () {
          let activeIndex = this.activeIndex;
          document.dispatchEvent(
            new CustomEvent('thumbnail-changed', {
              detail: {
                slide: this.slides[this.activeIndex],
              },
            })
          );
          this.thumbs.swiper.slideTo(activeIndex > 0 ? activeIndex - 1 : 0);
        },
      };
    }

    initializeSliderEventListeners() {}

    /**
     * Slides to a specific index when receiving a document event
     * @param {CustomEvent} event - The custom event containing slide index details
     */
    slideToIndex(event) {
      if (!this.slider || !this.initialized) {
        console.warn('SwiperSlider - Slider not initialized');
        return;
      }

      const { index, speed, sliderId } = event.detail || {};

      // If sliderId is specified, only respond to events meant for this slider
      if (sliderId && this.dataset.sliderId !== sliderId) {
        return;
      }

      if (typeof index === 'number' && index >= 0 && index <= this.slides.length) {
        let slidesIndex = undefined;
        for (let i = 0; i < this.slider.slides.length; i++) {
          if (parseInt(this.slider.slides[i].dataset.actualSlideIndex) === index) {
            slidesIndex = i;
          }
        }
        const slideSpeed = speed !== undefined ? speed : this.sliderOptions.speed;
        this.slider.slideTo(slidesIndex || index, slideSpeed);
      } else {
        console.warn('SwiperSlider - Invalid slide index:', index);
      }
    }
  }
  customElements.define('swiper-slider', SwiperSlider);
}
