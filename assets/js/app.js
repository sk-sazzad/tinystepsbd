// Main Application Logic for Tiny Steps BD - FIXED VERSION

// Global Variables
let allProducts = [];
let currentProducts = [];
let categories = [];

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        // Load products data with better error handling
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

// Load Products Data with improved performance
async function loadProductsData() {
    try {
        console.log('Loading products from API...');
        
        const response = await fetch(`${API_URL}?action=products`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data && Array.isArray(result.data)) {
            allProducts = result.data.map(product => ({
                ...product,
                // Ensure price is properly formatted
                'Price (BDT)': parseInt(product['Price (BDT)']) || 0,
                // Fix image URLs
                'Main Image': fixImageUrl(product['Main Image']),
                'Image1': fixImageUrl(product['Image1']),
                'Image2': fixImageUrl(product['Image2']),
                'Image3': fixImageUrl(product['Image3']),
                'Image4': fixImageUrl(product['Image4']),
                'Image5': fixImageUrl(product['Image5'])
            }));
            
            currentProducts = [...allProducts];
            
            // Extract and process categories
            extractCategories();
            
            // Cache products in localStorage
            saveToLocalStorage('products', allProducts);
            saveToLocalStorage('categories', categories);
            
            console.log('Products loaded successfully:', allProducts.length);
        } else {
            throw new Error('Invalid API response format');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        
        // Try to load from cache
        const cachedProducts = loadFromLocalStorage('products');
        const cachedCategories = loadFromLocalStorage('categories');
        
        if (cachedProducts && cachedCategories) {
            allProducts = cachedProducts;
            currentProducts = [...cachedProducts];
            categories = cachedCategories;
            showNotification('ক্যাশড ডাটা লোড করা হয়েছে', 'warning');
        } else {
            // Load sample products as last resort
            loadSampleProducts();
        }
    }
}

// Fix Google Drive Image URLs
function fixImageUrl(url) {
    if (!url) return 'assets/images/placeholder.jpg';
    
    // If it's already a proper URL, return as is
    if (url.startsWith('http')) {
        return url;
    }
    
    // If it's a Google Drive URL, ensure proper format
    if (url.includes('drive.google.com')) {
        // Convert view URL to direct download URL
        if (url.includes('/view')) {
            url = url.replace('/view', '/uc');
        }
        if (!url.includes('/uc?')) {
            url = url.replace('/file/d/', '/uc?id=').replace('/view', '');
        }
    }
    
    return url;
}

// Extract categories from products
function extractCategories() {
    const categorySet = new Set();
    
    allProducts.forEach(product => {
        if (product.Category) {
            const cats = product.Category.split('/');
            cats.forEach(cat => categorySet.add(cat.trim()));
        }
    });
    
    categories = Array.from(categorySet).filter(cat => cat && cat !== '');
    console.log('Extracted categories:', categories);
}

// Load Featured Products (for homepage)
function loadFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;
    
    // Show loading state
    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>প্রোডাক্ট লোড হচ্ছে...</p>
        </div>
    `;
    
    // Use setTimeout to show loading state properly
    setTimeout(() => {
        if (allProducts.length === 0) {
            container.innerHTML = `
                <div class="no-products">
                    <div class="no-products-icon">😔</div>
                    <h3>প্রোডাক্ট লোড হতে সমস্যা হচ্ছে</h3>
                    <p>দুঃখিত, প্রোডাক্ট লোড করতে সমস্যা হচ্ছে। পরে আবার চেষ্টা করুন।</p>
                </div>
            `;
            return;
        }
        
        // Show first 8 products as featured
        const featuredProducts = allProducts.slice(0, 8);
        displayProducts(featuredProducts, 'featuredProducts');
        
        // Set up category filter events
        setupCategoryFilters();
    }, 500);
}

// Load Categories
function loadCategories() {
    const container = document.getElementById('categoriesGrid');
    if (!container) return;
    
    // Show loading state
    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
        </div>
    `;
    
    setTimeout(() => {
        if (categories.length === 0) {
            // Default categories if none found
            categories = ['নবজাতক', 'ছেলেদের', 'মেয়েদের', 'স্পেশাল'];
        }
        
        displayCategories(categories);
    }, 300);
}

// Display Categories
function displayCategories(cats) {
    const container = document.getElementById('categoriesGrid');
    if (!container) return;

    const categoryIcons = {
        'নবজাতক': '👶',
        'ছেলেদের': '👦', 
        'মেয়েদের': '👧',
        'স্পেশাল': '⭐',
        'Boys': '👦',
        'Girls': '👧',
        'Boys/Girls': '👶'
    };

    container.innerHTML = cats.map(cat => {
        const icon = categoryIcons[cat] || '📦';
        return `
            <div class="category-compact-card" data-category="${cat.toLowerCase()}">
                <div class="category-compact-icon">${icon}</div>
                <span>${cat}</span>
            </div>
        `;
    }).join('');

    // Add click event listeners
    container.querySelectorAll('.category-compact-card').forEach(card => {
        card.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            filterProductsByCategory(category);
            
            // Update active state
            container.querySelectorAll('.category-compact-card').forEach(c => {
                c.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
}

// Display Products with improved image handling
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
                     onerror="this.onerror=null; this.src='assets/images/placeholder.jpg'; this.classList.add('error')"
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
        button.addEventListener('click', function(e) {
            e.stopPropagation();
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

// Filter products by category
function filterProductsByCategory(category) {
    let filteredProducts = allProducts;
    
    if (category && category !== 'all') {
        filteredProducts = allProducts.filter(product => {
            const productCategory = product.Category ? product.Category.toLowerCase() : '';
            return productCategory.includes(category);
        });
    }
    
    // Update featured products display
    displayProducts(filteredProducts.slice(0, 8), 'featuredProducts');
    
    showNotification(`${category} ক্যাটেগরির প্রোডাক্ট দেখানো হচ্ছে`);
}

// Setup Category Filters (for homepage)
function setupCategoryFilters() {
    // This is now handled in displayCategories
}

// Setup Event Listeners
function setupEventListeners() {
    // Prevent cart auto-open on page load
    const cartModal = document.getElementById('cartModal');
    const overlay = document.getElementById('overlay');
    
    if (cartModal && overlay) {
        cartModal.style.right = '-100%';
        overlay.style.display = 'none';
    }
    
    // Scroll to top button
    window.addEventListener('scroll', debounce(function() {
        toggleScrollToTop();
    }, 100));
    
    // Lazy load images
    if ('IntersectionObserver' in window) {
        lazyLoadImages();
    }
}

// Load sample products as fallback
function loadSampleProducts() {
    allProducts = [
        {
            "Product ID": "TS-BD_517",
            "Name": "০-১.৫ বছর বয়সী শিশুর বাচ্চাদের জুতা",
            "Description": "বসন্ত এবং শরৎ ০-১.৫ বছর বয়সী শিশুর বাচ্চাদের জুতা পিইউ ভেলক্রো ছেলে এবং মেয়েদের বাচ্চাদের স্নিকার্স ইনডোর এবং আউটডোর চামড়ার জুতা নরম সোল",
            "Price (BDT)": "890",
            "Category": "Boys/Girls",
            "Size": "20-30",
            "Color": "সাদা, কালো, গাঢ় বাদামী, আর্মি গ্রিন,নীল, গোলাপি, খুবানি, সাদা হৃদয়, গোলাপী সাদা হৃদয়, বাদামী প্যাটার্ন, চিতাবাঘের ছাপ",
            "Main Image": "https://via.placeholder.com/300x200/87CEEB/FFFFFF?text=Tiny+Steps+BD",
            "Image1": "https://via.placeholder.com/300x200/FFB6C1/FFFFFF?text=Baby+Shoes"
        },
        {
            "Product ID": "TS-BD_518", 
            "Name": "LED হালকা ছেলেদের স্পোর্টস জুতা",
            "Description": "বসন্ত এবং গ্রীষ্মের নতুন শিশুদের উজ্জ্বল কাপড়ের ছেলেদের স্পোর্টস জুতা ১-৬ বছর বয়সী LED হালকা জুতা মেয়েদের নৈমিত্তিক ছোট বাচ্চাদের হালকা-আপ জুতা",
            "Price (BDT)": "1490",
            "Category": "Boys",
            "Size": "21-30",
            "Color": "সাদা, খাকি, গোলাপি",
            "Main Image": "https://via.placeholder.com/300x200/FFD700/FFFFFF?text=LED+Shoes",
            "Image1": "https://via.placeholder.com/300x200/87CEEB/FFFFFF?text=Sports+Shoes"
        }
    ];
    
    currentProducts = [...allProducts];
    extractCategories();
    
    showNotification('স্যাম্পল প্রোডাক্ট লোড করা হয়েছে', 'warning');
}

// Update Products Display Based on Current Page
function updateProductsDisplay() {
    const path = window.location.pathname;
    
    if (path.includes('index.html') || path === '/') {
        loadFeaturedProducts();
        loadCategories();
    } else if (path.includes('shop.html')) {
        loadAllProducts();
    } else if (path.includes('product.html')) {
        loadProductDetail();
    }
}

// Get Product by ID
function getProductById(productId) {
    return allProducts.find(product => product['Product ID'] === productId);
}

// Update Cart Count in Header
function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        const totalItems = getCartItemCount();
        cartCount.textContent = totalItems;
    }
}

// Performance monitoring
function initPerformanceMonitoring() {
    window.addEventListener('load', () => {
        if ('performance' in window) {
            const navigationTiming = performance.getEntriesByType('navigation')[0];
            console.log('Page Load Time:', navigationTiming.loadEventEnd - navigationTiming.navigationStart);
        }
    });
}

// Error handling
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeApp,
        loadProductsData,
        loadFeaturedProducts,
        loadCategories,
        displayProducts,
        getProductById,
        updateCartCount
    };
}