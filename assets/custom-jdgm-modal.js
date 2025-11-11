(function () {
  const WIDGET_SELECTOR = '.jdgm-review-widget';
  const FORM_WRAPPER_SELECTOR = `${WIDGET_SELECTOR} .jdgm-form-wrapper`;
  const WRITE_BTN_SELECTOR = `${WIDGET_SELECTOR} .jdgm-write-rev-link`;
  const CANCEL_BTN_SELECTOR = `${WIDGET_SELECTOR} .jdgm-form-wrapper .jdgm-cancel-rev`;
  const FORM_TITLE_SELECTOR = `${WIDGET_SELECTOR} .jdgm-form .jdgm-form__title`;
  const OPEN_CLASS = 'form-open';

  const body = document.body;
  let tokenCheckDone = false; // Flag to run token check only once
  const urlParams = new URLSearchParams(window.location.search);

  function setFormState(isOpen) {
    const formWrapper = document.querySelector(FORM_WRAPPER_SELECTOR);
    if (formWrapper) {
      formWrapper.classList.toggle(OPEN_CLASS, isOpen);
      body.classList.toggle(OPEN_CLASS, isOpen);
    }
  }

  function toggleReviewFormClasses() {
    const formWrapper = document.querySelector(FORM_WRAPPER_SELECTOR);
    if (formWrapper) {
      const isOpen = formWrapper.classList.contains(OPEN_CLASS);
      setFormState(!isOpen);
    }
  }

  function closeReviewFormClasses() {
    setFormState(false);
  }

  function bindReviewEvents() {
    const writeBtn = document.querySelector(WRITE_BTN_SELECTOR);

    if (!writeBtn || writeBtn.dataset.bound === 'true') return;

    writeBtn.dataset.bound = 'true';

    writeBtn.addEventListener('click', function () {
      setTimeout(toggleReviewFormClasses, 100);
    });
  }

  body.addEventListener('click', function (e) {
    const cancelBtn = e.target.closest(CANCEL_BTN_SELECTOR);
    const formTitle = e.target.closest(FORM_TITLE_SELECTOR);

    if (cancelBtn || formTitle) {
      closeReviewFormClasses();
      const cancelBtn = document.querySelector(CANCEL_BTN_SELECTOR);
      if (cancelBtn) {
        cancelBtn.click();
      }
    }
  });

  function checkForJudgeMeToken() {
    if (urlParams.get('judgeme_token') === 'true') {
      toggleReviewFormClasses();
    }
  }

  function setupWidget() {
    setTimeout(() => {
      bindReviewEvents();
      checkForJudgeMeToken();
    }, 1000);
  }

  document.addEventListener('jdgm.doneSetup', setupWidget);
})();
