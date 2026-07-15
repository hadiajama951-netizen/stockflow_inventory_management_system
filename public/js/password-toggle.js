// public/js/password-toggle.js
//
// Automatically adds a "Show/Hide" eye toggle button to every password
// input on every page (login, add staff, change password, etc). New
// password fields added later (in any form, anywhere) get the toggle
// automatically too -- there's nothing to wire up per-page.

(function () {
  function addEyeIcon(button, hidden) {
    // Simple inline SVG eye / eye-slash icon, no external assets needed.
    button.innerHTML = hidden
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
  }

  function wrapField(input) {
    if (input.dataset.toggleWrapped) return;
    input.dataset.toggleWrapped = 'true';

    const wrap = document.createElement('div');
    wrap.className = 'password-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'password-toggle-btn';
    btn.setAttribute('aria-label', 'Show password');
    btn.tabIndex = -1;
    addEyeIcon(btn, true);
    wrap.appendChild(btn);

    btn.addEventListener('click', function () {
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
      addEyeIcon(btn, !isHidden);
    });
  }

  function scan() {
    document.querySelectorAll('input[type="password"]').forEach(wrapField);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }

  // Also catch password fields added dynamically after page load
  // (e.g. a form injected by another script).
  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
