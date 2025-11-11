/**
 * @fileoverview Ingredient Cards WebComponent
 * @description WebComponent for displaying and interacting with ingredient cards
 */

class TdIngredientCards extends HTMLElement {
  constructor() {
    super();
    this.maxVisibleCards = 5;
    this.currentlyVisible = 0;
    this.hasInitialized = false;
    this.cards = null;
    this.loadMoreButton = null;
    this.modalId = null;
  }

  /**
   * Called when the element is connected to the DOM
   */
  connectedCallback() {
    if (this.hasInitialized) return;

    this.initializeInstanceVariables();
    this.cacheElements();
    this.setupEventListeners();

    this.hasInitialized = true;
  }

  /**
   * Initialize instance variables from attributes
   */
  initializeInstanceVariables() {
    if (this.hasAttribute('ingredients-to-show')) {
      this.maxVisibleCards = parseInt(this.getAttribute('ingredients-to-show'), 10);
    }
    if (this.hasAttribute('modal-id')) {
      this.modalId = this.getAttribute('modal-id');
    }

    // Set initial state
    this.currentlyVisible = this.maxVisibleCards;
  }

  /**
   * Cache DOM elements for improved performance
   */
  cacheElements() {
    this.cards = this.querySelectorAll('.sb-ingredient-card');

    // Find the load more button in the load-more slot
    this.loadMoreButton = this.querySelector('.sb-product-ingredients__more-button');
  }

  /**
   * Sets up event listeners
   */
  setupEventListeners() {
    // Card toggle listeners
    const toggleButtons = this.querySelectorAll('.sb-ingredient-card__toggle');
    toggleButtons.forEach((button) => {
      button.addEventListener('click', this.toggleCard.bind(this));
    });

    // Load more button listener
    if (this.loadMoreButton) {
      this.loadMoreButton.addEventListener('click', this.loadMoreIngredients.bind(this));
    }
  }

  /**
   * Handles toggling of a card's expanded state
   * @param {Event} event - The click event
   */
  toggleCard(event) {
    const card = event.currentTarget.closest('.sb-ingredient-card');
    document.dispatchEvent(
      new CustomEvent('sb-modal:open', {
        detail: {
          modalId: this.modalId,
        },
      })
    );
    document.dispatchEvent(
      new CustomEvent('slide-to-index', {
        detail: {
          index: parseInt(card.dataset.index, 10),
          speed: 300,
          sliderId: this.modalId,
        },
      })
    );
  }

  /**
   * Handles loading more ingredients when the load more button is clicked
   */
  loadMoreIngredients() {
    const hiddenCards = this.querySelectorAll('.sb-ingredient-card--hidden');

    // Show the next batch of cards (same number as initial visible cards)
    let cardsToShow = Math.min(this.maxVisibleCards, hiddenCards.length);
    let cardsShown = 0;

    hiddenCards.forEach((card, index) => {
      if (index < cardsToShow) {
        // Add animation class first
        card.classList.add('sb-ingredient-card--animating');

        // Remove hidden class to show the card
        card.classList.remove('sb-ingredient-card--hidden');

        // Stagger the animations slightly
        setTimeout(() => {
          card.classList.add('sb-ingredient-card--visible');
        }, index * 100);

        // Remove animation classes after animation completes
        setTimeout(() => {
          card.classList.remove('sb-ingredient-card--animating', 'sb-ingredient-card--visible');
        }, 1000 + index * 100);

        cardsShown++;
      }
    });

    this.currentlyVisible += cardsShown;

    // Hide the load more button if no more cards to show
    if (hiddenCards.length - cardsShown <= 0 && this.loadMoreButton) {
      this.loadMoreButton.style.display = 'none';
    }

    // Dispatch an event to notify that cards were loaded
    this.dispatchEvent(
      new CustomEvent('sb-ingredients:loaded', {
        bubbles: true,
        detail: { count: cardsShown, total: this.currentlyVisible },
      })
    );
  }
}

// Define the custom element if it's not already defined
if (!customElements.get('sb-ingredient-cards')) {
  customElements.define('sb-ingredient-cards', TdIngredientCards);
}
