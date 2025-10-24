class DataManager {
    constructor() {
        this.products = new Map();
        this.categories = new Set();
        this.users = new Map();
        this.orders = new Map();
        this.cart = new Map();
    }

    // Product management
    addProduct(product) {
        this.products.set(product.id, product);
        this.categories.add(product.category);
    }

    getProduct(id) {
        return this.products.get(id);
    }

    getProductsByCategory(category) {
        return Array.from(this.products.values()).filter(product => 
            product.category === category
        );
    }

    getProductsByAgeRange(ageRange) {
        return Array.from(this.products.values()).filter(product => 
            product.ageRange === ageRange
        );
    }

    // Search products with filters for children's store
    searchProducts(query, filters = {}) {
        let results = Array.from(this.products.values());

        // Text search
        if (query) {
            results = results.filter(product =>
                product.name.toLowerCase().includes(query.toLowerCase()) ||
                product.description.toLowerCase().includes(query.toLowerCase())
            );
        }

        // Apply filters
        if (filters.category) {
            results = results.filter(product => product.category === filters.category);
        }

        if (filters.ageRange) {
            results = results.filter(product => product.ageRange === filters.ageRange);
        }

        if (filters.minPrice !== undefined) {
            results = results.filter(product => product.price >= filters.minPrice);
        }

        if (filters.maxPrice !== undefined) {
            results = results.filter(product => product.price <= filters.maxPrice);
        }

        if (filters.inStock) {
            results = results.filter(product => product.isInStock());
        }

        return results;
    }

    // User management
    addUser(user) {
        this.users.set(user.id, user);
    }

    getUser(id) {
        return this.users.get(id);
    }

    // Cart management
    addToCart(userId, productId, quantity = 1) {
        const userCart = this.cart.get(userId) || new Map();
        const currentQuantity = userCart.get(productId) || 0;
        userCart.set(productId, currentQuantity + quantity);
        this.cart.set(userId, userCart);
    }

    getCart(userId) {
        const userCart = this.cart.get(userId) || new Map();
        const cartItems = [];
        
        userCart.forEach((quantity, productId) => {
            const product = this.getProduct(productId);
            if (product) {
                cartItems.push({
                    product: product.getProductDetails(),
                    quantity: quantity
                });
            }
        });

        return cartItems;
    }

    // Order management
    createOrder(userId, items, shippingInfo) {
        const orderId = this.generateOrderId();
        const order = {
            id: orderId,
            userId: userId,
            items: items,
            shippingInfo: shippingInfo,
            orderDate: new Date(),
            status: 'pending',
            total: this.calculateOrderTotal(items)
        };

        this.orders.set(orderId, order);
        return order;
    }

    calculateOrderTotal(items) {
        return items.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);
    }

    generateOrderId() {
        return 'ORD_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Inventory management
    updateInventory(productId, quantity) {
        const product = this.getProduct(productId);
        if (product) {
            product.updateStock(quantity);
        }
    }

    // Get featured products for children's store
    getFeaturedProducts() {
        return Array.from(this.products.values())
            .filter(product => product.rating >= 4)
            .slice(0, 8);
    }

    // Get categories with product counts
    getCategoriesWithCounts() {
        const categoryCounts = {};
        
        this.categories.forEach(category => {
            categoryCounts[category] = this.getProductsByCategory(category).length;
        });

        return categoryCounts;
    }

    // Data persistence (simplified)
    saveToLocalStorage() {
        const data = {
            products: Array.from(this.products.entries()),
            users: Array.from(this.users.entries()),
            orders: Array.from(this.orders.entries()),
            cart: Array.from(this.cart.entries())
        };
        localStorage.setItem('tinystepsbd_data', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const data = JSON.parse(localStorage.getItem('tinystepsbd_data'));
        if (data) {
            this.products = new Map(data.products);
            this.users = new Map(data.users);
            this.orders = new Map(data.orders);
            this.cart = new Map(data.cart);
        }
    }
}

export default DataManager;