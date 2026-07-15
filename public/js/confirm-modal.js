// public/js/confirm-modal.js
//
// Reusable high-contrast confirmation modal for destructive "Delete All"
// style actions. Attach it to any <form> or <button> by adding:
//   data-confirm-modal="Delete All Customers?"
//   data-confirm-detail="This permanently removes every customer. This cannot be undone."
// Forms submit normally after the user confirms; buttons fire a
// "confirmed" CustomEvent that other scripts can listen for.

(function () {
  function buildModal() {
    if (document.getElementById('confirm-modal-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'confirm-modal-overlay';
    overlay.className = 'confirm-modal-overlay';
    overlay.innerHTML = `
      <div class="confirm-modal-box" role="alertdialog" aria-modal="true">
        <div class="confirm-modal-warning-icon">!</div>
        <h3 id="confirm-modal-title"></h3>
        <p id="confirm-modal-detail"></p>
        <div class="confirm-modal-actions">
          <button type="button" class="btn btn-secondary" id="confirm-modal-cancel">Cancel</button>
          <button type="button" class="btn btn-danger" id="confirm-modal-ok">Yes, Delete Everything</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  let pendingEl = null;

  function openModal(title, detail, el) {
    buildModal();
    pendingEl = el;
    document.getElementById('confirm-modal-title').textContent = title;
    document.getElementById('confirm-modal-detail').textContent = detail || 'This action cannot be undone.';
    document.getElementById('confirm-modal-overlay').classList.add('confirm-modal-open');
  }

  function closeModal() {
    const overlay = document.getElementById('confirm-modal-overlay');
    if (overlay) overlay.classList.remove('confirm-modal-open');
    pendingEl = null;
  }

  document.addEventListener('click', function (e) {
    const trigger = e.target.closest('[data-confirm-modal]');
    if (trigger) {
      e.preventDefault();
      openModal(trigger.dataset.confirmModal, trigger.dataset.confirmDetail, trigger);
      return;
    }
    if (e.target.id === 'confirm-modal-cancel' || e.target.id === 'confirm-modal-overlay') {
      closeModal();
      return;
    }
    if (e.target.id === 'confirm-modal-ok') {
      const el = pendingEl;
      closeModal();
      if (!el) return;
      if (el.tagName === 'FORM') {
        el.submit();
      } else if (el.closest('form')) {
        el.closest('form').submit();
      } else {
        el.dispatchEvent(new CustomEvent('confirmed'));
      }
    }
  });

  // If the trigger element itself is a form (data attribute on the form tag),
  // stop its native submit and route it through the modal instead.
  document.addEventListener(
    'submit',
    function (e) {
      const form = e.target;
      if (form.hasAttribute && form.hasAttribute('data-confirm-modal') && !form.dataset.confirmed) {
        e.preventDefault();
        openModal(form.dataset.confirmModal, form.dataset.confirmDetail, form);
      }
    },
    true
  );
})();
