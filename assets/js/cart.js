/**
 * TinyStepsBD - Cart Management
 * Add to Cart, Quantity, LocalStorage management
 */

class CartManager {
    constructor() {
        this.cart = [];
        this.init();
    }

    init() {
        this.loadCart();
        this.setupEventListeners();
        this.updateCartDisplay();
    }

    // Load cart from localStorage
    loadCart() {
        this.cart = Storage.getCart();
    }

    // Save cart to localStorage
    saveCart() {
        Storage.saveCart(this.cart);
        this.updateCartDisplay();
    }

    // Setup event listeners
    setupEventListeners() {
        // Add to cart events are handled in app.js
        // This file focuses on cart page functionality
        
        // Quantity changes
        DOM.on('click', '.quantity-btn', (e) => this.handleQuantityChange(e));
        DOM.on('change', '.quantity-input', (e) => this.handleQuantityInput(e));
        
        // Remove items
        DOM.on('click', '.remove-btn', (e) => this.removeItem(e));
        
        // Update cart
        DOM.on('click', '#update-cart', () => this.updateCart());
        
        // Proceed to checkout
        DOM.on('click', '#proceed-checkout', () => this.proceedToCheckout());
        DOM.on('click', '#checkout-btn', () => this.proceedToCheckout());
        
        // Apply coupon
        DOM.on('click', '#apply-coupon', () => this.applyCoupon());
        
        // Delivery option changes
        DOM.on('change', 'input[name="delivery"]', () => this.updateOrderSummary());
    }

    // Add item to cart
    addItem(productId, quantity = 1, color = '', size = '') {
        // This method would be called from product pages
        // Implementation would find the product and add to cart
    }

    // Handle quantity button clicks
    handleQuantityChange(e) {
        const button = e.target.closest('.quantity-btn');
        const itemId = button.dataset.id;
        const isIncrease = button.classList.contains('increase');
        
        this.updateQuantity(itemId, isIncrease);
    }

    // Handle quantity input changes
    handleQuantityInput(e) {
        const input = e.target;
        const itemId = input.dataset.id;
        const quantity = parseInt(input.value);
        
        if (quantity >= 1 && quantity <= 10) {
            this.updateItemQuantity(itemId, quantity);
        } else {
            input.value = 1;
            this.updateItemQuantity(itemId, 1);
        }
    }

    // Update quantity (increase/decrease)
    updateQuantity(itemId, isIncrease) {
        const item = this.cart.find(item => item.id === itemId);
        if (!item) return;

        if (isIncrease) {
            if (item.quantity < item.maxQuantity) {
                item.quantity++;
            } else {
                Notify.warning(`সর্বোচ্চ ${item.maxQuantity}টি পণ্য অর্ডার করা যাবে।`);
                return;
            }
        } else {
            if (item.quantity > 1) {
                item.quantity--;
            } else {
                this.removeItemById(itemId);
                return;
            }
        }

        this.saveCart();
        this.updateCartPage();
    }

    // Update specific item quantity
    updateItemQuantity(itemId, quantity) {
        const item = this.cart.find(item => item.id === itemId);
        if (item) {
            item.quantity = quantity;
            this.saveCart();
            this.updateCartPage();
        }
    }

    // Remove item from cart
    removeItem(e) {
        const button = e.target.closest('.remove-btn');
        const itemId = button.dataset.id;
        
        this.removeItemById(itemId);
    }

    // Remove item by ID
    removeItemById(itemId) {
        if (confirm('আপনি কি নিশ্চিত যে আপনি এই পণ্যটি কার্ট থেকে সরাতে চান?')) {
            this.cart = this.cart.filter(item => item.id !== itemId);
            this.saveCart();
            this.updateCartPage();
            Notify.success('পণ্যটি কার্ট থেকে সরানো হয়েছে।');
        }
    }

    // Update cart page display
    updateCartPage() {
        this.renderCartItems();
        this.updateOrderSummary();
        this.updateCartCount();
    }

    // Render cart items
    renderCartItems() {
        const cartContainer = DOM.get('#cart-content');
        if (!cartContainer) return;

        if (this.cart.length === 0) {
            this.showEmptyCart();
            return;
        }

        this.showCartItems();
    }

    // Show empty cart state
    showEmptyCart() {
        const emptyCart = DOM.get('#empty-cart');
        const cartItemsList = DOM.get('#cart-items-list');
        const cartActions = DOM.get('#cart-actions');

        if (emptyCart) DOM.show(emptyCart);
        if (cartItemsList) DOM.hide(cartItemsList);
        if (cartActions) DOM.hide(cartActions);

        // Update items count
        const itemsCount = DOM.get('#cart-items-count');
        if (itemsCount) itemsCount.textContent = '০টি পণ্য';
    }

    // Show cart with items
    showCartItems() {
        const emptyCart = DOM.get('#empty-cart');
        const cartItemsList = DOM.get('#cart-items-list');
        const cartActions = DOM.get('#cart-actions');
        const cartTableBody = DOM.get('#cart-table-body');

        if (emptyCart) DOM.hide(emptyCart);
        if (cartItemsList) DOM.show(cartItemsList);
        if (cartActions) DOM.show(cartActions);

        // Update items count
        const itemsCount = DOM.get('#cart-items-count');
        if (itemsCount) itemsCount.textContent = `${this.cart.length}টি পণ্য`;

        // Render cart items
        if (cartTableBody) {
            cartTableBody.innerHTML = this.cart.map(item => this.createCartItemRow(item)).join('');
        }
    }

    // Create cart item row HTML
    createCartItemRow(item) {
        return `
            <div class="cart-item" data-id="${item.id}">
                <div class="col-product">
                    <div class="product-info">
                        <div class="product-image">
                            <img src="${item.image}" alt="${item.name}" onerror="ImageUtils.handleImageError(event)">
                        </div>
                        <div class="product-details">
                            <h4 class="product-name">${item.name}</h4>
                            <div class="product-variants">
                                ${item.color ? `<span class="variant">রং: ${item.color}</span>` : ''}
                                ${item.size ? `<span class="variant">সাইজ: ${item.size}</span>` : ''}
                            </div>
                            <div class="product-mobile-price">
                                ${Format.price(item.price)}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-price">
                    <span class="product-price">${Format.price(item.price)}</span>
                </div>
                <div class="col-quantity">
                    <div class="quantity-selector">
                        <button type="button" class="quantity-btn decrease" data-id="${item.id}">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="${item.maxQuantity}" data-id="${item.id}">
                        <button type="button" class="quantity-btn increase" data-id="${item.id}">+</button>
                    </div>
                </div>
                <div class="col-total">
                    <span class="item-total">${Format.price(item.price * item.quantity)}</span>
                </div>
                <div class="col-actions">
                    <button class="remove-btn" data-id="${item.id}" title="পণ্য সরান">
                        <img src="assets/images/icons/ui/close.png" alt="সরান" onerror="this.src='assets/images/placeholder.jpg'">
                    </button>
                </div>
            </div>
        `;
    }

    // Update order summary
    updateOrderSummary() {
        const subtotal = this.calculateSubtotal();
        const deliveryCharge = this.getDeliveryCharge();
        const discount = this.getDiscountAmount();
        const total = subtotal + deliveryCharge - discount;

        // Update summary elements
        const subtotalElement = DOM.get('#subtotal-amount');
        const deliveryElement = DOM.get('#delivery-charge');
        const discountElement = DOM.get('#discount-amount');
        const totalElement = DOM.get('#total-amount');

        if (subtotalElement) subtotalElement.textContent = Format.price(subtotal);
        if (deliveryElement) deliveryElement.textContent = Format.price(deliveryCharge);
        if (discountElement) discountElement.textContent = `-${Format.price(discount)}`;
        if (totalElement) totalElement.textContent = Format.price(total);
    }

    // Calculate subtotal
    calculateSubtotal() {
        return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    // Get delivery charge
    getDeliveryCharge() {
        const selectedOption = DOM.get('input[name="delivery"]:checked');
        if (!selectedOption) return 0;

        const area = selectedOption.value;
        const subtotal = this.calculateSubtotal();

        return Currency.calculateDelivery(area, subtotal);
    }

    // Get discount amount
    getDiscountAmount() {
        // This would calculate discount based on applied coupon
        // For now, return 0
        return 0;
    }

    // Apply coupon code
    applyCoupon() {
        const couponCode = DOM.get('#coupon-code')?.value.trim();
        const messageElement = DOM.get('#coupon-message');

        if (!couponCode) {
            this.showCouponMessage('দয়া করে একটি কুপন কোড লিখুন', 'error');
            return;
        }

        // Simulate coupon validation
        const validCoupons = {
            'TINY10': 0.1,  // 10% discount
            'TINYSTEP5': 0.05, // 5% discount
            'WELCOME15': 0.15 // 15% discount
        };

        if (validCoupons[couponCode]) {
            const discountRate = validCoupons[couponCode];
            const subtotal = this.calculateSubtotal();
            const discount = Math.round(subtotal * discountRate);
            
            this.showCouponMessage(`কুপন সফলভাবে অ্যাপ্লাই করা হয়েছে! ${discountRate * 100}% ডিসকাউন্ট প্রয়োগ করা হয়েছে।`, 'success');
            // Here you would store the applied coupon and discount
        } else {
            this.showCouponMessage('অবৈধ কুপন কোড। দয়া করে সঠিক কোড লিখুন।', 'error');
        }
    }

    // Show coupon message
    showCouponMessage(message, type) {
        const messageElement = DOM.get('#coupon-message');
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.className = `coupon-message ${type}`;
        }
    }

    // Update cart
    updateCart() {
        // This would save any changes made to the cart
        this.saveCart();
        Notify.success('কার্ট সফলভাবে আপডেট করা হয়েছে!');
    }

    // Proceed to checkout
    proceedToCheckout() {
        if (this.cart.length === 0) {
            Notify.error('আপনার কার্ট খালি। চেকআউট করতে পণ্য যোগ করুন।');
            return;
        }

        // Validate all items have color and size selected
        const invalidItems = this.cart.filter(item => !item.color || !item.size);
        
        if (invalidItems.length > 0) {
            Notify.error('দয়া করে সকল পণ্যের রং এবং সাইজ নির্বাচন করুন।');
            return;
        }

        // Redirect to checkout page
        window.location.href = 'checkout.html';
    }

    // Update cart count in header
    updateCartCount() {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        const cartCountElements = DOM.getAll('.cart-count');
        cartCountElements.forEach(element => {
            element.textContent = totalItems;
        });

        const mobileCartCount = DOM.get('#mobile-cart-count');
        if (mobileCartCount) {
            mobileCartCount.textContent = `${totalItems} আইটেম`;
        }
    }

    // Clear cart
    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartPage();
    }

    // Get cart total items
    getTotalItems() {
        return this.cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    // Get cart total amount
    getTotalAmount() {
        const subtotal = this.calculateSubtotal();
        const delivery = this.getDeliveryCharge();
        const discount = this.getDiscountAmount();
        return subtotal + delivery - discount;
    }
}

// Initialize cart manager on cart page
if (window.location.pathname.includes('cart.html')) {
    document.addEventListener('DOMContentLoaded', function() {
        window.cartManager = new CartManager();
    });
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CartManager;
}