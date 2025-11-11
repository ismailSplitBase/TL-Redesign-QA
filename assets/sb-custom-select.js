/**
 * TdCustomSelect - A web component for enhancing native select elements
 *
 * This component progressively enhances a native select element with custom styling
 * and behavior while maintaining accessibility and fallback functionality.
 * If JavaScript is disabled, the native select remains fully functional.
 *
 * @class TdCustomSelect
 * @extends HTMLElement
 *
 * @example
 * <sb-custom-select>
 *   <select name="subject" required>
 *     <option value="">Subject*</option>
 *     <option value="general">General inquiry</option>
 *     <option value="support">Support</option>
 *     <option value="sales">Sales</option>
 *   </select>
 * </sb-custom-select>
 *
 * @fires TdCustomSelect#sb-custom-select:change - Fired when the selection changes
 * @fires TdCustomSelect#sb-custom-select:open - Fired when the dropdown opens
 * @fires TdCustomSelect#sb-custom-select:close - Fired when the dropdown closes
 */

// Ensure the element is not already defined
if (!customElements.get('sb-custom-select')) {
  class TdCustomSelect extends HTMLElement {
    constructor() {
      super();
      this.isOpen = false;
      this.selectedIndex = 0;
      this.options = [];
      this.focusedIndex = -1;

      // DOM element references
      this.nativeSelect = null;
      this.selectWrapper = null;
      this.selectTrigger = null;
      this.selectDisplay = null;
      this.selectIcon = null;
      this.optionsList = null;
    }

    /**
     * Called when the element is connected to the DOM
     * Initializes the component and sets up event listeners
     */
    connectedCallback() {
      this.findNativeSelect();
      if (this.nativeSelect) {
        this.initializeInstanceVariables();
        this.createSelectStructure();
        this.cacheElements();
        this.setupEventListeners();
        this.setupAccessibility();
      }
    }

    /**
     * Finds and validates the native select element
     *
     * @private
     */
    findNativeSelect() {
      this.nativeSelect = this.querySelector('select');

      if (!this.nativeSelect) {
        console.warn('sb-custom-select: No native select element found. Component will not initialize.');
        return;
      }

      // Ensure the native select has the required attributes for accessibility
      if (!this.nativeSelect.hasAttribute('name')) {
        console.warn('sb-custom-select: Native select should have a name attribute for form submission.');
      }
    }

    /**
     * Initializes instance variables from the native select element
     *
     * @private
     */
    initializeInstanceVariables() {
      // Get properties from the native select
      this.name = this.nativeSelect.name || 'custom-select';
      this.required = this.nativeSelect.required;
      this.disabled = this.nativeSelect.disabled;

      // Extract options from the native select
      const optionElements = this.nativeSelect.querySelectorAll('option');
      this.options = Array.from(optionElements).map((option, index) => ({
        value: option.value,
        text: option.textContent.trim(),
        disabled: option.disabled,
        selected: option.selected,
        index,
      }));

      // Set initial selected option
      this.selectedIndex = this.nativeSelect.selectedIndex;

      // Get placeholder from first empty option or data attribute
      const firstOption = this.options[0];
      this.placeholder = firstOption && firstOption.value === '' ? firstOption.text : 'Select an option';

      // Define selector constants
      this.wrapperClass = 'sb-custom-select';
      this.triggerClass = 'sb-custom-select__trigger';
      this.displayClass = 'sb-custom-select__display';
      this.iconClass = 'sb-custom-select__icon';
      this.optionsClass = 'sb-custom-select__options';
      this.optionClass = 'sb-custom-select__option';
      this.openClass = 'sb-custom-select--open';
      this.selectedClass = 'sb-custom-select__option--selected';
      this.focusedClass = 'sb-custom-select__option--focused';
      this.disabledClass = 'sb-custom-select--disabled';
    }

    /**
     * Creates the HTML structure for the custom select
     *
     * @private
     */
    createSelectStructure() {
      // Hide the native select but keep it functional
      this.nativeSelect.style.position = 'absolute';
      this.nativeSelect.style.left = '-9999px';
      this.nativeSelect.style.opacity = '0';
      this.nativeSelect.style.pointerEvents = 'none';

      // Create main wrapper
      this.selectWrapper = document.createElement('div');
      this.selectWrapper.className = `${this.wrapperClass}`;
      if (this.disabled) {
        this.selectWrapper.classList.add(this.disabledClass);
      }

      // Create trigger button
      this.selectTrigger = document.createElement('button');
      this.selectTrigger.type = 'button';
      this.selectTrigger.className = this.triggerClass;

      // Create display text
      this.selectDisplay = document.createElement('span');
      this.selectDisplay.className = this.displayClass;
      this.updateDisplayText();

      // Create dropdown icon
      this.selectIcon = document.createElement('span');
      this.selectIcon.className = this.iconClass;
      this.selectIcon.innerHTML = this.getDropdownIcon();

      // Create options list
      this.optionsList = document.createElement('ul');
      this.optionsList.className = this.optionsClass;
      this.optionsList.setAttribute('role', 'listbox');

      // Create inner wrapper for scrollable content
      this.optionsInner = document.createElement('div');
      this.optionsInner.className = 'sb-custom-select__options-inner';

      // Create option elements
      this.options.forEach((option, index) => {
        const optionElement = document.createElement('li');
        optionElement.className = this.optionClass;
        optionElement.setAttribute('role', 'option');
        optionElement.setAttribute('data-value', option.value);
        optionElement.setAttribute('data-index', index);
        optionElement.textContent = option.text;

        if (index === this.selectedIndex) {
          optionElement.classList.add(this.selectedClass);
          optionElement.setAttribute('aria-selected', 'true');
        }

        if (option.disabled) {
          optionElement.setAttribute('aria-disabled', 'true');
          optionElement.classList.add(`${this.optionClass}--disabled`);
        }

        this.optionsInner.appendChild(optionElement);
      });

      // Append inner wrapper to options list
      this.optionsList.appendChild(this.optionsInner);

      // Assemble the structure
      this.selectTrigger.appendChild(this.selectDisplay);
      this.selectTrigger.appendChild(this.selectIcon);
      this.selectWrapper.appendChild(this.selectTrigger);
      this.selectWrapper.appendChild(this.optionsList);

      // Insert the custom UI after the native select
      this.nativeSelect.insertAdjacentElement('afterend', this.selectWrapper);

      // Add styles
      this.addStyles();
    }

    /**
     * Caches DOM elements for later use
     *
     * @private
     */
    cacheElements() {
      this.optionElements = Array.from(this.optionsInner.querySelectorAll(`.${this.optionClass}`));
    }

    /**
     * Sets up event listeners for the select component
     *
     * @private
     */
    setupEventListeners() {
      if (!this.selectTrigger) {
        console.warn('sb-custom-select: Trigger element not found');
        return;
      }

      // Click to toggle dropdown
      this.selectTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        if (!this.disabled) {
          this.toggleDropdown();
        }
      });

      // Keyboard navigation
      this.selectTrigger.addEventListener('keydown', (e) => this.handleKeydown(e));

      // Option selection
      this.optionElements.forEach((option, index) => {
        option.addEventListener('click', () => {
          if (!this.options[index].disabled) {
            this.selectOption(index);
            this.closeDropdown();
          }
        });

        option.addEventListener('mouseenter', () => {
          this.setFocusedOption(index);
        });
      });

      // Listen for native select changes (in case it's changed programmatically)
      this.nativeSelect.addEventListener('change', () => {
        this.syncFromNativeSelect();
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!this.contains(e.target)) {
          this.closeDropdown();
        }
      });

      // Close dropdown on escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.closeDropdown();
          this.selectTrigger.focus();
        }
      });
    }

    /**
     * Sets up accessibility attributes
     *
     * @private
     */
    setupAccessibility() {
      const selectId = `sb-select-${Math.random().toString(36).substr(2, 9)}`;
      const optionsId = `${selectId}-options`;

      this.selectTrigger.setAttribute('id', selectId);
      this.selectTrigger.setAttribute('aria-haspopup', 'listbox');
      this.selectTrigger.setAttribute('aria-expanded', 'false');
      this.selectTrigger.setAttribute('aria-labelledby', selectId);
      this.selectTrigger.setAttribute('role', 'combobox');

      this.optionsList.setAttribute('id', optionsId);
      this.selectTrigger.setAttribute('aria-controls', optionsId);

      if (this.required) {
        this.selectTrigger.setAttribute('aria-required', 'true');
      }
    }

    /**
     * Handles keyboard navigation
     *
     * @private
     * @param {KeyboardEvent} e - The keyboard event
     */
    handleKeydown(e) {
      if (this.disabled) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          this.toggleDropdown();
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (this.isOpen) {
            this.focusNextOption();
          } else {
            this.openDropdown();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (this.isOpen) {
            this.focusPreviousOption();
          }
          break;
        case 'Home':
          if (this.isOpen) {
            e.preventDefault();
            this.setFocusedOption(0);
          }
          break;
        case 'End':
          if (this.isOpen) {
            e.preventDefault();
            this.setFocusedOption(this.options.length - 1);
          }
          break;
        default:
          // Type-ahead functionality could be added here
          break;
      }
    }

    /**
     * Toggles the dropdown open/closed state
     *
     * @private
     */
    toggleDropdown() {
      if (this.isOpen) {
        this.closeDropdown();
      } else {
        this.openDropdown();
      }
    }

    /**
     * Opens the dropdown
     *
     * @private
     * @fires TdCustomSelect#sb-custom-select:open
     */
    openDropdown() {
      if (this.disabled) return;

      this.isOpen = true;
      this.selectWrapper.classList.add(this.openClass);
      this.selectTrigger.setAttribute('aria-expanded', 'true');
      this.focusedIndex = this.selectedIndex >= 0 ? this.selectedIndex : 0;
      this.setFocusedOption(this.focusedIndex);

      // Emit opened event
      this.dispatchEvent(
        new CustomEvent('sb-custom-select:open', {
          bubbles: true,
          detail: {
            name: this.name,
            value: this.getValue(),
          },
        })
      );
    }

    /**
     * Closes the dropdown
     *
     * @private
     * @fires TdCustomSelect#sb-custom-select:close
     */
    closeDropdown() {
      this.isOpen = false;
      this.selectWrapper.classList.remove(this.openClass);
      this.selectTrigger.setAttribute('aria-expanded', 'false');
      this.clearFocusedOption();

      // Emit closed event
      this.dispatchEvent(
        new CustomEvent('sb-custom-select:close', {
          bubbles: true,
          detail: {
            name: this.name,
            value: this.getValue(),
          },
        })
      );
    }

    /**
     * Selects an option by index
     *
     * @private
     * @param {number} index - The index of the option to select
     * @fires TdCustomSelect#sb-custom-select:change
     */
    selectOption(index) {
      if (index < 0 || index >= this.options.length || this.options[index].disabled) {
        return;
      }

      const previousIndex = this.selectedIndex;
      this.selectedIndex = index;

      // Update visual state
      this.optionElements.forEach((element, i) => {
        element.classList.toggle(this.selectedClass, i === index);
        element.setAttribute('aria-selected', i === index ? 'true' : 'false');
      });

      this.updateDisplayText();
      this.syncToNativeSelect();

      // Emit change event if selection actually changed
      if (previousIndex !== index) {
        this.dispatchEvent(
          new CustomEvent('sb-custom-select:change', {
            bubbles: true,
            detail: {
              name: this.name,
              value: this.getValue(),
              text: this.getText(),
              previousValue: previousIndex >= 0 ? this.options[previousIndex].value : '',
              index,
            },
          })
        );
      }
    }

    /**
     * Sets the focused option (for keyboard navigation)
     *
     * @private
     * @param {number} index - The index of the option to focus
     */
    setFocusedOption(index) {
      if (index < 0 || index >= this.options.length) return;

      this.clearFocusedOption();
      this.focusedIndex = index;
      this.optionElements[index].classList.add(this.focusedClass);
    }

    /**
     * Clears the focused option
     *
     * @private
     */
    clearFocusedOption() {
      this.optionElements.forEach((element) => {
        element.classList.remove(this.focusedClass);
      });
      this.focusedIndex = -1;
    }

    /**
     * Focuses the next available option
     *
     * @private
     */
    focusNextOption() {
      let nextIndex = this.focusedIndex + 1;
      while (nextIndex < this.options.length && this.options[nextIndex].disabled) {
        nextIndex++;
      }
      if (nextIndex < this.options.length) {
        this.setFocusedOption(nextIndex);
      }
    }

    /**
     * Focuses the previous available option
     *
     * @private
     */
    focusPreviousOption() {
      let prevIndex = this.focusedIndex - 1;
      while (prevIndex >= 0 && this.options[prevIndex].disabled) {
        prevIndex--;
      }
      if (prevIndex >= 0) {
        this.setFocusedOption(prevIndex);
      }
    }

    /**
     * Updates the display text based on current selection
     *
     * @private
     */
    updateDisplayText() {
      if (this.selectedIndex >= 0 && this.options[this.selectedIndex]) {
        const selectedOption = this.options[this.selectedIndex];
        this.selectDisplay.textContent = selectedOption.text;
        this.selectDisplay.classList.remove(`${this.displayClass}--placeholder`);
      } else {
        this.selectDisplay.textContent = this.placeholder;
        this.selectDisplay.classList.add(`${this.displayClass}--placeholder`);
      }
    }

    /**
     * Syncs the custom select state to the native select
     *
     * @private
     */
    syncToNativeSelect() {
      if (this.nativeSelect && this.selectedIndex >= 0) {
        this.nativeSelect.selectedIndex = this.selectedIndex;

        // Trigger change event on native select for form libraries
        const changeEvent = new Event('change', { bubbles: true });
        this.nativeSelect.dispatchEvent(changeEvent);
      }
    }

    /**
     * Syncs the custom select state from the native select
     * Used when the native select is changed programmatically
     *
     * @private
     */
    syncFromNativeSelect() {
      if (this.nativeSelect) {
        const newIndex = this.nativeSelect.selectedIndex;
        if (newIndex !== this.selectedIndex) {
          this.selectedIndex = newIndex;

          // Update visual state
          this.optionElements.forEach((element, i) => {
            element.classList.toggle(this.selectedClass, i === newIndex);
            element.setAttribute('aria-selected', i === newIndex ? 'true' : 'false');
          });

          this.updateDisplayText();
        }
      }
    }

    /**
     * Gets the current selected value
     *
     * @returns {string} The selected value
     */
    getValue() {
      return this.nativeSelect ? this.nativeSelect.value : '';
    }

    /**
     * Gets the current selected text
     *
     * @returns {string} The selected text
     */
    getText() {
      if (this.nativeSelect && this.nativeSelect.selectedIndex >= 0) {
        const selectedOption = this.nativeSelect.options[this.nativeSelect.selectedIndex];
        return selectedOption ? selectedOption.textContent.trim() : '';
      }
      return '';
    }

    /**
     * Sets the selected value programmatically
     *
     * @param {string} value - The value to select
     */
    setValue(value) {
      if (this.nativeSelect) {
        this.nativeSelect.value = value;
        this.syncFromNativeSelect();
      }
    }

    /**
     * Gets the native select element (useful for form libraries)
     *
     * @returns {HTMLSelectElement} The native select element
     */
    getNativeSelect() {
      return this.nativeSelect;
    }

    /**
     * Returns the dropdown icon SVG
     *
     * @private
     * @returns {string} SVG string for the dropdown icon
     */
    getDropdownIcon() {
      return `
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.0384 7.43633C13.0384 7.32563 12.9947 7.21234 12.9097 7.12738C12.7398 6.95747 12.4617 6.95747 12.2918 7.12738L6.47609 12.9431L0.74531 7.21234C0.575395 7.04243 0.297351 7.04243 0.127436 7.21234C-0.0424797 7.38226 -0.0424797 7.6603 0.127436 7.83022L6.16716 13.8725C6.33707 14.0424 6.61512 14.0424 6.78503 13.8725L12.9097 7.74783C12.9972 7.6603 13.0384 7.54961 13.0384 7.43633Z" fill="currentColor"/>
        </svg>
      `;
    }

    /**
     * Adds CSS styles to the component
     *
     * @private
     */
    addStyles() {
      const styleId = 'sb-custom-select-styles';

      // Check if styles are already added
      if (document.getElementById(styleId)) {
        return;
      }

      const styles = document.createElement('style');
      styles.id = styleId;
      styles.textContent = `
        .sb-custom-select {
          --sb-select-border-color: rgba(103, 103, 103, 0.4);
          --sb-select-bg-color: #ffffff;
          --sb-select-text-color: #111314;
          --sb-select-text-opacity: 0.64;
          --sb-select-border-radius: 4px;
          --sb-select-padding: 16px;
          --sb-select-font-size: 14px;
          --sb-select-line-height: 1.4;
          --sb-select-accent-color: #173446;
          --sb-select-option-bg-hover: #f8f9fb;
          
          position: relative;
          display: block;
          width: 100%;
          font-family: inherit;
        }
        
        .sb-custom-select__trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: var(--sb-select-padding);
          background-color: var(--sb-select-bg-color);
          border: 1px solid transparent;
          border-radius: var(--sb-select-border-radius);
          border-left: 1px solid transparent;
          border-right: 1px solid transparent;
          border-top: 1px solid transparent;
          border-bottom: none;
          cursor: pointer;
          font-size: var(--sb-select-font-size);
          line-height: var(--sb-select-line-height);
          text-align: left;
          transition: all 0.2s ease;
        }
        
       .sb-custom-select--open .sb-custom-select__trigger:focus {
          border-color: var(--sb-select-accent-color);
          border-radius: var(--sb-select-border-radius) var(--sb-select-border-radius) 0 0;
        }
        
        .sb-custom-select__display {
          flex: 1;
          color: var(--sb-select-text-color);
          opacity: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .sb-custom-select__display--placeholder {
          opacity: var(--sb-select-text-opacity);
        }
        
        .sb-custom-select__icon {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 10px;
          color: var(--sb-select-text-color);
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }
        
        .sb-custom-select--open .sb-custom-select__icon {
          transform: rotate(180deg);
        }
        
        .sb-custom-select__options {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 1000;
          background-color: var(--sb-select-bg-color);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          list-style: none;
          margin: 0;
          padding: 0;
          max-height: 200px; 
          overflow: hidden;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.2s ease;
          border: 1px solid var(--sb-select-accent-color);
          border-top: none;
          border-radius: 0 0 4px 4px;
        }
        
        .sb-custom-select__options-inner {
          max-height: 200px;
          overflow-y: auto;
          padding-right: 0;
        }
        
        .sb-custom-select--open .sb-custom-select__options {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        
        .sb-custom-select__option {
          display: block;
          padding: var(--sb-select-padding);
          color: var(--sb-select-text-color);
          opacity: var(--sb-select-text-opacity);
          cursor: pointer;
          font-size: var(--sb-select-font-size);
          line-height: var(--sb-select-line-height);
          border-bottom: 1px solid #f8f9fb;
          transition: all 0.2s ease;
        }
        
        .sb-custom-select__option:last-child {
          border-bottom: none;
        }
        
        .sb-custom-select__option:hover:not(.sb-custom-select__option--disabled),
        .sb-custom-select__option--focused:not(.sb-custom-select__option--disabled) {
          background-color: var(--sb-select-option-bg-hover);
          opacity: 1;
        }
        
        .sb-custom-select__option--selected {
          opacity: 1;
          position: relative;
        }
        
        .sb-custom-select__option--selected::after {
          content: '';
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background-color: var(--sb-select-accent-color);
        }
        
        .sb-custom-select__option--disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        
        .sb-custom-select--disabled {
          opacity: 0.5;
          pointer-events: none;
        }
        
        /* Mobile responsiveness */
        @media (max-width: 768px) {
          
          .sb-custom-select__options {
            max-height: 150px;
          }
        }
      `;

      document.head.appendChild(styles);
    }
  }

  // Register the custom element
  customElements.define('sb-custom-select', TdCustomSelect);
}
