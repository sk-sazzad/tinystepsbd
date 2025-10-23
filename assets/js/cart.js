// Cart Management for Tiny Steps BD

// Cart Functions
function initializeCart() {
    loadCartFromStorage();
    updateCartUI();
    
    // Event Listeners for cart
    const cartIcon = document.getElementById('cartIcon');
    const closeCart = document.getElementById('closeCart');
    const overlay = document.getElementById('overlay');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (cartIcon) cartIcon.addEventListener('click', toggleCart);
    if (closeCart) closeCart.addEventListener('click', toggleCart);
    if (overlay) overlay.addEventListener('click', toggleCart);
    if (checkoutBtn) checkoutBtn.addEventListener('click', proceedToCheckout);
}

function loadCartFromStorage() {
    const savedCart = loadFromLocalStorage('cart');
    if (savedCart) {
        cart = savedCart;
    }
}

function saveCartToStorage() {
    saveToLocalStorage('cart', cart);
}

function addToCart(productId) {
    const product = getProductById(productId);
    if (!product) {
        showNotification('প্রোডাক্টটি পাওয়া যায়নি', 'error');
        return;
    }

    const price = parseInt(product['Price (BDT)']) || 0;
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
        showNotification(`${product.Name} - সংখ্যা বাড়ানো হয়েছে`);
    } else {
        cart.push({
            id: productId,
            name: product.Name,
            price: price,
            image: product['Main Image'] || product.Image1 || 'assets/images/placeholder.jpg',
            quantity: 1
        });
        showNotification(`${product.Name} - কার্টে যোগ করা হয়েছে`);
    }

    updateCartUI();
    saveCartToStorage();
}

function removeFromCart(productId) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
        const removedItem = cart[itemIndex];
        cart.splice(itemIndex, 1);
        showNotification(`${removedItem.name} - কার্ট থেকে সরানো হয়েছে`, 'warning');
        updateCartUI();
        saveCartToStorage();
    }
}

function updateCartItemQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            updateCartUI();
            saveCartToStorage();
        }
    }
}

function clearCart() {
    cart = [];
    updateCartUI();
    saveCartToStorage();
    showNotification('কার্ট খালি করা হয়েছে', 'warning');
}

function updateCartUI() {
    updateCartCount();
    updateCartModal();
    updateCartPage();
    updateCheckoutPage();
}

function updateCartCount() {
    const cartCountElements = document.querySelectorAll('.cart-count');
    const totalItems = getCartItemCount();
    
    cartCountElements.forEach(element => {
        element.textContent = totalItems;
        
        // Add animation when items change
        if (parseInt(element.textContent) !== totalItems) {
            element.classList.add('pulse');
            setTimeout(() => element.classList.remove('pulse'), 500);
        }
    });
}

function updateCartModal() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (cartItems && cartTotal) {
        cartItems.innerHTML = '';
        
        if (cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <div class="empty-cart-icon">🛒</div>
                    <p>আপনার কার্ট খালি</p>
                    <a href="shop.html" class="btn">শপিং করুন</a>
                </div>
            `;
            cartTotal.textContent = 'মোট: ৳0';
            return;
        }
        
        let total = 0;
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            cartItems.innerHTML += `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image" 
                         onerror="this.src='assets/images/placeholder.jpg'">
                    <div class="cart-item-details">
                        <div class="cart-item-title">${truncateText(item.name, 30)}</div>
                        <div class="cart-item-price">${formatPrice(item.price)} × ${item.quantity} = ${formatPrice(itemTotal)}</div>
                        <div class="cart-item-actions">
                            <button class="quantity-btn" data-id="${item.id}" data-action="decrease">-</button>
                            <span class="quantity-display">${item.quantity}</span>
                            <button class="quantity-btn" data-id="${item.id}" data-action="increase">+</button>
                            <button class="remove-btn" data-id="${item.id}">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        cartTotal.textContent = `মোট: ${formatPrice(total)}`;
        
        // Add event listeners
        document.querySelectorAll('.quantity-btn').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                const action = this.getAttribute('data-action');
                const item = cart.find(item => item.id === productId);
                
                if (item) {
                    if (action === 'increase') {
                        updateCartItemQuantity(productId, item.quantity + 1);
                    } else if (action === 'decrease') {
                        updateCartItemQuantity(productId, item.quantity - 1);
                    }
                }
            });
        });
        
        document.querySelectorAll('.remove-btn').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                removeFromCart(productId);
            });
        });
    }
}

function updateCartPage() {
    const cartPageItems = document.getElementById('cartPageItems');
    const subtotalElement = document.getElementById('subtotal');
    const deliveryFeeElement = document.getElementById('deliveryFee');
    const totalAmountElement = document.getElementById('totalAmount');
    
    if (cartPageItems && subtotalElement) {
        cartPageItems.innerHTML = '';
        
        if (cart.length === 0) {
            cartPageItems.innerHTML = `
                <div class="empty-cart-page">
                    <div class="empty-cart-icon">🛒</div>
                    <h3>আপনার কার্ট খালি</h3>
                    <p>শপিং শুরু করতে আমাদের প্রোডাক্ট ব্রাউজ করুন</p>
                    <a href="shop.html" class="btn">শপিং শুরু করুন</a>
                </div>
            `;
            subtotalElement.textContent = '৳0';
            deliveryFeeElement.textContent = '৳0';
            totalAmountElement.textContent = '৳0';
            return;
        }
        
        let subtotal = 0;
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            cartPageItems.innerHTML += `
                <div class="cart-page-item">
                    <div class="item-image">
                        <img src="${item.image}" alt="${item.name}" 
                             onerror="this.src='assets/images/placeholder.jpg'">
                    </div>
                    <div class="item-details">
                        <h4 class="item-title">${item.name}</h4>
                        <div class="item-price">${formatPrice(item.price)}</div>
                    </div>
                    <div class="item-quantity">
                        <button class="quantity-btn" data-id="${item.id}" data-action="decrease">-</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn" data-id="${item.id}" data-action="increase">+</button>
                    </div>
                    <div class="item-total">${formatPrice(itemTotal)}</div>
                    <button class="item-remove" data-id="${item.id}">
                        <span>❌</span>
                    </button>
                </div>
            `;
        });
        
        const deliveryFee = calculateDeliveryFee();
        const total = subtotal + deliveryFee;
        
        subtotalElement.textContent = formatPrice(subtotal);
        deliveryFeeElement.textContent = formatPrice(deliveryFee);
        totalAmountElement.textContent = formatPrice(total);
        
        // Add event listeners
        document.querySelectorAll('.quantity-btn').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                const action = this.getAttribute('data-action');
                const item = cart.find(item => item.id === productId);
                
                if (item) {
                    if (action === 'increase') {
                        updateCartItemQuantity(productId, item.quantity + 1);
                    } else if (action === 'decrease') {
                        updateCartItemQuantity(productId, item.quantity - 1);
                    }
                }
            });
        });
        
        document.querySelectorAll('.item-remove').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                removeFromCart(productId);
            });
        });
    }
}

function updateCheckoutPage() {
    const checkoutOrderItems = document.getElementById('checkoutOrderItems');
    const checkoutSubtotal = document.getElementById('checkoutSubtotal');
    const checkoutDelivery = document.getElementById('checkoutDelivery');
    const checkoutTotal = document.getElementById('checkoutTotal');
    
    if (checkoutOrderItems && checkoutSubtotal) {
        checkoutOrderItems.innerHTML = '';
        
        if (cart.length === 0) {
            checkoutOrderItems.innerHTML = '<p>কার্ট খালি</p>';
            checkoutSubtotal.textContent = '৳0';
            checkoutDelivery.textContent = '৳0';
            checkoutTotal.textContent = '৳0';
            return;
        }
        
        let subtotal = 0;
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            checkoutOrderItems.innerHTML += `
                <div class="checkout-item">
                    <div class="checkout-item-image">
                        <img src="${item.image}" alt="${item.name}" 
                             onerror="this.src='assets/images/placeholder.jpg'">
                    </div>
                    <div class="checkout-item-details">
                        <div class="checkout-item-name">${truncateText(item.name, 25)}</div>
                        <div class="checkout-item-meta">
                            <span>${formatPrice(item.price)} × ${item.quantity}</span>
                        </div>
                    </div>
                    <div class="checkout-item-total">${formatPrice(itemTotal)}</div>
                </div>
            `;
        });
        
        const deliveryFee = calculateDeliveryFee();
        const total = subtotal + deliveryFee;
        
        checkoutSubtotal.textContent = formatPrice(subtotal);
        checkoutDelivery.textContent = formatPrice(deliveryFee);
        checkoutTotal.textContent = formatPrice(total);
    }
}

function toggleCart() {
    const cartModal = document.getElementById('cartModal');
    const overlay = document.getElementById('overlay');
    
    if (cartModal && overlay) {
        const isOpen = cartModal.classList.contains('open');
        
        if (isOpen) {
            cartModal.classList.remove('open');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        } else {
            cartModal.classList.add('open');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
}

function proceedToCheckout() {
    if (cart.length === 0) {
        showNotification('আপনার কার্ট খালি!', 'error');
        toggleCart();
        return;
    }
    
    // Redirect to checkout page
    window.location.href = 'checkout.html';
}

function loadCartPage() {
    updateCartPage();
    
    // Add event listener for proceed to checkout button
    const proceedBtn = document.getElementById('proceedToCheckout');
    if (proceedBtn) {
        proceedBtn.addEventListener('click', function() {
            if (cart.length === 0) {
                showNotification('আপনার কার্ট খালি!', 'error');
                return;
            }
            window.location.href = 'checkout.html';
        });
    }
}

function calculateDeliveryFee(area = '') {
    // Default to inside Dhaka for calculation
    return area.toLowerCase().includes('dhaka') || !area ? 80 : 150;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeCart,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        updateCartUI,
        toggleCart,
        proceedToCheckout,
        loadCartPage
    };
}