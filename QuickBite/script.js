/* quickbite cart + toast + theme + flying-image animation
   Place this file as script.js and include it at the bottom of every page
*/

document.addEventListener('DOMContentLoaded', () => {
  /* ---------- THEME TOGGLE ---------- */
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    const themeIcon = themeToggle.querySelector('i');
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      if (document.body.classList.contains('dark-mode')) {
        themeIcon.classList.replace('fa-moon', 'fa-sun');
      } else {
        themeIcon.classList.replace('fa-sun', 'fa-moon');
      }
    });
  }

  /* ---------- ELEMENTS ---------- */
  const cartToggle = document.getElementById('cartToggle');
  const cartSidebar = document.getElementById('cartSidebar');
  const closeCartBtn = document.getElementById('closeCart');
  const cartItemsList = document.getElementById('cartItems');
  const cartCount = document.getElementById('cartCount');
  const cartTotal = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const toastContainer = document.getElementById('toastContainer');

  /* ---------- CART STORAGE ---------- */
  const STORAGE_KEY = 'quickbite_cart_v1';
  let cart = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function formatCurrency(amount) {
    return '$' + Number(amount).toFixed(2);
  }

  /* ---------- TOAST ---------- */
  function showToast(message, type = 'success') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(12px)';
    }, 2600);
    setTimeout(() => toast.remove(), 3200);
  }

  /* ---------- CART UI ---------- */
  function updateCartUI() {
    if (!cartItemsList) return;
    cartItemsList.innerHTML = '';
    let subtotal = 0;
    cart.forEach((it, i) => {
      subtotal += it.price * it.quantity;
      const li = document.createElement('li');
      li.className = 'cart-item';
      li.dataset.index = i;
      li.innerHTML = `
        <img src="${it.image}" alt="${escapeHtml(it.name)}" />
        <div class="meta">
          <div class="name">${escapeHtml(it.name)}</div>
          <div class="controls">
            <button class="decrease" data-index="${i}">−</button>
            <div class="qty">${it.quantity}</div>
            <button class="increase" data-index="${i}">+</button>
            <button class="remove" data-index="${i}" style="margin-left:10px;color:#c33;border:none;background:transparent;cursor:pointer">Remove</button>
          </div>
        </div>
        <div class="price">${formatCurrency(it.price * it.quantity)}</div>
      `;
      cartItemsList.appendChild(li);
    });

    if (cartCount) cartCount.textContent = cart.reduce((s, it) => s + it.quantity, 0);
    if (cartTotal) cartTotal.textContent = formatCurrency(subtotal);
    saveCart();
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* ---------- ADD / REMOVE / CHANGE QTY ---------- */
  function addToCart(name, price, imageSrc) {
    const idx = cart.findIndex(it => it.name === name);
    if (idx > -1) {
      cart[idx].quantity += 1;
      showToast(`➕ Increased quantity of <b>${escapeHtml(name)}</b>`, 'success');
    } else {
      cart.push({ name, price, quantity: 1, image: imageSrc });
      showToast(`✅ Added <b>${escapeHtml(name)}</b> to cart`, 'success');
    }
    updateCartUI();
    openCart();
    setTimeout(closeCart, 900);
  }

  function removeFromCart(index) {
    if (cart[index]) {
      const removed = cart.splice(index, 1)[0];
      showToast(`❌ Removed <b>${escapeHtml(removed.name)}</b>`, 'error');
      updateCartUI();
    }
  }

  function changeQty(index, delta) {
    if (!cart[index]) return;
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
      removeFromCart(index);
    } else {
      updateCartUI();
    }
  }

  /* ---------- EVENT DELEGATION ---------- */
  if (cartItemsList) {
    cartItemsList.addEventListener('click', (e) => {
      const target = e.target;
      const idx = target.dataset.index;
      if (target.classList.contains('increase')) {
        changeQty(Number(idx), +1);
      } else if (target.classList.contains('decrease')) {
        changeQty(Number(idx), -1);
      } else if (target.classList.contains('remove')) {
        removeFromCart(Number(idx));
      }
    });
  }

  /* ---------- CART OPEN/CLOSE ---------- */
  function openCart() {
    if (!cartSidebar) return;
    cartSidebar.setAttribute('aria-hidden', 'false');
    cartSidebar.classList.add('open');
  }
  function closeCart() {
    if (!cartSidebar) return;
    cartSidebar.setAttribute('aria-hidden', 'true');
    cartSidebar.classList.remove('open');
  }

  if (cartToggle && closeCartBtn) {
    cartToggle.addEventListener('click', () => {
      const hidden = cartSidebar.getAttribute('aria-hidden') === 'true';
      if (hidden) openCart(); else closeCart();
    });
    closeCartBtn.addEventListener('click', closeCart);
  }

  /* ---------- HOOK ADD-TO-CART BUTTONS ---------- */
  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      const card = this.closest('.dish-card, .menu-item');
      if (!card) return;

      const nameEl = card.querySelector('h3, .dish-info h3, .name');
      const priceEl = card.querySelector('.price');
      const imgEl = card.querySelector('img');

      const name = nameEl ? nameEl.textContent.trim() : 'Item';
      const priceText = priceEl ? priceEl.textContent.trim().replace(/[^0-9.]/g, '') : '0';
      const price = Number(priceText) || 0;
      const imageSrc = imgEl ? (imgEl.getAttribute('src') || '') : '';

      if (imageSrc) flyToCart(imgEl, cartToggle);
      addToCart(name, price, imageSrc);
    });
  });

  /* ---------- FLYING IMAGE ANIMATION ---------- */
  function flyToCart(imgEl, cartBtn) {
    if (!imgEl || !cartBtn) return;
    const imgRect = imgEl.getBoundingClientRect();
    const cartRect = cartBtn.getBoundingClientRect();
    const flyingImg = imgEl.cloneNode(true);

    flyingImg.style.position = 'fixed';
    flyingImg.style.left = imgRect.left + 'px';
    flyingImg.style.top = imgRect.top + 'px';
    flyingImg.style.width = imgRect.width + 'px';
    flyingImg.style.height = imgRect.height + 'px';
    flyingImg.style.transition = 'transform 0.8s cubic-bezier(.65,.05,.36,1), opacity 0.8s';
    flyingImg.style.zIndex = 9999;
    flyingImg.style.borderRadius = '8px';
    flyingImg.style.boxShadow = '0 12px 30px rgba(0,0,0,0.2)';
    document.body.appendChild(flyingImg);

    requestAnimationFrame(() => {
      const translateX = cartRect.left - imgRect.left;
      const translateY = cartRect.top - imgRect.top;
      flyingImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(0.18)`;
      flyingImg.style.opacity = '0.6';
    });

    setTimeout(() => flyingImg.remove(), 900);
  }

  /* ---------- CHECKOUT ---------- */
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
      }
      cart = [];
      updateCartUI();
      showToast('Thank you! Your order has been placed (demo).', 'success');
      closeCart();
    });
  }

  /* ---------- SEARCH (DEMO) ---------- */
  const searchBtn = document.querySelector('.search-bar .search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const term = document.querySelector('.search-bar input').value.trim();
      if (!term) {
        showToast('Please enter a search term', 'error');
      } else {
        showToast(`Searching for: ${escapeHtml(term)}`);
      }
    });
  }

  /* ---------- INITIALIZE ---------- */
  updateCartUI();
});

// Ensure login/register buttons navigate correctly
document.querySelectorAll('.btn-outline, .btn-primary').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href && (href.endsWith('login.html') || href.endsWith('register.html'))) {
      // allow navigation
      window.location.href = href;
    }
  });
});
