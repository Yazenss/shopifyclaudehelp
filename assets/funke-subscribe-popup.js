(function () {
  var STORAGE_KEY = 'funke_subpop_declined';

  function popupEl() {
    return document.querySelector('[data-funke-subpop]');
  }

  function shouldOffer() {
    var el = popupEl();
    if (!el) return false;
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') return false;
    } catch (e) {}
    return true;
  }

  function showPopup() {
    var el = popupEl();
    if (!el) return;
    el.hidden = false;
    document.documentElement.classList.add('funke-subpop-open');
  }

  function hidePopup() {
    var el = popupEl();
    if (!el) return;
    el.hidden = true;
    document.documentElement.classList.remove('funke-subpop-open');
  }

  function proceedCheckout(form) {
    hidePopup();
    if (!form) {
      window.location.href = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root ? window.Shopify.routes.root : '/') + 'checkout';
      return;
    }
    // Avoid re-triggering our capture listener: temporarily mark declined for this submit
    markDeclined();
    if (typeof form.requestSubmit === 'function') {
      form.requestSubmit();
    } else {
      HTMLFormElement.prototype.submit.call(form);
    }
  }

  function markDeclined() {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch (e) {}
  }

  function addSubscriptionThenCheckout() {
    var el = popupEl();
    if (!el) {
      window.location.href = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root ? window.Shopify.routes.root : '/') + 'checkout';
      return;
    }
    var variantId = el.getAttribute('data-refill-variant-id');
    var planId = el.getAttribute('data-selling-plan-id');
    var acceptBtn = el.querySelector('[data-funke-subpop-accept]');
    if (acceptBtn) acceptBtn.disabled = true;
    var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) ? window.Shopify.routes.root : '/';

    fetch(root + 'cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        items: [{ id: Number(variantId), quantity: 1, selling_plan: Number(planId) }]
      })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('add failed');
        return r.json();
      })
      .then(function () {
        try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
        window.location.href = root + 'checkout';
      })
      .catch(function () {
        if (acceptBtn) acceptBtn.disabled = false;
        window.location.href = root + 'checkout';
      });
  }

  function onCheckoutClick(e) {
    var btn = e.target.closest('#CartDrawer-Checkout, #checkout, button[name="checkout"]');
    if (!btn) return;
    if (!shouldOffer()) return;

    var form = btn.form || document.getElementById('CartDrawer-Form') || document.getElementById('cart');
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();

    showPopup();

    var el = popupEl();
    if (!el) {
      proceedCheckout(form);
      return;
    }

    function onAccept(ev) {
      ev.preventDefault();
      cleanup();
      addSubscriptionThenCheckout();
    }
    function onDecline(ev) {
      ev.preventDefault();
      markDeclined();
      cleanup();
      proceedCheckout(form);
    }
    function cleanup() {
      el.querySelectorAll('[data-funke-subpop-accept]').forEach(function (b) {
        b.removeEventListener('click', onAccept);
      });
      el.querySelectorAll('[data-funke-subpop-decline]').forEach(function (b) {
        b.removeEventListener('click', onDecline);
      });
    }

    el.querySelectorAll('[data-funke-subpop-accept]').forEach(function (b) {
      b.addEventListener('click', onAccept);
    });
    el.querySelectorAll('[data-funke-subpop-decline]').forEach(function (b) {
      b.addEventListener('click', onDecline);
    });
  }

  document.addEventListener('click', onCheckoutClick, true);
})();
