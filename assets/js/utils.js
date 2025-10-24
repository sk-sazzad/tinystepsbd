/**
 * TinyStepsBD - Utility Functions
 * সাধারণ ইউটিলিটি ফাংশনসমূহ
 */

// API Configuration
const TINYSTEPSBD_CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbyW3ZHdsQI2ohP6Fk3CAHhsYp4n_YY3BC9cJDedRqSqMMeL4a4BswE-DHbDuYChJlwM/exec',
    CACHE_TIMEOUT: 5 * 60 * 1000, // 5 minutes
    CART_KEY: 'tinystepsbd_cart',
    WISHLIST_KEY: 'tinystepsbd_wishlist',
    RECENT_VIEWED_KEY: 'tinystepsbd_recent_viewed'
};

// ===== DOM Utilities =====
const DOM = {
    // Get element by selector
    get(selector) {
        return document.querySelector(selector);
    },

    // Get all elements by selector
    getAll(selector) {
        return document.querySelectorAll(selector);
    },

    // Create element with attributes
    create(tag, attributes = {}, text = '') {
        const element = document.createElement(tag);
        Object.keys(attributes).forEach(key => {
            element.setAttribute(key, attributes[key]);
        });
        if (text) element.textContent = text;
        return element;
    },

    // Add event listener with delegation
    on(event, selector, handler) {
        document.addEventListener(event, function(e) {
            if (e.target.matches(selector)) {
                handler(e);
            }
        });
    },

    // Toggle class on element
    toggleClass(element, className) {
        element.classList.toggle(className);
    },

    // Show element
    show(element) {
        element.style.display = 'block';
    },

    // Hide element
    hide(element) {
        element.style.display = 'none';
    },

    // Fade in element
    fadeIn(element, duration = 300) {
        element.style.opacity = 0;
        element.style.display = 'block';
        
        let start = null;
        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = Math.min(progress / duration, 1);
            element.style.opacity = opacity;
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            }
        }
        requestAnimationFrame(animate);
    },

    // Fade out element
    fadeOut(element, duration = 300) {
        let start = null;
        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = Math.max(1 - progress / duration, 0);
            element.style.opacity = opacity;
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        }
        requestAnimationFrame(animate);
    }
};

// ===== Storage Utilities =====
const Storage = {
    // Set item in localStorage
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    },

    // Get item from localStorage
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    },

    // Remove item from localStorage
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    },

    // Clear all items
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    },

    // Get cart data
    getCart() {
        return this.get(TINYSTEPSBD_CONFIG.CART_KEY, []);
    },

    // Save cart data
    saveCart(cartData) {
        return this.set(TINYSTEPSBD_CONFIG.CART_KEY, cartData);
    },

    // Get wishlist data
    getWishlist() {
        return this.get(TINYSTEPSBD_CONFIG.WISHLIST_KEY, []);
    },

    // Save wishlist data
    saveWishlist(wishlistData) {
        return this.set(TINYSTEPSBD_CONFIG.WISHLIST_KEY, wishlistData);
    },

    // Get recently viewed
    getRecentViewed() {
        return this.get(TINYSTEPSBD_CONFIG.RECENT_VIEWED_KEY, []);
    },

    // Save recently viewed
    saveRecentViewed(items) {
        return this.set(TINYSTEPSBD_CONFIG.RECENT_VIEWED_KEY, items);
    }
};

// ===== Formatting Utilities =====
const Format = {
    // Format price with Bengali numerals
    price(amount) {
        const bengaliNumerals = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        const priceStr = Math.round(amount).toString();
        return priceStr.split('').map(digit => bengaliNumerals[parseInt(digit)]).join('') + ' ৳';
    },

    // Format number with commas (English)
    numberWithCommas(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    // Format date in Bengali
    date(dateString) {
        const date = new Date(dateString);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            timeZone: 'Asia/Dhaka'
        };
        return new Intl.DateTimeFormat('bn-BD', options).format(date);
    },

    // Format date time in Bengali
    dateTime(dateString) {
        const date = new Date(dateString);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Dhaka'
        };
        return new Intl.DateTimeFormat('bn-BD', options).format(date);
    },

    // Truncate text with ellipsis
    truncate(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    },

    // Capitalize first letter
    capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
};

// ===== Validation Utilities =====
const Validate = {
    // Validate email
    email(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    // Validate Bangladeshi phone number
    phone(phone) {
        const regex = /^01[3-9]\d{8}$/;
        return regex.test(phone);
    },

    // Validate required field
    required(value) {
        return value !== null && value !== undefined && value.toString().trim() !== '';
    },

    // Validate minimum length
    minLength(value, min) {
        return value.toString().length >= min;
    },

    // Validate maximum length
    maxLength(value, max) {
        return value.toString().length <= max;
    },

    // Validate number range
    numberRange(value, min, max) {
        const num = parseFloat(value);
        return !isNaN(num) && num >= min && num <= max;
    },

    // Validate form
    form(formData, rules) {
        const errors = {};
        
        Object.keys(rules).forEach(field => {
            const value = formData[field];
            const fieldRules = rules[field];
            
            for (const rule of fieldRules) {
                if (rule === 'required' && !this.required(value)) {
                    errors[field] = 'এই ফিল্ডটি পূরণ করা বাধ্যতামূলক';
                    break;
                }
                
                if (rule.startsWith('min:') && !this.minLength(value, parseInt(rule.split(':')[1]))) {
                    errors[field] = `ন্যূনতম ${rule.split(':')[1]} অক্ষর প্রয়োজন`;
                    break;
                }
                
                if (rule.startsWith('max:') && !this.maxLength(value, parseInt(rule.split(':')[1]))) {
                    errors[field] = `সর্বোচ্চ ${rule.split(':')[1]} অক্ষর অনুমোদিত`;
                    break;
                }
                
                if (rule === 'email' && !this.email(value)) {
                    errors[field] = 'সঠিক ইমেইল ঠিকানা লিখুন';
                    break;
                }
                
                if (rule === 'phone' && !this.phone(value)) {
                    errors[field] = 'সঠিক মোবাইল নম্বর লিখুন (01XXXXXXXXX)';
                    break;
                }
            }
        });
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
};

// ===== API Utilities =====
const API = {
    // Make GET request
    async get(endpoint, params = {}) {
        try {
            const url = new URL(TINYSTEPSBD_CONFIG.API_URL);
            Object.keys(params).forEach(key => {
                url.searchParams.append(key, params[key]);
            });
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API GET error:', error);
            throw error;
        }
    },

    // Make POST request
    async post(endpoint, data = {}) {
        try {
            const response = await fetch(TINYSTEPSBD_CONFIG.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API POST error:', error);
            throw error;
        }
    },

    // Get all products
    async getProducts() {
        return await this.get('', { action: 'products' });
    },

    // Get single product
    async getProduct(id) {
        return await this.get('', { action: 'product', id });
    },

    // Submit order
    async submitOrder(orderData) {
        return await this.post('', {
            ...orderData,
            action: 'create_order'
        });
    }
};

// ===== Notification Utilities =====
const Notify = {
    // Show success notification
    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    },

    // Show error notification
    error(message, duration = 5000) {
        this.show(message, 'error', duration);
    },

    // Show warning notification
    warning(message, duration = 4000) {
        this.show(message, 'warning', duration);
    },

    // Show info notification
    info(message, duration = 3000) {
        this.show(message, 'info', duration);
    },

    // Show notification
    show(message, type = 'info', duration = 3000) {
        // Remove existing notifications
        this.clear();

        const notification = DOM.create('div', {
            'class': `notification notification-${type}`
        }, message);

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 15px 20px;
            background: ${this.getBackgroundColor(type)};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                DOM.fadeOut(notification, 300);
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, duration);
    },

    // Get background color for notification type
    getBackgroundColor(type) {
        const colors = {
            success: '#4CAF50',
            error: '#F44336',
            warning: '#FFA000',
            info: '#2196F3'
        };
        return colors[type] || colors.info;
    },

    // Clear all notifications
    clear() {
        const notifications = DOM.getAll('.notification');
        notifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }
};

// ===== Image Utilities =====
const ImageUtils = {
    // Preload images
    preload(urls) {
        return Promise.all(
            urls.map(url => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = url;
                });
            })
        );
    },

    // Get image placeholder on error
    handleImageError(event) {
        event.target.src = 'assets/images/placeholder.jpg';
        event.target.onerror = null; // Prevent infinite loop
    },

    // Lazy load images
    lazyLoad() {
        const lazyImages = DOM.getAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    }
};

// ===== Currency Utilities =====
const Currency = {
    // Convert number to Bengali numerals
    toBengaliNumerals(number) {
        const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        return number.toString().replace(/\d/g, digit => bengaliDigits[parseInt(digit)]);
    },

    // Format currency in Bengali
    formatBDT(amount) {
        return this.toBengaliNumerals(amount) + ' ৳';
    },

    // Calculate delivery charge based on area
    calculateDelivery(area, subtotal = 0) {
        const deliveryRates = {
            'inside_dhaka': 80,
            'outside_dhaka': 150,
            'outside_divisional': 200
        };

        // Free delivery for orders above 2000 BDT
        if (subtotal >= 2000) {
            return 0;
        }

        return deliveryRates[area] || deliveryRates['outside_dhaka'];
    },

    // Calculate total amount
    calculateTotal(subtotal, delivery, discount = 0) {
        return subtotal + delivery - discount;
    }
};

// ===== URL Utilities =====
const URLUtils = {
    // Get URL parameters
    getParams() {
        const params = {};
        const urlParams = new URLSearchParams(window.location.search);
        
        for (const [key, value] of urlParams) {
            params[key] = value;
        }
        
        return params;
    },

    // Set URL parameter
    setParam(key, value) {
        const url = new URL(window.location);
        url.searchParams.set(key, value);
        window.history.replaceState({}, '', url);
    },

    // Remove URL parameter
    removeParam(key) {
        const url = new URL(window.location);
        url.searchParams.delete(key);
        window.history.replaceState({}, '', url);
    },

    // Get product ID from URL
    getProductId() {
        return this.getParams().id;
    },

    // Get order ID from URL
    getOrderId() {
        return this.getParams().order_id;
    }
};

// ===== Performance Utilities =====
const Performance = {
    // Debounce function
    debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Measure function performance
    measure(func, name = 'Function') {
        const start = performance.now();
        const result = func();
        const end = performance.now();
        console.log(`${name} executed in: ${(end - start).toFixed(2)}ms`);
        return result;
    }
};

// ===== Export for use in other files =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DOM,
        Storage,
        Format,
        Validate,
        API,
        Notify,
        ImageUtils,
        Currency,
        URLUtils,
        Performance,
        TINYSTEPSBD_CONFIG
    };
}