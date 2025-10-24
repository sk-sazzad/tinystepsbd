class Checkout {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.currentOrder = null;
        this.shippingMethods = [
            { id: 'standard', name: 'Standard Shipping', cost: 60, days: '3-5' },
            { id: 'express', name: 'Express Shipping', cost: 120, days: '1-2' },
            { id: 'same_day', name: 'Same Day Delivery', cost: 200, days: 'Same day' }
        ];
        this.paymentMethods = [
            { id: 'cod', name: 'Cash on Delivery' },
            { id: 'card', name: 'Credit/Debit Card' },
            { id: 'bkash', name: 'bKash' },
            { id: 'nagad', name: 'Nagad' }
        ];
    }

    // Initialize checkout with user cart
    initializeCheckout(userId) {
        this.userId = userId;
        this.cartItems = this.dataManager.getCart(userId);
        this.shippingInfo = {};
        this.selectedShipping = this.shippingMethods[0];
        this.selectedPayment = this.paymentMethods[0];
        
        return this.getCheckoutSummary();
    }

    // Get checkout summary
    getCheckoutSummary() {
        const subtotal = this.calculateSubtotal();
        const shippingCost = this.selectedShipping ? this.selectedShipping.cost : 0;
        const total = subtotal + shippingCost;

        return {
            items: this.cartItems,
            subtotal: subtotal,
            shippingCost: shippingCost,
            total: total,
            itemCount: this.cartItems.reduce((count, item) => count + item.quantity, 0)
        };
    }

    // Calculate subtotal
    calculateSubtotal() {
        return this.cartItems.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);
    }

    // Update shipping information
    updateShippingInfo(info) {
        this.shippingInfo = { ...this.shippingInfo, ...info };
        return this.validateShippingInfo();
    }

    // Validate shipping information for Bangladesh
    validateShippingInfo() {
        const requiredFields = ['name', 'phone', 'address', 'city'];
        const errors = [];

        requiredFields.forEach(field => {
            if (!this.shippingInfo[field]) {
                errors.push(`${field} is required`);
            }
        });

        // Validate Bangladeshi phone number
        if (this.shippingInfo.phone && !this.isValidBangladeshiPhone(this.shippingInfo.phone)) {
            errors.push('Please enter a valid Bangladeshi phone number');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Validate Bangladeshi phone number
    isValidBangladeshiPhone(phone) {
        const bangladeshiPhoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
        return bangladeshiPhoneRegex.test(phone.replace(/\s/g, ''));
    }

    // Select shipping method
    selectShippingMethod(methodId) {
        this.selectedShipping = this.shippingMethods.find(method => method.id === methodId);
        return this.getCheckoutSummary();
    }

    // Select payment method
    selectPaymentMethod(methodId) {
        this.selectedPayment = this.paymentMethods.find(method => method.id === methodId);
    }

    // Validate stock before placing order
    validateStock() {
        const outOfStockItems = [];

        this.cartItems.forEach(item => {
            const product = this.dataManager.getProduct(item.product.id);
            if (!product || !product.isInStock() || product.stock < item.quantity) {
                outOfStockItems.push({
                    product: item.product.name,
                    requested: item.quantity,
                    available: product ? product.stock : 0
                });
            }
        });

        return {
            isValid: outOfStockItems.length === 0,
            outOfStockItems: outOfStockItems
        };
    }

    // Place order
    async placeOrder() {
        // Validate shipping info
        const shippingValidation = this.validateShippingInfo();
        if (!shippingValidation.isValid) {
            throw new Error(`Shipping information invalid: ${shippingValidation.errors.join(', ')}`);
        }

        // Validate stock
        const stockValidation = this.validateStock();
        if (!stockValidation.isValid) {
            throw new Error('Some items are out of stock');
        }

        // Create order
        this.currentOrder = this.dataManager.createOrder(
            this.userId,
            this.cartItems,
            {
                ...this.shippingInfo,
                shippingMethod: this.selectedShipping
            }
        );

        // Update inventory
        this.cartItems.forEach(item => {
            this.dataManager.updateInventory(item.product.id, -item.quantity);
        });

        // Clear cart
        this.dataManager.cart.delete(this.userId);

        // Save data
        this.dataManager.saveToLocalStorage();

        return this.currentOrder;
    }

    // Apply discount code (placeholder for future implementation)
    applyDiscountCode(code) {
        // This would typically validate against a database of discount codes
        const discounts = {
            'BABY10': 10,
            'TINYSTEPS5': 5,
            'WELCOME15': 15
        };

        if (discounts[code]) {
            this.discount = {
                code: code,
                percentage: discounts[code]
            };
            return {
                success: true,
                message: `Discount applied: ${discounts[code]}% off`,
                discount: this.discount
            };
        } else {
            return {
                success: false,
                message: 'Invalid discount code'
            };
        }
    }

    // Get order confirmation
    getOrderConfirmation() {
        if (!this.currentOrder) {
            return null;
        }

        const summary = this.getCheckoutSummary();
        
        return {
            order: this.currentOrder,
            summary: summary,
            estimatedDelivery: this.calculateEstimatedDelivery(),
            paymentMethod: this.selectedPayment
        };
    }

    // Calculate estimated delivery date
    calculateEstimatedDelivery() {
        if (!this.selectedShipping) return null;

        const deliveryDate = new Date();
        if (this.selectedShipping.id === 'same_day') {
            // Same day delivery
            deliveryDate.setHours(deliveryDate.getHours() + 6);
        } else if (this.selectedShipping.id === 'express') {
            // 1-2 days
            deliveryDate.setDate(deliveryDate.getDate() + 2);
        } else {
            // Standard 3-5 days
            deliveryDate.setDate(deliveryDate.getDate() + 5);
        }

        return deliveryDate;
    }

    // Get shipping methods
    getShippingMethods() {
        return this.shippingMethods;
    }

    // Get payment methods
    getPaymentMethods() {
        return this.paymentMethods;
    }
}

export default Checkout;