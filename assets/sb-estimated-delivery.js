if (!customElements.get('estimated-delivery')) {
  class EstimatedDelivery extends HTMLElement {
    constructor() {
      super();
      this.max_days = this.dataset.maxDays ? Number(this.dataset.maxDays) : 0;
      this.min_days = this.dataset.minDays ? Number(this.dataset.minDays) : 0;
      this.max_date = this.querySelector('[data-estimated-delivery="max-delivery-date"]');
      this.min_date = this.querySelector('[data-estimated-delivery="min-delivery-date"]');
      this.time_to_eod = this.querySelector('[data-estimated-delivery="time-to-eod"]');
    }

    connectedCallback() {
      if (this.max_date || this.min_date || this.time_to_eod) {
        this.setDates();
      }
    }

    setDates() {
      const today = new Date();
      if (this.min_days > 0 && this.min_date) {
        const date = this.addDays(today, this.min_days);
        this.min_date.innerHTML = this.getDateString(date);
      }
      if (this.max_days > 0 && this.max_date) {
        const date = this.addDays(today, this.max_days);
        this.max_date.innerHTML = this.getDateString(date);
      }
      if (this.time_to_eod) {
        this.getTimeToEOD();
      }
    }

    getDateString(date) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
    }

    getTimeToEOD() {
      const t = this;
      const today = new Date();
      const eod = new Date(new Date().setHours(23, 59, 59, 999));
      const distance = eod.getTime() - today.getTime();
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      this.time_to_eod.innerHTML = `${hours}h and ${minutes} minutes`;
      setTimeout(() => {
        t.getTimeToEOD();
      }, 60000);
    }

    addDays(date, days) {
      let result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    }
  }
  customElements.define('estimated-delivery', EstimatedDelivery);
}
