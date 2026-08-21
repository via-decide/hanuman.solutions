document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('mobile-nav-style')) return;

  var style = document.createElement('style');
  style.id = 'mobile-nav-style';
  style.textContent = [
    '.mobile-menu-toggle{display:none;position:fixed;top:16px;right:16px;z-index:150;background:rgba(10,5,2,0.7);border:1px solid rgba(255,103,0,0.3);color:#F2E8DE;font-size:1.5rem;cursor:pointer;padding:8px 10px;border-radius:6px;line-height:1;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}',
    '@media(max-width:840px){.mobile-menu-toggle{display:block}}',
    '.mobile-nav-overlay{position:fixed;inset:0;z-index:9999;background:rgba(10,5,2,0.95);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);display:flex;flex-direction:column;justify-content:center;align-items:center;padding:5rem 1.25rem 2rem;opacity:0;pointer-events:none;transition:opacity 0.3s ease;overflow-y:auto}',
    '@media(max-width:840px){.fixed-nav-bar{display:none!important}}',
    '.mobile-nav-overlay.is-active{opacity:1;pointer-events:auto}',
    '.mobile-nav-overlay a{font-family:"Outfit",sans-serif;font-size:1.4rem;font-weight:600;color:#F2E8DE;margin:0.55rem 0;min-height:44px;display:inline-flex;align-items:center;text-transform:uppercase;letter-spacing:0.06em;transition:color 0.2s;text-decoration:none}',
    '.mobile-nav-overlay a:hover{color:#FF6700}',
    '.mobile-nav-overlay a.accent-link{color:#FF6700}',
    '.mobile-nav-close{position:absolute;top:1.5rem;right:1.5rem;background:none;border:none;color:#F2E8DE;font-size:2rem;cursor:pointer;line-height:1}'
  ].join('\n');
  document.head.appendChild(style);

  var toggle = document.createElement('button');
  toggle.className = 'mobile-menu-toggle';
  toggle.setAttribute('aria-label', 'Open mobile menu');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'mobile-nav-overlay');
  toggle.textContent = '☰';
  document.body.appendChild(toggle);

  var overlay = document.createElement('div');
  overlay.className = 'mobile-nav-overlay';
  overlay.id = 'mobile-nav-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('inert', '');
  overlay.innerHTML = [
    '<button class="mobile-nav-close" aria-label="Close menu">×</button>',
    '<a href="#s1">Proof</a>',
    '<a href="#s2">Pricing</a>',
    '<a href="#s3">Compliance</a>',
    '<a href="#s4">Contact</a>',
    '<a href="#s2" class="accent-link" id="mobile-book-audit">Book Audit →</a>',
    '<a href="https://daxini.xyz" style="margin-top:1.5rem;font-size:1rem;color:#A89F95">Daxini Ecosystem →</a>'
  ].join('');
  document.body.appendChild(overlay);

  var closeBtn = overlay.querySelector('.mobile-nav-close');

  function open() {
    overlay.classList.add('is-active');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.removeAttribute('inert');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function close() {
    overlay.classList.remove('is-active');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('inert', '');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    toggle.focus();
  }

  toggle.addEventListener('click', open);
  closeBtn.addEventListener('click', close);

  var bookAuditBtn = document.getElementById('mobile-book-audit');
  if (bookAuditBtn) {
    bookAuditBtn.addEventListener('click', function(e) {
      e.preventDefault();
      close();
      if (typeof bookArchAudit === 'function') bookArchAudit();
    });
  }

  document.addEventListener('keydown', function(e) {
    if (!overlay.classList.contains('is-active')) return;
    if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
    if (e.key === 'Tab') {
      var focusable = overlay.querySelectorAll('button, a[href]');
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
  });
  overlay.querySelectorAll('a').forEach(function(a) {
    if (a.id !== 'mobile-book-audit') a.addEventListener('click', close);
  });
});
