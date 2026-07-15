// public/js/dropdown.js
//
// Powers every "Download" dropdown button across the system (Customers,
// Products, Staff Accounts). Click the trigger to toggle its menu;
// clicking anywhere else closes all open menus.

(function () {
  document.addEventListener('click', function (e) {
    const trigger = e.target.closest('[data-dropdown-trigger]');
    document.querySelectorAll('.dropdown-menu.dropdown-open').forEach(function (menu) {
      if (!trigger || menu !== trigger.parentElement.querySelector('.dropdown-menu')) {
        menu.classList.remove('dropdown-open');
      }
    });
    if (trigger) {
      e.preventDefault();
      const menu = trigger.parentElement.querySelector('.dropdown-menu');
      if (menu) menu.classList.toggle('dropdown-open');
    }
  });
})();
