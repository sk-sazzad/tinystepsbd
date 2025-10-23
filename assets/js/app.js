// Main Application Logic for Tiny Steps BD

// Global Variables
let allProducts = [];
let currentProducts = [];

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        // Load products data
        await loadProductsData();
        
        // Initialize cart functionality
        initializeCart();
        
        // Set up event listeners
        setupEventListeners();
        
        // Update cart UI
        updateCartUI();
        
        console.log('Tiny Steps BD App Initialized Successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification('এপ্লিকেশন লোড করতে সমস্যা হচ্ছে', 'error');
    }
}

// Load Products Data
async function loadProductsData() {
    try {
        // Show loading state
        const productContainers = document.querySelectorAll('.products-grid, #featuredProducts, #productsContainer');
        productContainers.forEach(container => {
            if (container) {
                container.innerHTML = createSkeletonLoader(8, 'product');
            }
        });

        const response = await fetch(`${API_URL}?action=products`);
        const result = await response.json();
        
        if (result.success && result.data) {
            allProducts = result.data;
            currentProducts = [...allProducts];
            
            // Cache products in localStorage
            saveToLocalStorage('products', allProducts);
            
            // Update products display based on current page
            updateProductsDisplay();
        } else {
            throw new Error('Failed to load products');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        
        // Try to load from cache
        const cachedProducts = loadFromLocalStorage('products');
        if (cachedProducts) {
            allProducts = cachedProducts;
            currentProducts = [...cachedProducts];
            updateProductsDisplay();
            showNotification('ক্যাশড ডাটা লোড করা হয়েছে', 'warning');
        } else {
            showNotification('প্রোডাক্ট লোড করতে সমস্যা হচ্ছে', 'error');
        }
    }
}

// Update Products Display Based on Current Page
function updateProductsDisplay() {
    const path = window.location.pathname;
    
    if (path.includes('index.html') || path === '/') {
        loadFeaturedProducts();
    } else if (path.includes('shop.html')) {
        loadAllProducts();
    } else if (path.includes('product.html')) {
        loadProductDetail();
    }
}

// Load Featured Products (for homepage)
function loadFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;
    
    // Show first 8 products as featured
    const featuredProducts = allProducts.slice(0, 8);
    displayProducts(featuredProducts, 'featuredProducts');
    
    // Set up category filter events
    setupCategoryFilters();
}

// Load All Products (for shop page)
function loadAllProducts() {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    displayProducts(allProducts, 'productsContainer');
    initializeFilters();
}

// Display Products in Grid
function displayProducts(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `
            <div class="no-products">
                <div class="no-products-icon">😔</div>
                <h3>কোন প্রোডাক্ট পাওয়া যায়নি</h3>
                <p>দুঃখিত, এই মুহূর্তে কোন প্রোডাক্ট পাওয়া যাচ্ছে না।</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => {
        const mainImage = product['Main Image'] || product.Image1 || 'assets/images/placeholder.jpg';
        const price = parseInt(product['Price (BDT)']) || 0;
        const category = product.Category || '';
        const size = product.Size || 'N/A';
        const color = product.Color || 'N/A';
        
        return `
            <div class="product-card fade-in" data-category="${category.toLowerCase()}" data-id="${product['Product ID']}">
                <img src="${mainImage}" alt="${product.Name}" class="product-image" 
                     onerror="this.src='assets/images/placeholder.jpg'"
                     loading="lazy">
                <div class="product-info">
                    <h3 class="product-title">${product.Name}</h3>
                    <div class="product-meta">
                        <span class="size-badge">সাইজ: ${size}</span>
                        <span class="color-badge">রং: ${truncateText(color, 15)}</span>
                    </div>
                    <div class="product-price">${formatPrice(price)}</div>
                    <button class="add-to-cart" data-id="${product['Product ID']}">
                        কার্টে যোগ করুন
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Add event listeners to add-to-cart buttons
    container.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            addToCart(productId);
        });
    });

    // Add click event to product cards for detail view
    container.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.classList.contains('add-to-cart')) {
                const productId = this.getAttribute('data-id');
                window.location.href = `product.html?id=${productId}`;
            }
        });
    });
}

// Initialize Filters (for shop page)
function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter products
            productCards.forEach(card => {
                if (filter === 'all') {
                    card.style.display = 'block';
                } else {
                    const category = card.getAttribute('data-category');
                    if (category && category.includes(filter)) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
            
            // Show/hide no products message
            const visibleProducts = Array.from(productCards).filter(card => 
                card.style.display !== 'none'
            );
            
            const container = document.getElementById('productsContainer');
            if (visibleProducts.length === 0) {
                if (!container.querySelector('.no-products')) {
                    container.innerHTML += `
                        <div class="no-products">
                            <div class="no-products-icon">🔍</div>
                            <h3>কোন প্রোডাক্ট পাওয়া যায়নি</h3>
                            <p>আপনার নির্বাচিত ফিল্টারে কোন প্রোডাক্ট নেই।</p>
                        </div>
                    `;
                }
            } else {
                const noProducts = container.querySelector('.no-products');
                if (noProducts) {
                    noProducts.remove();
                }
            }
        });
    });
}

// Setup Category Filters (for homepage)
function setupCategoryFilters() {
    const categoryCards = document.querySelectorAll('.category-compact-card');
    
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            window.location.href = `shop.html?category=${category}`;
        });
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function(e) {
            searchProducts(e.target.value);
        }, 300));
    }
    
    // Scroll to top button
    window.addEventListener('scroll', debounce(function() {
        toggleScrollToTop();
    }, 100));
    
    // Lazy load images
    if ('IntersectionObserver' in window) {
        lazyLoadImages();
    }
    
    // Handle back button
    window.addEventListener('popstate', function() {
        updateProductsDisplay();
    });
}

// Search Products
function searchProducts(query) {
    if (!query.trim()) {
        currentProducts = [...allProducts];
    } else {
        currentProducts = allProducts.filter(product => 
            product.Name.toLowerCase().includes(query.toLowerCase()) ||
            product.Description.toLowerCase().includes(query.toLowerCase()) ||
            product.Category.toLowerCase().includes(query.toLowerCase())
        );
    }
    
    const container = document.getElementById('productsContainer');
    if (container) {
        displayProducts(currentProducts, 'productsContainer');
    }
}

// Lazy Load Images
function lazyLoadImages() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Toggle Scroll to Top Button
function toggleScrollToTop() {
    let scrollBtn = document.getElementById('scrollToTop');
    
    if (!scrollBtn) {
        scrollBtn = document.createElement('button');
        scrollBtn.id = 'scrollToTop';
        scrollBtn.innerHTML = '↑';
        scrollBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-size: 1.2rem;
            cursor: pointer;
            opacity: 0;
            transition: all 0.3s ease;
            z-index: 1000;
            box-shadow: var(--shadow);
        `;
        scrollBtn.addEventListener('click', scrollToTop);
        document.body.appendChild(scrollBtn);
    }
    
    if (window.pageYOffset > 300) {
        scrollBtn.style.opacity = '1';
        scrollBtn.style.transform = 'translateY(0)';
    } else {
        scrollBtn.style.opacity = '0';
        scrollBtn.style.transform = 'translateY(20px)';
    }
}

// Scroll to Top
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Get Product by ID
function getProductById(productId) {
    return allProducts.find(product => product['Product ID'] === productId);
}

// Get Related Products
function getRelatedProducts(currentProduct, limit = 4) {
    const sameCategory = allProducts.filter(product => 
        product['Product ID'] !== currentProduct['Product ID'] &&
        product.Category === currentProduct.Category
    );
    
    return sameCategory.slice(0, limit);
}

// Update Cart Count in Header
function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        const totalItems = getCartItemCount();
        cartCount.textContent = totalItems;
        
        // Add animation if items were added
        if (totalItems > 0) {
            cartCount.classList.add('pulse');
            setTimeout(() => {
                cartCount.classList.remove('pulse');
            }, 1000);
        }
    }
}

// Initialize Intersection Observer for animations
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
}

// Performance Monitoring
function initPerformanceMonitoring() {
    if ('performance' in window) {
        window.addEventListener('load', () => {
            const navigationTiming = performance.getEntriesByType('navigation')[0];
            console.log('Page Load Time:', navigationTiming.loadEventEnd - navigationTiming.navigationStart);
        });
    }
}

// Error Boundary
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showNotification('কিছু সমস্যা হয়েছে। পেজটি রিলোড করুন।', 'error');
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeApp,
        loadProductsData,
        loadFeaturedProducts,
        loadAllProducts,
        displayProducts,
        initializeFilters,
        getProductById,
        getRelatedProducts,
        updateCartCount
    };
}