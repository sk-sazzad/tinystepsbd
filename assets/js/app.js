/**
 * TinyStepsBD - Main Application JavaScript
 * Google Apps Script API ফেচিং এবং প্রধান অ্যাপ লজিক
 */

// App initialization
class TinyStepsBDApp {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentPage = 1;
        this.productsPerPage = 12;
        this.currentFilters = {
            category: '',
            size: '',
            search: '',
            sort: 'name'
        };
        
        this.init();
    }

    // Initialize the application
    init() {
        this.setupEventListeners();
        this.loadInitialData();
        this.updateCartCount();
        ImageUtils.lazyLoad();
    }

    // Setup global event listeners
    setupEventListeners() {
        // Mobile menu toggle
        DOM.on('click', '.mobile-menu-btn', () => this.toggleMobileMenu());
        DOM.on('click', '.mobile-close-btn', () => this.toggleMobileMenu());
        
        // Search functionality
        DOM.on('click', '#search-toggle', () => this.toggleSearch());
        DOM.on('click', '#search-close-btn', () => this.toggleSearch());
        
        // Account dropdown
        DOM.on('click', '#account-btn', (e) => this.toggleAccountDropdown(e));
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => this.handleClickOutside(e));
        
        // Back to top button
        DOM.on('click', '#back-to-top', () => this.scrollToTop());
        
        // Scroll event for back to top button
        window.addEventListener('scroll', Performance.throttle(() => this.handleScroll(), 100));
        
        // Page visibility change
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    }

    // Load initial data
    async loadInitialData() {
        try {
            await this.loadProducts();
            this.setupProductFilters();
            this.loadFeaturedProducts();
        } catch (error) {
            console.error('Error loading initial data:', error);
            Notify.error('ডেটা লোড করতে সমস্যা হচ্ছে। দয়া করে পৃষ্ঠাটি রিফ্রেশ করুন।');
        }
    }

    // Load all products from API
    async loadProducts() {
        try {
            const response = await API.getProducts();
            
            if (response.success) {
                this.products = response.data;
                this.filteredProducts = [...this.products];
                this.cacheProducts(response.data);
                this.renderProducts();
            } else {
                throw new Error(response.error || 'পণ্য লোড করতে সমস্যা হয়েছে');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            
            // Try to load from cache
            const cachedProducts = this.getCachedProducts();
            if (cachedProducts.length > 0) {
                this.products = cachedProducts;
                this.filteredProducts = [...cachedProducts];
                this.renderProducts();
                Notify.warning('ক্যাশেড ডেটা দেখানো হচ্ছে। ইন্টারনেট সংযোগ পরীক্ষা করুন।');
            } else {
                Notify.error('পণ্য লোড করতে অক্ষম। দয়া পরে চেষ্টা করুন।');
            }
        }
    }

    // Cache products for offline use
    cacheProducts(products) {
        const cacheData = {
            products: products,
            timestamp: Date.now()
        };
        Storage.set('products_cache', cacheData);
    }

    // Get cached products
    getCachedProducts() {
        const cache = Storage.get('products_cache');
        if (cache && Date.now() - cache.timestamp < TINYSTEPSBD_CONFIG.CACHE_TIMEOUT) {
            return cache.products;
        }
        return [];
    }

    // Render products to the page
    renderProducts(products = this.filteredProducts) {
        const container = DOM.get('#products-container') || DOM.get('#featured-products') || DOM.get('#all-products');
        
        if (!container) return;

        if (products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <img src="assets/images/icons/ui/search-empty.png" alt="কোন পণ্য নেই" onerror="this.src='assets/images/placeholder.jpg'">
                    <h3>কোন পণ্য পাওয়া যায়নি</h3>
                    <p>আপনার খোঁজার সাথে মিলছে এমন কোন পণ্য নেই</p>
                </div>
            `;
            return;
        }

        // Get the products to display (for pagination)
        const startIndex = (this.currentPage - 1) * this.productsPerPage;
        const endIndex = startIndex + this.productsPerPage;
        const productsToShow = products.slice(startIndex, endIndex);

        container.innerHTML = productsToShow.map(product => this.createProductCard(product)).join('');

        // Update product count
        this.updateProductCount(products.length);

        // Setup product card interactions
        this.setupProductInteractions();
    }

    // Create product card HTML
    createProductCard(product) {
        const mainImage = product['Main Image'] || product.Image1 || 'assets/images/placeholder.jpg';
        const shortDescription = Format.truncate(product.Description || '', 80);
        
        return `
            <div class="product-card" data-product-id="${product['Product ID']}" data-category="${product.Category}">
                <div class="product-image-container">
                    <a href="product.html?id=${product['Product ID']}" class="product-image-link">
                        <img src="${mainImage}" alt="${product.Name}" class="product-image" 
                             onerror="ImageUtils.handleImageError(event)" 
                             loading="lazy">
                    </a>
                    
                    <div class="product-badges">
                        ${this.getProductBadges(product)}
                    </div>

                    <div class="product-actions">
                        <button class="action-btn quick-view" data-product-id="${product['Product ID']}" title="দ্রুত দেখুন">
                            <img src="assets/images/icons/ui/eye.png" alt="দ্রুত দেখুন" onerror="this.src='assets/images/placeholder.jpg'">
                        </button>
                        <button class="action-btn add-to-wishlist" data-product-id="${product['Product ID']}" title="উইশলিস্টে যোগ করুন">
                            <img src="assets/images/icons/ui/heart.png" alt="উইশলিস্ট" onerror="this.src='assets/images/placeholder.jpg'">
                        </button>
                    </div>
                </div>

                <div class="product-info">
                    <div class="product-category">
                        <span class="category-badge">${product.Category}</span>
                    </div>

                    <h3 class="product-title">
                        <a href="product.html?id=${product['Product ID']}">${product.Name}</a>
                    </h3>

                    <p class="product-description-short">${shortDescription}</p>

                    <div class="product-meta">
                        <div class="meta-item">
                            <span class="meta-label">সাইজ:</span>
                            <span class="meta-value">${product.Size}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">রং:</span>
                            <span class="meta-value">${Format.truncate(product.Color || '', 15)}</span>
                        </div>
                    </div>

                    <div class="product-rating">
                        <div class="rating-stars">
                            ${this.generateRatingStars(4)} <!-- Default 4 stars for demo -->
                        </div>
                        <span class="rating-count">(১২)</span>
                    </div>

                    <div class="product-price">
                        <span class="current-price">${Format.price(product['Price (BDT)'])}</span>
                    </div>

                    <div class="product-cta">
                        <button class="btn btn-primary add-to-cart-btn" data-product-id="${product['Product ID']}">
                            <span class="btn-icon">🛒</span>
                            কার্টে যোগ করুন
                        </button>
                    </div>

                    <div class="product-features">
                        <div class="feature">
                            <img src="assets/images/icons/features/delivery.png" alt="ডেলিভারি" onerror="this.src='assets/images/placeholder.jpg'">
                            <span>অভ্যন্তরীণ: ৮০৳</span>
                        </div>
                        <div class="feature">
                            <img src="assets/images/icons/features/cod.png" alt="ক্যাশ অন ডেলিভারি" onerror="this.src='assets/images/placeholder.jpg'">
                            <span>ক্যাশ অন ডেলিভারি</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Generate rating stars HTML
    generateRatingStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        
        let stars = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            stars += '<span class="star filled">⭐</span>';
        }
        
        // Half star
        if (hasHalfStar) {
            stars += '<span class="star half">⭐</span>';
        }
        
        // Empty stars
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<span class="star">⭐</span>';
        }
        
        return stars;
    }

    // Get product badges
    getProductBadges(product) {
        const badges = [];
        
        // New product badge (based on product ID or other criteria)
        if (product['Product ID'] && product['Product ID'].includes('_52')) {
            badges.push('<span class="badge new-badge">নতুন</span>');
        }
        
        // Featured product badge
        if (product.Category === 'Girls') {
            badges.push('<span class="badge featured-badge">ফিচার্ড</span>');
        }
        
        return badges.join('');
    }

    // Setup product card interactions
    setupProductInteractions() {
        // Add to cart buttons
        DOM.on('click', '.add-to-cart-btn', (e) => {
            const productId = e.target.closest('.add-to-cart-btn').dataset.productId;
            this.addToCart(productId);
        });

        // Quick view buttons
        DOM.on('click', '.quick-view', (e) => {
            const productId = e.target.closest('.quick-view').dataset.productId;
            this.showQuickView(productId);
        });

        // Wishlist buttons
        DOM.on('click', '.add-to-wishlist', (e) => {
            const productId = e.target.closest('.add-to-wishlist').dataset.productId;
            this.addToWishlist(productId);
        });
    }

    // Setup product filters
    setupProductFilters() {
        // Search input
        const searchInput = DOM.get('#product-search');
        if (searchInput) {
            searchInput.addEventListener('input', Performance.debounce((e) => {
                this.currentFilters.search = e.target.value;
                this.applyFilters();
            }, 300));
        }

        // Category filter
        const categoryFilter = DOM.get('#category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentFilters.category = e.target.value;
                this.applyFilters();
            });
        }

        // Size filter
        const sizeFilter = DOM.get('#size-filter');
        if (sizeFilter) {
            sizeFilter.addEventListener('change', (e) => {
                this.currentFilters.size = e.target.value;
                this.applyFilters();
            });
        }

        // Sort filter
        const sortFilter = DOM.get('#sort-by');
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.currentFilters.sort = e.target.value;
                this.applyFilters();
            });
        }
    }

    // Apply current filters
    applyFilters() {
        let filtered = [...this.products];

        // Search filter
        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            filtered = filtered.filter(product => 
                product.Name.toLowerCase().includes(searchTerm) ||
                product.Description.toLowerCase().includes(searchTerm) ||
                product.Category.toLowerCase().includes(searchTerm)
            );
        }

        // Category filter
        if (this.currentFilters.category) {
            filtered = filtered.filter(product => 
                product.Category === this.currentFilters.category
            );
        }

        // Size filter
        if (this.currentFilters.size) {
            filtered = filtered.filter(product => 
                product.Size === this.currentFilters.size
            );
        }

        // Sort products
        filtered = this.sortProducts(filtered, this.currentFilters.sort);

        this.filteredProducts = filtered;
        this.currentPage = 1; // Reset to first page
        this.renderProducts();
    }

    // Sort products based on criteria
    sortProducts(products, sortBy) {
        switch (sortBy) {
            case 'price-low':
                return products.sort((a, b) => a['Price (BDT)'] - b['Price (BDT)']);
            case 'price-high':
                return products.sort((a, b) => b['Price (BDT)'] - a['Price (BDT)']);
            case 'newest':
                return products.sort((a, b) => {
                    // Sort by product ID (assuming newer products have higher IDs)
                    return b['Product ID'].localeCompare(a['Product ID']);
                });
            case 'name':
            default:
                return products.sort((a, b) => a.Name.localeCompare(b.Name));
        }
    }

    // Update product count display
    updateProductCount(count) {
        const countElement = DOM.get('#showing-count');
        if (countElement) {
            countElement.textContent = count;
        }
    }

    // Load featured products for homepage
    loadFeaturedProducts() {
        const featuredContainer = DOM.get('#featured-products');
        if (!featuredContainer) return;

        const featuredProducts = this.products.slice(0, 6); // First 6 products as featured
        if (featuredProducts.length > 0) {
            this.renderProducts(featuredProducts);
        }
    }

    // Add product to cart
    addToCart(productId, quantity = 1) {
        const product = this.products.find(p => p['Product ID'] === productId);
        if (!product) {
            Notify.error('পণ্যটি খুঁজে পাওয়া যায়নি।');
            return;
        }

        const cart = Storage.getCart();
        const existingItem = cart.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                id: productId,
                name: product.Name,
                price: product['Price (BDT)'],
                quantity: quantity,
                color: '',
                size: '',
                image: product['Main Image'] || product.Image1,
                maxQuantity: 10
            });
        }

        Storage.saveCart(cart);
        this.updateCartCount();
        Notify.success('পণ্যটি কার্টে যোগ করা হয়েছে!');
    }

    // Update cart count in header
    updateCartCount() {
        const cart = Storage.getCart();
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        const cartCountElements = DOM.getAll('.cart-count');
        cartCountElements.forEach(element => {
            element.textContent = totalItems;
        });

        const mobileCartCount = DOM.get('#mobile-cart-count');
        if (mobileCartCount) {
            mobileCartCount.textContent = `${totalItems} আইটেম`;
        }
    }

    // Show quick view modal
    async showQuickView(productId) {
        try {
            const product = this.products.find(p => p['Product ID'] === productId);
            if (!product) {
                Notify.error('পণ্যের তথ্য লোড করতে সমস্যা হয়েছে।');
                return;
            }

            // Create and show quick view modal
            this.createQuickViewModal(product);
        } catch (error) {
            console.error('Error showing quick view:', error);
            Notify.error('দ্রুত দেখুন ফিচার লোড করতে সমস্যা হয়েছে।');
        }
    }

    // Create quick view modal
    createQuickViewModal(product) {
        // Implementation for quick view modal
        // This would create a modal with product details
        console.log('Quick view for product:', product['Product ID']);
        // Actual implementation would involve creating a modal DOM element
        // and populating it with product details
    }

    // Add product to wishlist
    addToWishlist(productId) {
        const wishlist = Storage.getWishlist();
        
        if (!wishlist.includes(productId)) {
            wishlist.push(productId);
            Storage.saveWishlist(wishlist);
            Notify.success('পণ্যটি উইশলিস্টে যোগ করা হয়েছে!');
        } else {
            Notify.info('পণ্যটি ইতিমধ্যেই আপনার উইশলিস্টে আছে।');
        }
    }

    // Toggle mobile menu
    toggleMobileMenu() {
        const mobileNav = DOM.get('.mobile-nav');
        if (mobileNav) {
            mobileNav.classList.toggle('active');
            document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
        }
    }

    // Toggle search overlay
    toggleSearch() {
        const searchOverlay = DOM.get('.search-overlay');
        if (searchOverlay) {
            searchOverlay.classList.toggle('active');
            document.body.style.overflow = searchOverlay.classList.contains('active') ? 'hidden' : '';
            
            if (searchOverlay.classList.contains('active')) {
                const searchInput = DOM.get('#overlay-search-input');
                if (searchInput) searchInput.focus();
            }
        }
    }

    // Toggle account dropdown
    toggleAccountDropdown(e) {
        e.stopPropagation();
        const dropdown = DOM.get('.account-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('active');
        }
    }

    // Handle click outside to close dropdowns
    handleClickOutside(e) {
        // Close account dropdown
        const accountDropdown = DOM.get('.account-dropdown');
        if (accountDropdown && !e.target.closest('.user-account')) {
            accountDropdown.classList.remove('active');
        }
    }

    // Handle scroll events
    handleScroll() {
        const backToTop = DOM.get('#back-to-top');
        if (backToTop) {
            if (window.pageYOffset > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }
    }

    // Scroll to top
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Handle page visibility change
    handleVisibilityChange() {
        if (!document.hidden) {
            // Page became visible, refresh data if needed
            this.updateCartCount();
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.tinystepsBDApp = new TinyStepsBDApp();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TinyStepsBDApp;
}