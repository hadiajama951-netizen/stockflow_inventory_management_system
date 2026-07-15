// public/js/mobile-nav.js
//
// On small screens the sidebar is hidden by default (see the @media
// rule in style.css) to leave room for page content. This script wires
// up the hamburger button to slide it back in, and closes it again
// after picking a link or tapping outside -- so navigation is never
// stuck out of reach on a phone.

(function () {
  const toggle = document.getElementById('mobile-nav-toggle');
  const sidebar = document.getElementById('sidebar');
  if (!toggle || !sidebar) return;

  function closeSidebar() {
    sidebar.classList.remove('sidebar-open');
  }

  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    sidebar.classList.toggle('sidebar-open');
  });

  sidebar.querySelectorAll('a.nav-link').forEach(function (link) {
    link.addEventListener('click', closeSidebar);
  });

  document.addEventListener('click', function (e) {
    if (sidebar.classList.contains('sidebar-open') && !sidebar.contains(e.target) && e.target !== toggle) {
      closeSidebar();
    }
  });
})();
