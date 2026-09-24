(function () {
  if (window.__funkeSubpopInit) return;
  window.__funkeSubpopInit = true;

  var STORAGE_KEY = 'funke_subpop_declined';
  var STARTER_ID = 8782419525810;
  var REFILL_ID = 8782421131442;
  var PLAN_ID = 8502608050;
  var skipNextIntercept = false;
  var pendingForm = null;

  function rootPath() {
    return window.Shopify && window.Shopify.routes && window.Shopify.routes.root
      ? window.Shopify.routes.root
      : '/';
  }

  function popupEl() {
    return document.querySelector('[data-funke-subpop]');
  }

  function variantMap(el) {
    return {
      RIVIERA: Number(el.getAttribute('data-variant-riviera') || 47355263713458),
      MONACO: Number(el.getAttribute('data-variant-monaco') || 47355263746226)
    };
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

  function cartFingerprint(cart) {
    try {
      return (cart.items || [])
        .map(function (i) {
          return i.product_id + ':' + i.variant_id + ':' + (i.selling_plan_allocation && i.selling_plan_allocation.selling_plan
            ? i.selling_plan_allocation.selling_plan.id
            : '') + ':' + i.quantity;
        })
        .join('|');
    } catch (e) {
      return String(Date.now());
    }
  }

  function wasDeclinedFor(cart) {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === cartFingerprint(cart);
    } catch (e) {
      return false;
    }
  }

  function markDeclined(cart) {
    try {
      sessionStorage.setItem(STORAGE_KEY, cartFingerprint(cart));
    } catch (e) {}
  }

  function clearDeclined() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  function analyzeCart(cart) {
    var starter = null;
    var hasRefillSub = false;
    (cart.items || []).forEach(function (item) {
      if (item.product_id === STARTER_ID || (item.handle && item.handle === 'funke-starter-kit')) {
        starter = item;
      }
      if (
        (item.product_id === REFILL_ID || (item.handle && item.handle === 'funke-cotton-pad-refill')) &&
        item.selling_plan_allocation
      ) {
        hasRefillSub = true;
      }
    });
    return { starter: starter, hasRefillSub: hasRefillSub, shouldOffer: !!(starter && !hasRefillSub) };
  }

  function matchRefillVariantId(el, starterItem) {
    var map = variantMap(el);
    var title = ((starterItem && (starterItem.variant_title || starterItem.product_title)) || '').toUpperCase();
    if (title.indexOf('MONACO') !== -1) return map.MONACO;
    if (title.indexOf('RIVIERA') !== -1) return map.RIVIERA;
    // option / scent property fallback
    var opts = (starterItem && starterItem.variant_options) || [];
    for (var i = 0; i < opts.length; i++) {
      var o = String(opts[i] || '').toUpperCase();
      if (o.indexOf('MONACO') !== -1) return map.MONACO;
      if (o.indexOf('RIVIERA') !== -1) return map.RIVIERA;
    }
    return map.RIVIERA;
  }

  function fetchCart() {
    return fetch(rootPath() + 'cart.js', { credentials: 'same-origin', headers: { Accept: 'application/json' } }).then(
      function (r) {
        if (!r.ok) throw new Error('cart');
        return r.json();
      }
    );
  }

  function proceedCheckout(form) {
    hidePopup();
    skipNextIntercept = true;
    if (!form) {
      window.location.href = rootPath() + 'checkout';
      return;
    }
    if (typeof form.requestSubmit === 'function') {
      form.requestSubmit();
    } else {
      HTMLFormElement.prototype.submit.call(form);
    }
  }

  function addSubscriptionThenCheckout(variantId) {
    var el = popupEl();
    var acceptBtn = el && el.querySelector('[data-funke-subpop-accept]');
    if (acceptBtn) acceptBtn.disabled = true;
    var planId = Number((el && el.getAttribute('data-selling-plan-id')) || PLAN_ID);
    var root = rootPath();

    fetch(root + 'cart/add.js', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        items: [{ id: Number(variantId), quantity: 1, selling_plan: planId }]
      })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('add failed');
        return r.json();
      })
      .then(function () {
        clearDeclined();
        window.location.href = root + 'checkout';
      })
      .catch(function () {
        if (acceptBtn) acceptBtn.disabled = false;
        // Still let them check out with kit only if add fails
        proceedCheckout(pendingForm);
      });
  }

  function bindPopupActions(cart) {
    var el = popupEl();
    if (!el) {
      proceedCheckout(pendingForm);
      return;
    }

    function onAccept(ev) {
      ev.preventDefault();
      cleanup();
      var vid = matchRefillVariantId(el, analyzeCart(cart).starter);
      addSubscriptionThenCheckout(vid);
    }
    function onDecline(ev) {
      ev.preventDefault();
      markDeclined(cart);
      cleanup();
      proceedCheckout(pendingForm);
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

  function interceptCheckout(form, nativeEvent) {
    if (skipNextIntercept) {
      skipNextIntercept = false;
      return;
    }
    if (!popupEl()) return;

    if (nativeEvent) {
      nativeEvent.preventDefault();
      nativeEvent.stopPropagation();
      if (typeof nativeEvent.stopImmediatePropagation === 'function') nativeEvent.stopImmediatePropagation();
    }

    pendingForm = form;
    fetchCart()
      .then(function (cart) {
        var info = analyzeCart(cart);
        if (!info.shouldOffer || wasDeclinedFor(cart)) {
          proceedCheckout(form);
          return;
        }
        showPopup();
        bindPopupActions(cart);
      })
      .catch(function () {
        proceedCheckout(form);
      });
  }

  function onCheckoutClick(e) {
    var btn = e.target.closest(
      '#CartDrawer-Checkout, #checkout, button[name="checkout"], input[name="checkout"], [name="checkout"]'
    );
    if (!btn) return;
    // Ignore popup's own buttons
    if (btn.closest('[data-funke-subpop]')) return;
    var form =
      btn.form ||
      document.getElementById('CartDrawer-Form') ||
      document.getElementById('cart') ||
      btn.closest('form');
    interceptCheckout(form, e);
  }

  function onCheckoutSubmit(e) {
    var form = e.target;
    if (!form || !form.matches) return;
    if (!(form.id === 'CartDrawer-Form' || form.id === 'cart' || form.getAttribute('action') === '/cart')) return;
    // Only intercept when checkout is the submitter intent
    var submitter = e.submitter;
    if (submitter && submitter.name && submitter.name !== 'checkout') return;
    interceptCheckout(form, e);
  }

  document.addEventListener('click', onCheckoutClick, true);
  document.addEventListener('submit', onCheckoutSubmit, true);
})();
