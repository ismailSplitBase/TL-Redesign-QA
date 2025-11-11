// /*
// Usage:
//   <skio-cart-upsell item='{{ item | json | escape }}' line='{{ forloop.index }}'></skio-cart-upsell>
//   <script src="{{ 'skio-cart-upsell.js' | asset_url }}" type="module"></script>

//   May want to include above module globally if element is used in cart drawer
// */

// import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js'

// const skioCartStyles = css`
//   .skio-cart-upsell {
//     margin-top: 10px;
//     width: 100%;
//     padding: 1rem;
//     background: transparent;
//     border: 1px solid black;
//     border-radius: 0.5rem;
//     cursor: pointer;
//     max-width: 100%;
//     appearance: none;
//     background: url(https://cdn.shopify.com/s/files/1/0866/7664/files/select-arrow-skio.png?v=1742807564);
//     background-size: 12px;
//     background-repeat: no-repeat;
//     background-position: center right 16px;
//     border: 1px solid rgba(103, 103, 103, 0.32);
//     border-radius: unset;
//     padding: 9px 24px;
//     color: #111314;
//     font-size: 14px;
//     font-style: normal;
//     font-weight: 400;
//     line-height: 140%;
//     background-position: center right 24px;
//     outline: none;
//   }

//   button.skio-cart-upgrade:before {
//     content: '' !important;
//     background-image: url(https://cdn.shopify.com/s/files/1/0866/7664/files/no-subscription-image.png?v=1743148873) !important;
//     display: block;
//     width: 12px;
//     height: 12px;
//     position: absolute;
//     background-repeat: no-repeat;
//     left: 0;
//     top: 3px;
//   }

//   button.skio-cart-upgrade.skio-button-active:before {
//     content: '' !important;
//     background-image: url(https://cdn.shopify.com/s/files/1/0866/7664/files/upgrade-to-subscription.png?v=1742807922) !important;
//     display: block;
//     width: 12px;
//     height: 12px;
//     position: absolute;
//     background-repeat: no-repeat;
//     left: 0;
//     top: 3px;
//   }

//   .skio-cart-upgrade {
//     position: relative;
//     padding-left: 18px !important;
//     text-align: left;
//     margin-top: 10px;
//     background: transparent !important;
//     color: #676767 !important;
//     border: 1px solid transparent !important;
//     outline: none;
//     cursor: pointer;
//     padding: 0;
//     width: auto;
//     border-radius: 0.5rem;
//     transition: color 0.25s, background-color 0.25s, border-color 0.25s;
//     font-size: 12px;
//     font-style: normal;
//     font-weight: 400;
//     line-height: 140%;
//   }

//   .skio-cart-upgrade strong {
//     font-weight: 500;
//   }

//   .skio-cart-upgrade:hover {
//     color: #886af6;
//     border-color: #886af6;
//     background: transparent;
//   }
// `

// export class SkioCartUpsell extends LitElement {
//   static styles = skioCartStyles

//   static properties = {
//     item: {
//       type: Object,
//       converter: (value) => {
//         try {
//           return typeof value === 'string' ? JSON.parse(value) : value;
//         } catch (e) {
//           console.error('Failed to parse item JSON:', e);
//           return null;
//         }
//       }
//     },
//     line: {
//       type: Number,
//       converter: (value) => {
//         const num = parseInt(value, 10);
//         // Convert from 0-based to 1-based index
//         return isNaN(num) ? null : num + 1;
//       }
//     },
//     product: { type: Object },
//     selectedVariant: { type: Object },
//     key: { type: String },
//     skioSellingPlanGroups: { type: Array },
//     availableSellingPlanGroups: { type: Array },
//     selectedSellingPlanGroup: { type: Object },
//     selectedSellingPlan: { type: Object },
//     discount_format: { type: String },
//     moneyFormatter: {},
//     currency: { type: String }
//   }

//   constructor() {
//     super()

//     this.item = null
//     this.line = null

//     this.product = null
//     this.selectedVariant = null

//     this.skioSellingPlanGroups = null
//     this.availableSellingPlanGroups = null

//     this.selectedSellingPlanGroup = null
//     this.selectedSellingPlan = null

//     this.discountFormat = 'percent'

//     this.currency = 'USD'
//     this.moneyFormatter = new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: this.currency,
//     })
//   }

//   connectedCallback() {
//     super.connectedCallback()
//   }

//   attributeChangedCallback(name, oldValue, newValue) {
//     super.attributeChangedCallback(name, oldValue, newValue)
//   }

//   upgradeButton = () => {
//     if (this.availableSellingPlanGroups?.length > 0) {
//       return html`
//         <button class="skio-cart-upgrade ${this.selectedSellingPlan ? 'skio-button-active' : ''}" type="button" @click=${() => this.selectSellingPlan(this.availableSellingPlanGroups[0].selected_selling_plan.id)}>
//           <span>Upgrade to Subscription:</span><br>
//           <strong>Free shipping & Save ${this.discount(this.availableSellingPlanGroups[0].selected_selling_plan).percent}</strong>
//         </button>
//       `
//     } else {
//       return html``
//     }
//   }

//   changeFrequency = () => {
//     //console.log("this.selectedSellingPlan", this.selectedSellingPlan);
//     return html`
//       <select class="skio-cart-upsell" skio-cart-upsell="${this.key}" @change=${e => this.selectSellingPlan(e.target.value)} style="${ !this.selectedSellingPlan ? 'display:none;':'' }">
//         ${!this.product.requires_selling_plan
//           ? html`
//               <optgroup label="One Time Purchase">
//                 <option value="">One-time</option>
//               </optgroup>
//             `
//           : ''}
//         ${this.availableSellingPlanGroups
//           ? this.availableSellingPlanGroups.map(
//               (group, index) =>
//                 html`
//                   <optgroup label="${group.name} (Save ${this.discount(group.selected_selling_plan).percent})">
//                     ${group
//                       ? group.selling_plans.map(selling_plan => html` <option value="${selling_plan.id}" .selected=${selling_plan.id == this.selectedSellingPlan?.id}>${selling_plan.name}</option> `)
//                       : ''}
//                   </optgroup>
//                 `
//             )
//           : ''}
//       </select>
//     `
//   }

//   render() {
//     if (!this.item || !this.product || !this.selectedVariant) return
//     return html`
//       <div>
//       ${this.upgradeButton()}
//       </div>
//       <div>
//       ${this.changeFrequency()}
//       </div>
//       `
//   }

//   updated = changed => {
//     if (changed.has('item') && this.item) {
//       this.fetchProduct(this.item.handle)
//     }

//     if (changed.has('product') && this.product) {
//       this.skioSellingPlanGroups = this.product.selling_plan_groups.filter(selling_plan_group => selling_plan_group.app_id === 'SKIO')

//       this.selectedVariant = this.product.variants.find(variant => variant.id == this.item.variant_id)

//       if (this.item.selling_plan_allocation) {
//         this.selectedSellingPlanGroup = this.skioSellingPlanGroups.find(group => group.selling_plans.find(selling_plan => selling_plan.id == this.item.selling_plan_allocation.selling_plan.id))
//         this.selectedSellingPlan = this.selectedSellingPlanGroup.selling_plans.find(selling_plan => selling_plan.id == this.item.selling_plan_allocation.selling_plan.id)
//       }
//     }

//     if (changed.has('selectedVariant') && this.selectedVariant) {
//       //update availableSellingPlanGroups based on skioSellingPlanGroups and selectedVariant.id
//       this.availableSellingPlanGroups = this.skioSellingPlanGroups.filter(selling_plan_group =>
//         selling_plan_group.selling_plans.some(selling_plan =>
//           this.selectedVariant.selling_plan_allocations.some(selling_plan_allocation => selling_plan_allocation.selling_plan_id === selling_plan.id)
//         )
//       )

//       //update selectedSellingPlan value
//       if (this.availableSellingPlanGroups.length) {
//         //update each group with a default selected_selling_plan

//         this.availableSellingPlanGroups.forEach(group => {
//           group.selected_selling_plan = group.selling_plans[0]
//         })
//       }
//     }

//     if (changed.has('selectedSellingPlan') && this.product) {
//       this.updateLineItem()
//     }
//   }

//   log = (...args) => {
//     args.unshift('%c[skio cart upsell]', 'color: #8770f2;')
//     //console.log.apply(console, args)
//   }

//   error = (...args) => {
//     args.unshift('%c [skio cart upsell]', 'color: #ff0000')
//     console.error.apply(console, args)
//   }

//   getSectionsToRender() {
//     return [
//       {
//         id: 'cart_form',
//         section: document.getElementById('cart_form').dataset.id,
//         selector: '.cart__item-list',
//       },
//     ]
//   }

//   getSectionInnerHTML(html, selector) {
//     return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML
//   }

//   updateLineItem() {
//     if (!this.line || !this.item) return
//     if (this.item.selling_plan_allocation?.selling_plan?.id == this.selectedSellingPlan?.id) return

//     let data

//     if (this.selectedSellingPlan) {
//       data = JSON.stringify({
//         line: this.line,
//         quantity: this.item.quantity,
//         selling_plan: this.selectedSellingPlan ? this.selectedSellingPlan?.id : null,
//         properties: {
//           'Subscription Discount': this.discount(this.selectedSellingPlan).percent,
//         },
//       })
//     } else {
//       data = JSON.stringify({
//         line: this.line,
//         quantity: this.item.quantity,
//         selling_plan: null,
//         properties: {
//           'Subscription Discount': null,
//         },
//       })
//     }

//     fetch('/cart/change.js', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: data,
//     })
//       .then(response => response.text())
//       .then(cart => {
//         if (Shopify.theme.jsCart !== 'undefined' && window.location.href.includes('/cart')) {
//           Shopify.theme.jsCart.updateView(JSON.parse(cart), this.line)
//         }

//         if (typeof Shopify.theme.jsAjaxCart !== 'undefined') {
//           Shopify.theme.jsAjaxCart.updateView()
//         }

//         // Open cart menu after successful update
//         if (typeof openCartMenu === 'function') {
//           openCartMenu()
//         }
//       })
//   }

//   // Update selected selling plan group; called on click of skio-group-container element
//   selectSellingPlanGroup(group) {
//     this.selectedSellingPlanGroup = group
//     this.selectedSellingPlan = group?.selected_selling_plan
//   }

//   // Update selected selling plan; called on change of skio-frequency select element
//   selectSellingPlan(id) {
//     if (!id) {
//       this.selectedSellingPlanGroup = null
//       this.selectedSellingPlan = null
//       return
//     }

//     let group = this.availableSellingPlanGroups.find(group => group.selling_plans.find(selling_plan => selling_plan.id == id))
//     let selling_plan = group.selling_plans.find(x => x.id == id)

//     if (selling_plan) {
//       group.selected_selling_plan = selling_plan
//       this.selectedSellingPlanGroup = group
//       this.selectedSellingPlan = selling_plan
//     } else this.log("Error: couldn't find selling plan with id " + element.value + ' for variant ' + this.selectedVariant.id + ' from product ' + this.product.id + ' : ' + this.product.handle)
//   }

//   // Formats integer value into money value
//   money(price) {
//     return this.moneyFormatter.format(price / 100.0)
//   }

//   // Calculates discount based on selling_plan.price_adjustments, returns { percent, amount } of selling plan discount
//   discount(selling_plan) {
//     if (!selling_plan) return { percent: '0%', amount: 0 }

//     const price_adjustment = selling_plan.price_adjustments[0]
//     const discount = { percent: '0%', amount: 0 }
//     const price = this.selectedVariant.price

//     switch (price_adjustment.value_type) {
//       case 'percentage':
//         discount.percent = `${price_adjustment.value}%`
//         discount.amount = Math.round((price * price_adjustment.value) / 100.0)
//         break
//       case 'fixed_amount':
//         discount.percent = `${Math.round(((price_adjustment.value * 1.0) / price) * 100.0)}%`
//         discount.amount = price_adjustment.value
//         break
//       case 'price':
//         discount.percent = `${Math.round((((price - price_adjustment.value) * 1.0) / price) * 100.0)}%`
//         discount.amount = price - price_adjustment.value
//         break
//     }

//     return discount
//   }

//   fetchProduct = async handle => {
//     let productCache = window.sessionStorage.skioCartProductCache ? JSON.parse(window.sessionStorage.skioCartProductCache) : []
//     let cachedProduct = productCache ? productCache.find(product => product.handle == handle) : null

//     if (cachedProduct) {
//       this.product = cachedProduct
//     } else {
//       await fetch(`/products/${handle}.js`)
//         .then(response => response.json())
//         .then(response => {
//           this.product = response
//           productCache.push(response)
//           window.sessionStorage.skioCartProductCache = JSON.stringify(productCache)
//           this.requestUpdate()
//         })
//     }
//   }
// }

// customElements.define('skio-cart-upsell', SkioCartUpsell)

/*
Usage: 
  <skio-cart-upsell item='{{ item | json | escape }}' line='{{ forloop.index }}'></skio-cart-upsell>
  <script src="{{ 'skio-cart-upsell.js' | asset_url }}" type="module"></script>
  
  May want to include above module globally if element is used in cart drawer
*/

import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js';

const skioCartStyles = css`
  .skio-cart-upsell {
    margin-top: 8px;
    width: 100%;
    padding: 1rem 35px 1rem 22px !important;
    position: relative !important;
    background: transparent;
    border: 1px solid black;
    border-radius: 0.5rem;
    cursor: pointer;
    max-width: 165px;
    appearance: none;
    background: url(https://cdn.shopify.com/s/files/1/0866/7664/files/select-arrow-skio.png?v=1742807564);
    background-size: 12px;
    background-repeat: no-repeat;
    background-position: center right 16px;
    border: 1px solid rgba(103, 103, 103, 0.32);
    border-radius: unset;
    padding: 9px 24px;
    color: #111314;
    font-family: var(--sb-font-family-body);
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 140%;
    background-position: center right 24px;
    outline: none;
  }

  optgroup[label='One Time Purchase'],
  optgroup[label='One Time Purchase'] option {
    display: none;
  }

  button.skio-cart-upgrade:before {
    content: '' !important;
    background-image: url(https://cdn.shopify.com/s/files/1/0866/7664/files/no-subscription-image.png?v=1743148873) !important;
    display: block;
    width: 12px;
    height: 12px;
    position: absolute;
    background-repeat: no-repeat;
    left: 0;
    top: 3px;
  }

  button.skio-cart-upgrade.skio-button-active:before {
    content: '' !important;
    background-image: url(https://cdn.shopify.com/s/files/1/0866/7664/files/upgrade-to-subscription.png?v=1742807922) !important;
    display: block;
    width: 12px;
    height: 12px;
    position: absolute;
    background-repeat: no-repeat;
    left: 0;
    top: 3px;
  }

  .skio-cart-upgrade {
    position: relative;
    padding-left: 18px !important;
    text-align: left;
    background: transparent !important;
    color: #676767 !important;
    border: 1px solid transparent !important;
    outline: none;
    cursor: pointer;
    padding: 0;
    width: auto;
    border-radius: 0.5rem;
    transition: color 0.25s, background-color 0.25s, border-color 0.25s;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 140%;
    font-family: var(--sb-font-family-body);
  }

  .disable_cart_inputs .skio-cart-upgrade {
    cursor: wait;
  }

  .skio-cart-upgrade strong {
    font-weight: 500;
  }

  .skio-cart-upgrade:hover {
    color: #886af6;
    border-color: #886af6;
    background: transparent;
  }

  .skio-cart-upgrade.disabled {
    pointer-events: none;
    opacity: 0.5;
  }

  // .skio-cart-upsell.disabled {
  //   pointer-events: none;
  //   opacity: 0.5;
  // }
`;

export class SkioCartUpsell extends LitElement {
  static styles = skioCartStyles;

  static properties = {
    item: {
      type: Object,
      converter: (value) => {
        try {
          return typeof value === 'string' ? JSON.parse(value) : value;
        } catch (e) {
          console.error('Failed to parse item JSON:', e);
          return null;
        }
      },
    },
    line: {
      type: Number,
      converter: (value) => {
        const num = parseInt(value, 10);
        // Convert from 0-based to 1-based index
        return isNaN(num) ? null : num + 1;
      },
    },
    product: { type: Object },
    selectedVariant: { type: Object },
    key: { type: String },
    skioSellingPlanGroups: { type: Array },
    availableSellingPlanGroups: { type: Array },
    selectedSellingPlanGroup: { type: Object },
    selectedSellingPlan: { type: Object },
    discount_format: { type: String },
    moneyFormatter: {},
    currency: { type: String },
  };

  constructor() {
    super();

    this.item = null;
    this.line = null;

    this.product = null;
    this.selectedVariant = null;

    this.skioSellingPlanGroups = null;
    this.availableSellingPlanGroups = null;

    this.selectedSellingPlanGroup = null;
    this.selectedSellingPlan = null;

    this.discountFormat = 'percent';

    this.currency = 'USD';
    this.moneyFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency,
    });
  }

  connectedCallback() {
    super.connectedCallback();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  upgradeButton = () => {
    if (this.availableSellingPlanGroups?.length > 0) {
      let btnDisabled = this.closest('.cart--line-item').dataset.lineGiftProduct == 'yes' ? true : false;

      return html`
        <button
          class="skio-cart-upgrade ${this.selectedSellingPlan ? 'skio-button-active' : ''} ${btnDisabled
            ? 'disabled'
            : ''}"
          type="button"
          @click=${this.handleUpgradeClick}
        >
          <span>Upgrade to Subscription:</span><br />
          <strong
            >Free shipping & Save
            ${this.discount(this.availableSellingPlanGroups[0].selected_selling_plan).percent}</strong
          >
        </button>
      `;
    } else {
      return html``;
    }
  };

  handleUpgradeClick = () => {
    // Check if the current selected selling plan is active
    if (this.selectedSellingPlan) {
      // Change the selected selling plan to null (one-time purchase)
      this.selectSellingPlan(null);
    } else {
      // Otherwise, select the first available selling plan

      // Find the first plan with "30 days" in the name and get its ID
      let thirtyDaysId = this.availableSellingPlanGroups[0].selling_plans.find((val) => val.name.includes('30 days'))
        ? this.availableSellingPlanGroups[0].selling_plans.find((val) => val.name.includes('30 days')).id
        : null;
      if (thirtyDaysId) {
        this.selectSellingPlan(thirtyDaysId);
      } else {
        this.selectSellingPlan(this.availableSellingPlanGroups[0].selected_selling_plan.id);
      }
    }
  };

  changeFrequency = () => {
    return html`
      <select
        class="skio-cart-upsell"
        skio-cart-upsell="${this.key}"
        @change=${(e) => this.selectSellingPlan(e.target.value)}
        style="${!this.selectedSellingPlan ? 'display:none;' : ''}"
      >
        ${!this.product.requires_selling_plan
          ? html`
              <optgroup label="One Time Purchase">
                <option value="">One-time</option>
              </optgroup>
            `
          : ''}
        ${this.availableSellingPlanGroups
          ? this.availableSellingPlanGroups.map(
              (group, index) =>
                html`
                  <optgroup label="${group.name} (Save ${this.discount(group.selected_selling_plan).percent})">
                    ${group
                      ? group.selling_plans.map(
                          (selling_plan) =>
                            html`
                              <option
                                value="${selling_plan.id}"
                                .selected=${selling_plan.id == this.selectedSellingPlan?.id}
                              >
                                ${selling_plan.name}
                              </option>
                            `
                        )
                      : ''}
                  </optgroup>
                `
            )
          : ''}
      </select>
    `;
  };

  render() {
    if (!this.item || !this.product || !this.selectedVariant) return;
    return html`
      <div>${this.upgradeButton()}</div>
      <div>${this.changeFrequency()}</div>
    `;
  }

  updated = (changed) => {
    if (changed.has('item') && this.item) {
      this.fetchProduct(this.item.handle);
    }

    if (changed.has('product') && this.product) {
      this.skioSellingPlanGroups = this.product.selling_plan_groups.filter(
        (selling_plan_group) => selling_plan_group.app_id === 'SKIO'
      );

      this.selectedVariant = this.product.variants.find((variant) => variant.id == this.item.variant_id);

      if (this.item.selling_plan_allocation) {
        this.selectedSellingPlanGroup = this.skioSellingPlanGroups.find((group) =>
          group.selling_plans.find(
            (selling_plan) => selling_plan.id == this.item.selling_plan_allocation.selling_plan.id
          )
        );
        this.selectedSellingPlan = this.selectedSellingPlanGroup.selling_plans.find(
          (selling_plan) => selling_plan.id == this.item.selling_plan_allocation.selling_plan.id
        );
      }
    }

    if (changed.has('selectedVariant') && this.selectedVariant) {
      //update availableSellingPlanGroups based on skioSellingPlanGroups and selectedVariant.id
      this.availableSellingPlanGroups = this.skioSellingPlanGroups.filter((selling_plan_group) =>
        selling_plan_group.selling_plans.some((selling_plan) =>
          this.selectedVariant.selling_plan_allocations.some(
            (selling_plan_allocation) => selling_plan_allocation.selling_plan_id === selling_plan.id
          )
        )
      );

      //update selectedSellingPlan value
      if (this.availableSellingPlanGroups.length) {
        //update each group with a default selected_selling_plan

        this.availableSellingPlanGroups.forEach((group) => {
          group.selected_selling_plan = group.selling_plans[0];
        });
      }
    }

    if (changed.has('selectedSellingPlan') && this.product) {
      this.updateLineItem();
    }
  };

  log = (...args) => {
    args.unshift('%c[skio cart upsell]', 'color: #8770f2;');
    // //console.log.apply(console, args)
  };

  error = (...args) => {
    args.unshift('%c [skio cart upsell]', 'color: #ff0000');
    console.error.apply(console, args);
  };

  getSectionsToRender() {
    return [
      {
        id: 'CartDrawer',
        section: 'cart-drawer',
        selector: '.drawer__inner',
      },
    ];
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  updateLineItem() {
    if (!this.line || !this.item) return;
    if (this.item.selling_plan_allocation?.selling_plan?.id == this.selectedSellingPlan?.id) return;

    document.body.classList.add('disable_cart_inputs');

    let data;

    // //console.log("Hello !!!");
    // //console.log(this.item);

    if (this.selectedSellingPlan) {
      let updatedProps = {};

      // Adding properties to the object
      updatedProps['Subscription Discount'] = this.discount(this.selectedSellingPlan).percent;

      if (this.item.properties.Discount) {
        updatedProps['Discount'] = this.item.properties.Discount ? this.item.properties.Discount : '';
      }

      if (this.item.properties._subscription_only) {
        updatedProps['_subscription_only'] = this.item.properties._subscription_only;
      }

      data = JSON.stringify({
        line: this.line,
        quantity: this.item.quantity,
        selling_plan: this.selectedSellingPlan ? this.selectedSellingPlan?.id : null,
        properties: updatedProps,
        sections: this.getSectionsToRender().map((section) => section.section),
        sections_url: window.location.pathname,
      });
    } else {
      data = JSON.stringify({
        line: this.line,
        quantity: this.item.quantity,
        selling_plan: null,
        properties: {
          'Subscription Discount': null,
        },
        sections: this.getSectionsToRender().map((section) => section.section),
        sections_url: window.location.pathname,
      });
    }

    // fetch('/cart/change.js', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: data,
    // })
    //   .then(response => response.text())
    //   .then(cart => {
    //     if (Shopify.theme.jsCart !== 'undefined' && window.location.href.includes('/cart')) {
    //       Shopify.theme.jsCart.updateView(JSON.parse(cart), this.line)
    //     }

    //     if (typeof Shopify.theme.jsAjaxCart !== 'undefined') {
    //       Shopify.theme.jsAjaxCart.updateView()
    //     }

    //     // Open cart menu after successful update
    //     if (typeof openCartMenu === 'function') {
    //       openCartMenu()
    //       document.body.classList.remove("disable_cart_inputs")
    //     }
    //   })

    fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data,
    })
      .then((response) => response.text())
      .then((state) => {
        const parsedState = JSON.parse(state);

        if (Shopify.theme.jsCart !== 'undefined' && window.location.href.includes('/cart')) {
          Shopify.theme.jsCart.updateView(parsedState, this.line);
        }

        if (typeof Shopify.theme.jsAjaxCart !== 'undefined') {
          Shopify.theme.jsAjaxCart.updateView();
        }

        // Open cart menu after successful update
        if (typeof openCartMenu === 'function') {
          openCartMenu();
        }

        // Update sections
        this.getSectionsToRender().forEach((section) => {
          const elementToReplace =
            document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);
          if (elementToReplace) {
            elementToReplace.innerHTML = this.getSectionInnerHTML(
              parsedState.sections[section.section],
              section.selector
            );
          }
        });
      })
      .catch((error) => {
        console.error('Error updating cart:', error);
      })
      .finally(() => {
        // This will always run, success or error
        //console.log('Cart update request completed.')
        // You can remove loading spinners or re-enable inputs here
        setTimeout(function () {
          document.body.classList.remove('disable_cart_inputs');
        }, 1000);
      });
  }

  // Update selected selling plan group; called on click of skio-group-container element
  selectSellingPlanGroup(group) {
    this.selectedSellingPlanGroup = group;
    this.selectedSellingPlan = group?.selected_selling_plan;
  }

  // Update selected selling plan; called on change of skio-frequency select element
  selectSellingPlan(id) {
    if (!id) {
      this.selectedSellingPlanGroup = null;
      this.selectedSellingPlan = null;
      return;
    }

    let group = this.availableSellingPlanGroups.find((group) =>
      group.selling_plans.find((selling_plan) => selling_plan.id == id)
    );
    let selling_plan = group.selling_plans.find((x) => x.id == id);

    if (selling_plan) {
      group.selected_selling_plan = selling_plan;
      this.selectedSellingPlanGroup = group;
      this.selectedSellingPlan = selling_plan;
    } else {
      this.log(
        "Error: couldn't find selling plan with id " +
          id +
          ' for variant ' +
          this.selectedVariant.id +
          ' from product ' +
          this.product.id +
          ' : ' +
          this.product.handle
      );
    }
  }

  // Formats integer value into money value
  money(price) {
    return this.moneyFormatter.format(price / 100.0);
  }

  // Calculates discount based on selling_plan.price_adjustments, returns { percent, amount } of selling plan discount
  discount(selling_plan) {
    if (!selling_plan) return { percent: '0%', amount: 0 };

    const price_adjustment = selling_plan.price_adjustments[0];
    const discount = { percent: '0%', amount: 0 };
    const price = this.selectedVariant.price;

    switch (price_adjustment.value_type) {
      case 'percentage':
        discount.percent = `${price_adjustment.value}%`;
        discount.amount = Math.round((price * price_adjustment.value) / 100.0);
        break;
      case 'fixed_amount':
        discount.percent = `${Math.round(((price_adjustment.value * 1.0) / price) * 100.0)}%`;
        discount.amount = price_adjustment.value;
        break;
      case 'price':
        discount.percent = `${Math.round((((price - price_adjustment.value) * 1.0) / price) * 100.0)}%`;
        discount.amount = price - price_adjustment.value;
        break;
    }

    return discount;
  }

  fetchProduct = async (handle) => {
    let productCache = window.sessionStorage.skioCartProductCache
      ? JSON.parse(window.sessionStorage.skioCartProductCache)
      : [];
    let cachedProduct = productCache ? productCache.find((product) => product.handle == handle) : null;

    if (cachedProduct) {
      this.product = cachedProduct;
    } else {
      await fetch(`/products/${handle}.js`)
        .then((response) => response.json())
        .then((response) => {
          this.product = response;
          productCache.push(response);
          window.sessionStorage.skioCartProductCache = JSON.stringify(productCache);
          this.requestUpdate();
        });
    }
  };
}

customElements.define('skio-cart-upsell', SkioCartUpsell);
