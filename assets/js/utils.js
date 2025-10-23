// Utility Functions for Tiny Steps BD

// API Configuration
const API_URL = 'https://script.google.com/macros/s/AKfycbyW3ZHdsQI2ohP6Fk3CAHhsYp4n_YY3BC9cJDedRqSqMMeL4a4BswE-DHbDuYChJlwM/exec';

// Global Variables
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Utility Functions
function formatPrice(price) {
    return `৳${parseInt(price).toLocaleString('bn-BD')}`;
}

function formatNumber(num) {
    return parseInt(num).toLocaleString('bn-BD');
}

function showNotification(message, type = 'success') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add styles for different types
    if (type === 'error') {
        notification.style.backgroundColor = '#ff6b6b';
    } else if (type === 'warning') {
        notification.style.backgroundColor = '#ffd93d';
        notification.style.color = '#333';
    }
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function setQueryParam(param, value) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set(param, value);
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
}

function formatPhoneNumber(phone) {
    // Format Bangladeshi phone numbers
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('01')) {
        return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    return phone;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^(?:\+88|01)?(?:\d{11}|\d{13})$/;
    return re.test(phone.replace(/\D/g, ''));
}

function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function getCartItemCount() {
    return cart.reduce((count, item) => count + item.quantity, 0);
}

function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        showNotification('ডাটা সেভ করতে সমস্যা হচ্ছে', 'error');
        return false;
    }
}

function loadFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return null;
    }
}

function formatDate(date) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(date).toLocaleDateString('bn-BD', options);
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

function generateOrderId() {
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TS-${timestamp}-${random}`;
}

function calculateDeliveryFee(area) {
    const dhakaAreas = ['ঢাকা', 'Dhaka', 'DHAKA', 'মিরপুর', 'উত্তরা', 'গুলশান', 'বনানী', 'ধানমন্ডি', 'মোহাম্মদপুর', 'ফার্মগেট', 'শাহবাগ', 'যাত্রাবাড়ী', 'রামপুরা', 'বাড্ডা'];
    
    if (area && dhakaAreas.some(dhakaArea => area.toLowerCase().includes(dhakaArea.toLowerCase()))) {
        return 80;
    }
    return 150;
}

function loadComponent(elementId, filePath) {
    return new Promise((resolve, reject) => {
        fetch(filePath)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(html => {
                document.getElementById(elementId).innerHTML = html;
                resolve();
            })
            .catch(error => {
                console.error('Error loading component:', error);
                reject(error);
            });
    });
}

function preloadImages(imageUrls) {
    return Promise.all(
        imageUrls.map(url => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = url;
                img.onload = resolve;
                img.onerror = reject;
            });
        })
    );
}

function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = formatNumber(value);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function createSkeletonLoader(count, type = 'product') {
    let skeletonHTML = '';
    for (let i = 0; i < count; i++) {
        if (type === 'product') {
            skeletonHTML += `
                <div class="product-card skeleton">
                    <div class="skeleton-image"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-line short"></div>
                        <div class="skeleton-line medium"></div>
                        <div class="skeleton-line long"></div>
                    </div>
                </div>
            `;
        }
    }
    return skeletonHTML;
}

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function getDeviceType() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
}

function scrollToElement(elementId, offset = 100) {
    const element = document.getElementById(elementId);
    if (element) {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('কপি করা হয়েছে!');
    }).catch(err => {
        console.error('Could not copy text: ', err);
        showNotification('কপি করতে সমস্যা হচ্ছে', 'error');
    });
}

// Initialize utility functions when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add skeleton loader styles if not already present
    if (!document.querySelector('#skeleton-styles')) {
        const styles = `
            <style id="skeleton-styles">
                .skeleton {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: loading 1.5s infinite;
                    border-radius: 8px;
                }
                .skeleton-image {
                    height: 200px;
                    background: #ddd;
                    border-radius: 8px 8px 0 0;
                }
                .skeleton-content {
                    padding: 1rem;
                }
                .skeleton-line {
                    height: 12px;
                    background: #eee;
                    margin-bottom: 8px;
                    border-radius: 4px;
                }
                .skeleton-line.short { width: 60%; }
                .skeleton-line.medium { width: 80%; }
                .skeleton-line.long { width: 100%; }
                @keyframes loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatPrice,
        formatNumber,
        showNotification,
        debounce,
        getQueryParam,
        setQueryParam,
        formatPhoneNumber,
        validateEmail,
        validatePhone,
        getCartTotal,
        getCartItemCount,
        saveToLocalStorage,
        loadFromLocalStorage,
        formatDate,
        truncateText,
        generateOrderId,
        calculateDeliveryFee,
        loadComponent,
        preloadImages,
        animateValue,
        createSkeletonLoader,
        isMobileDevice,
        getDeviceType,
        scrollToElement,
        copyToClipboard
    };
}