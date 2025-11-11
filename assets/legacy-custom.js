// window.setupProductPageSlider = function() {
//   let selector = '.product-images-slider';
//   let element = document.querySelector(selector);
//   var swiper= Swiper;
//   if (element) {

//     function initSwiper() {
//         if (window.innerWidth < 768) {
//     var swiper = new Swiper('.product-images-slider', {
//       loop: false,
//       slidesPerView: 1,
//       navigation: {
//         nextEl: ".swiper-button-next",
//         prevEl: ".swiper-button-prev",
//       },
//       spaceBetween: 0,
//       pagination: {
//         el: ".swiper-pagination",
//         clickable: true
//       }
//     });
//     }
//     else
//     {
//       if (swiper)
//       {
//         swiper.destroy(true, true);
//         swiper = undefined;
//         document.querySelector('.swiper-wrapper').style.transform = ''; // Reset any transform style
//       }
//     }
//   }

//     // Initialize Swiper on page load
//     initSwiper();

//     // Reinitialize Swiper on window resize
//     window.addEventListener('resize', function() {
//         initSwiper();
//     });

//     function observeSliderImages() {
//       function handleIntersection(entries, observer) {
//         entries.forEach(entry => {
//           if (entry.isIntersecting) {
//             const element = entry.target;
//             if (typeof element.querySelector(".A-B-images .swiper-slide-active img").dataset.src !== "undefined") {
//               element.querySelector(".A-B-images .swiper-slide-active img").src = element.querySelector(".A-B-images .swiper-slide-active img").dataset.src;
//               element.querySelector(".A-B-images .swiper-slide-active img").classList.remove("hidden");
//             }
//           }
//         });
//       }
//       const observerElement = new IntersectionObserver(handleIntersection, {
//         root: null,
//         threshold: 0
//       });
//       const elements = document.querySelectorAll(".grid__item product-grid-item");
//       elements.forEach(element => {
//         observerElement.observe(element);
//       });

//       function handleIntersection2(entries, observer2) {
//         entries.forEach((entry) => {
//           const activeSlide = entry.target;
//           const imgElement = activeSlide.querySelector('img');
//           if (imgElement && activeSlide.classList.contains('swiper-slide-active')) {
//             imgElement.src = imgElement.dataset.src;
//             imgElement.classList.remove("hidden");
//           }
//         });
//       }

//       const observer2 = new IntersectionObserver(handleIntersection2, {
//         root: null,
//         threshold: 0.5,
//       });

//       const allSlides = document.querySelectorAll('.swiper-slide');

//       allSlides.forEach((slide) => {
//         observer2.observe(slide);
//       });
//     }

//     function checkImages() {
//       var imagesElement = document.querySelector('.product-images-slider');
//       if ((getComputedStyle(imagesElement).display === 'block' || imagesElement.style.display === 'block')) {
//         observeSliderImages();
//         document.querySelectorAll('.product-images-slider').forEach(function(elm) {
//           elm.classList.add('active');
//         });
//       }
//     }
//     if (document.querySelectorAll('.product-images-slider').length > 0) {
//       checkImages();
//     }
//   }
// }

// window.setupProductPageSlider();

// window.addEventListener('load', function() {
//   document.querySelectorAll("ul#product-grid img").forEach(el => {
//     if (el.src == "") {
//       el.src = el.dataset.src;
//     }
//   })
// });

var Shopify = Shopify || {};
Shopify.money_format = '${{amount}}';
Shopify.formatMoney = function (cents, format) {
  if (typeof cents == 'string') {
    cents = cents.replace('.', '');
  }
  var value = '';
  var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  var formatString = format || this.money_format;

  function defaultOption(opt, def) {
    return typeof opt == 'undefined' ? def : opt;
  }

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultOption(precision, 2);
    thousands = defaultOption(thousands, ',');
    decimal = defaultOption(decimal, '.');

    if (isNaN(number) || number == null) {
      return 0;
    }

    number = (number / 100.0).toFixed(precision);

    var parts = number.split('.'),
      dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
      cents = parts[1] ? decimal + parts[1] : '';

    return dollars + cents;
  }

  switch (formatString.match(placeholderRegex)[1]) {
    case 'amount':
      value = formatWithDelimiters(cents, 2);
      break;
    case 'amount_no_decimals':
      value = formatWithDelimiters(cents, 0);
      break;
    case 'amount_with_comma_separator':
      value = formatWithDelimiters(cents, 2, '.', ',');
      break;
    case 'amount_no_decimals_with_comma_separator':
      value = formatWithDelimiters(cents, 0, '.', ',');
      break;
  }

  return formatString.replace(placeholderRegex, value);
};

if (!customElements.get('lazy-image')) {
  class LazyImage extends HTMLElement {
    constructor() {
      super();

      const lazyImage = this.querySelector('img[data-src]');
      const placeholderImage = this.querySelector('img[data-placeholder]');

      const intersectionObserver = new IntersectionObserver(function (entries) {
        if (entries[0].intersectionRatio <= 0) return;

        if (lazyImage.getAttribute('src')) {
          return;
        }

        lazyImage.addEventListener('load', function () {
          placeholderImage.classList.replace('z-10', 'z-0');
          lazyImage.classList.replace('z-0', 'z-10');
          lazyImage.classList.replace('opacity-0', 'opacity-100');

          setTimeout(() => {
            placeholderImage.classList.add('opacity-0');
          }, 200);
        });

        lazyImage.setAttribute('src', lazyImage.dataset.src);
      });

      if (this.closest('.swiper-wrapper')) {
        intersectionObserver.observe(this.closest('.swiper-wrapper'));
      } else {
        intersectionObserver.observe(placeholderImage);
      }
    }
  }
  customElements.define('lazy-image', LazyImage);
}

if (!customElements.get('legacy-quantity-input')) {
  class LegacyQuantityInput extends HTMLElement {
    constructor() {
      super();

      const input = this.querySelector('input');
      const allowZero = this.dataset.allowZero !== undefined;

      if (input && this.querySelectorAll('button').length === 2) {
        const minus = this.querySelectorAll('button')[0];
        const plus = this.querySelectorAll('button')[1];

        minus.addEventListener('click', function () {
          const value = parseInt(input.value, 10);
          let min = 0;

          if (allowZero) {
            min = 0;
          }

          if (value > min) {
            input.value = value - 1;
            input.dispatchEvent(new Event('change'));
          }
        });

        plus.addEventListener('click', function () {
          const value = parseInt(input.value, 10);

          input.value = value + 1;
          input.dispatchEvent(new Event('change'));
        });
      }
    }
  }
  customElements.define('legacy-quantity-input', LegacyQuantityInput);
}

document.addEventListener('DOMContentLoaded', function () {
  const accordions = document.querySelectorAll('.sb-accordions--legacy');
  accordions.forEach((item) => {
    if (!item.dataset.intiailized) {
      item.dataset.intiailized = true;
      item.addEventListener('click', function () {
        this.classList.toggle('active');
        const panel = this.nextElementSibling;
        panel.classList.toggle('show');
      });
    }
  });
});
