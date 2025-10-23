// Product Detail Page Functionality

let currentProduct = null;

// Load Product Detail
async function loadProductDetail() {
    const productId = getQueryParam('id');
    
    if (!productId) {
        showNotification('প্রোডাক্ট আইডি পাওয়া যায়নি', 'error');
        window.location.href = 'shop.html';
        return;
    }

    const container = document.getElementById('productDetail');
    if (!container) return;

    try {
        // Show loading skeleton
        container.innerHTML = createProductDetailSkeleton();

        // Wait for products to load if not already loaded
        if (allProducts.length === 0) {
            await loadProductsData();
        }

        const product = getProductById(productId);
        
        if (!product) {
            throw new Error('Product not found');
        }

        currentProduct = product;
        displayProductDetail(product);
        loadRelatedProducts(product);
        
    } catch (error) {
        console.error('Error loading product detail:', error);
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">😔</div>
                <h3>প্রোডাক্ট লোড করতে সমস্যা হচ্ছে</h3>
                <p>দুঃখিত, এই প্রোডাক্টটি এই মুহূর্তে পাওয়া যাচ্ছে না।</p>
                <a href="shop.html" class="btn">শপে ফিরে যান</a>
            </div>
        `;
    }
}

// Create Product Detail Skeleton
function createProductDetailSkeleton() {
    return `
        <div class="product-detail-skeleton">
            <div class="skeleton-gallery">
                <div class="skeleton-main-image"></div>
                <div class="skeleton-thumbnails">
                    <div class="skeleton-thumb"></div>
                    <div class="skeleton-thumb"></div>
                    <div class="skeleton-thumb"></div>
                    <div class="skeleton-thumb"></div>
                </div>
            </div>
            <div class="skeleton-info">
                <div class="skeleton-line long"></div>
                <div class="skeleton-line short"></div>
                <div class="skeleton-line medium"></div>
                <div class="skeleton-line long"></div>
                <div class="skeleton-line short"></div>
                <div class="skeleton-button"></div>
            </div>
        </div>
    `;
}

// Display Product Detail
function displayProductDetail(product) {
    const container = document.getElementById('productDetail');
    if (!container) return;

    const images = getProductImages(product);
    const price = parseInt(product['Price (BDT)']) || 0;
    const category = product.Category || '';
    const size = product.Size || 'N/A';
    const color = product.Color || 'N/A';
    const description = product.Description || 'কোন বিবরণ নেই';

    container.innerHTML = `
        <div class="product-detail-main">
            <div class="product-gallery">
                <div class="gallery-main">
                    <img src="${images[0]}" alt="${product.Name}" 
                         id="mainImage" class="gallery-main-image"
                         onerror="this.src='assets/images/placeholder.jpg'">
                </div>
                <div class="gallery-thumbs">
                    ${images.map((image, index) => `
                        <div class="thumb ${index === 0 ? 'active' : ''}" 
                             data-image="${image}"
                             onclick="changeMainImage('${image}', this)">
                            <img src="${image}" alt="Thumbnail ${index + 1}"
                                 onerror="this.src='assets/images/placeholder.jpg'">
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="product-info-main">
                <div class="breadcrumb">
                    <a href="index.html">হোম</a> &gt; 
                    <a href="shop.html">শপ</a> &gt; 
                    <span>${category}</span>
                </div>
                
                <h1 class="product-detail-title">${product.Name}</h1>
                <div class="product-detail-price">${formatPrice(price)}</div>
                
                <div class="product-meta-detail">
                    <div class="meta-item">
                        <strong>ক্যাটেগরী:</strong>
                        <span>${category}</span>
                    </div>
                    <div class="meta-item">
                        <strong>সাইজ:</strong>
                        <span>${size}</span>
                    </div>
                    <div class="meta-item">
                        <strong>রং:</strong>
                        <span>${color}</span>
                    </div>
                    <div class="meta-item">
                        <strong>প্রোডাক্ট আইডি:</strong>
                        <span>${product['Product ID']}</span>
                    </div>
                </div>
                
                <div class="product-description">
                    <h3>বিবরণ</h3>
                    <p>${description}</p>
                </div>
                
                <div class="product-actions">
                    <div class="quantity-selector">
                        <label for="quantity">পরিমাণ:</label>
                        <div class="quantity-controls">
                            <button type="button" onclick="decreaseQuantity()">-</button>
                            <input type="number" id="quantity" value="1" min="1" max="10">
                            <button type="button" onclick="increaseQuantity()">+</button>
                        </div>
                    </div>
                    
                    <div class="action-buttons">
                        <button class="btn btn-primary" onclick="addToCartWithQuantity('${product['Product ID']}')">
                            🛒 কার্টে যোগ করুন
                        </button>
                        <button class="btn btn-outline" onclick="buyNow('${product['Product ID']}')">
                            এখনই কিনুন
                        </button>
                    </div>
                </div>
                
                <div class="product-features">
                    <div class="feature">
                        <div class="feature-icon">🚚</div>
                        <div class="feature-text">
                            <strong>ফাস্ট ডেলিভারি</strong>
                            <span>২-৩ কর্মদিবসে</span>
                        </div>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">💳</div>
                        <div class="feature-text">
                            <strong>ক্যাশ অন ডেলিভারি</strong>
                            <span>সুরক্ষিত পেমেন্ট</span>
                        </div>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">↩️</div>
                        <div class="feature-text">
                            <strong>রিটার্ন পলিসি</strong>
                            <span>৭ দিনের মধ্যে</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Update category in breadcrumb
    const categoryElement = document.getElementById('productCategory');
    if (categoryElement) {
        categoryElement.textContent = category;
    }
}

// Get All Product Images
function getProductImages(product) {
    const images = [];
    
    // Add main image
    if (product['Main Image']) {
        images.push(product['Main Image']);
    }
    
    // Add additional images
    for (let i = 1; i <= 10; i++) {
        const imageKey = `Image${i}`;
        if (product[imageKey]) {
            images.push(product[imageKey]);
        }
    }
    
    // If no images found, use placeholder
    if (images.length === 0) {
        images.push('assets/images/placeholder.jpg');
    }
    
    return images;
}

// Change Main Image
function changeMainImage(imageUrl, thumbElement) {
    const mainImage = document.getElementById('mainImage');
    if (mainImage) {
        mainImage.src = imageUrl;
    }
    
    // Update active thumbnail
    document.querySelectorAll('.thumb').forEach(thumb => {
        thumb.classList.remove('active');
    });
    thumbElement.classList.add('active');
}

// Quantity Controls
function increaseQuantity() {
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue < 10) {
            quantityInput.value = currentValue + 1;
        }
    }
}

function decreaseQuantity() {
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
        }
    }
}

// Add to Cart with Quantity
function addToCartWithQuantity(productId) {
    const quantityInput = document.getElementById('quantity');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    
    const product = getProductById(productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
        showNotification(`${product.Name} - ${quantity}টি যোগ করা হয়েছে`);
    } else {
        const price = parseInt(product['Price (BDT)']) || 0;
        cart.push({
            id: productId,
            name: product.Name,
            price: price,
            image: product['Main Image'] || product.Image1 || 'assets/images/placeholder.jpg',
            quantity: quantity
        });
        showNotification(`${product.Name} - কার্টে যোগ করা হয়েছে`);
    }
    
    updateCartUI();
    saveCartToStorage();
    
    // Show cart modal
    toggleCart();
}

// Buy Now Functionality
function buyNow(productId) {
    addToCartWithQuantity(productId);
    
    // Redirect to checkout after a short delay
    setTimeout(() => {
        window.location.href = 'checkout.html';
    }, 1000);
}

// Load Related Products
function loadRelatedProducts(product) {
    const container = document.getElementById('relatedProducts');
    if (!container) return;
    
    const relatedProducts = getRelatedProducts(product, 4);
    
    if (relatedProducts.length === 0) {
        container.innerHTML = `
            <div class="no-related-products">
                <p>এই মুহূর্তে কোন সম্পর্কিত প্রোডাক্ট নেই</p>
            </div>
        `;
        return;
    }
    
    displayProducts(relatedProducts, 'relatedProducts');
}

// Image Zoom Functionality (for desktop)
function initImageZoom() {
    const mainImage = document.getElementById('mainImage');
    if (!mainImage) return;
    
    mainImage.addEventListener('mousemove', function(e) {
        if (window.innerWidth > 768) {
            const rect = this.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            this.style.transformOrigin = `${x}% ${y}%`;
            this.style.transform = 'scale(2)';
        }
    });
    
    mainImage.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
}

// Share Product
function shareProduct() {
    if (navigator.share) {
        navigator.share({
            title: currentProduct.Name,
            text: currentProduct.Description,
            url: window.location.href,
        })
        .then(() => showNotification('শেয়ার করা হয়েছে!'))
        .catch(error => console.log('Error sharing:', error));
    } else {
        copyToClipboard(window.location.href);
    }
}

// Initialize Product Page
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('product.html')) {
        loadProductDetail();
        initImageZoom();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadProductDetail,
        displayProductDetail,
        getProductImages,
        changeMainImage,
        increaseQuantity,
        decreaseQuantity,
        addToCartWithQuantity,
        buyNow,
        loadRelatedProducts,
        initImageZoom,
        shareProduct
    };
}