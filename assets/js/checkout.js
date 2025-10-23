// Checkout Page Functionality

// Initialize Checkout Page
function initializeCheckoutPage() {
    updateCheckoutPage();
    setupCheckoutForm();
    setupDeliveryAreaCalculation();
}

// Setup Checkout Form
function setupCheckoutForm() {
    const checkoutForm = document.getElementById('checkoutForm');
    if (!checkoutForm) return;

    checkoutForm.addEventListener('submit', handleCheckoutSubmit);
    
    // Real-time form validation
    const inputs = checkoutForm.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
    
    // Delivery area change event
    const deliveryArea = document.getElementById('deliveryArea');
    if (deliveryArea) {
        deliveryArea.addEventListener('change', updateDeliveryFee);
    }
}

// Setup Delivery Area Calculation
function setupDeliveryAreaCalculation() {
    const addressField = document.getElementById('address');
    const deliveryArea = document.getElementById('deliveryArea');
    
    if (addressField && deliveryArea) {
        addressField.addEventListener('blur', function() {
            const address = this.value.toLowerCase();
            const dhakaAreas = ['ঢাকা', 'dhaka', 'মিরপুর', 'উত্তরা', 'গুলশান', 'বনানী', 'ধানমন্ডি', 'মোহাম্মদপুর'];
            
            const isInsideDhaka = dhakaAreas.some(area => address.includes(area));
            
            if (isInsideDhaka && deliveryArea.value !== 'inside_dhaka') {
                deliveryArea.value = 'inside_dhaka';
                updateDeliveryFee();
            }
        });
    }
}

// Update Delivery Fee
function updateDeliveryFee() {
    const deliveryArea = document.getElementById('deliveryArea');
    const checkoutDelivery = document.getElementById('checkoutDelivery');
    
    if (deliveryArea && checkoutDelivery) {
        const deliveryFee = deliveryArea.value === 'inside_dhaka' ? 80 : 150;
        checkoutDelivery.textContent = formatPrice(deliveryFee);
        
        // Update total
        updateCheckoutTotal(deliveryFee);
    }
}

// Update Checkout Total
function updateCheckoutTotal(deliveryFee) {
    const checkoutSubtotal = document.getElementById('checkoutSubtotal');
    const checkoutTotal = document.getElementById('checkoutTotal');
    
    if (checkoutSubtotal && checkoutTotal) {
        const subtotalText = checkoutSubtotal.textContent.replace('৳', '').replace(/,/g, '');
        const subtotal = parseInt(subtotalText) || 0;
        const total = subtotal + deliveryFee;
        
        checkoutTotal.textContent = formatPrice(total);
    }
}

// Validate Form Field
function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    const fieldName = field.getAttribute('name');
    
    let isValid = true;
    let errorMessage = '';
    
    switch (fieldName) {
        case 'customerName':
            if (value.length < 2) {
                isValid = false;
                errorMessage = 'নাম অবশ্যই কমপক্ষে ২ অক্ষরের হতে হবে';
            }
            break;
            
        case 'phone':
            if (!validatePhone(value)) {
                isValid = false;
                errorMessage = 'সঠিক মোবাইল নম্বর দিন (০১XXXXXXXXX)';
            }
            break;
            
        case 'email':
            if (value && !validateEmail(value)) {
                isValid = false;
                errorMessage = 'সঠিক ইমেইল ঠিকানা দিন';
            }
            break;
            
        case 'address':
            if (value.length < 10) {
                isValid = false;
                errorMessage = 'বিস্তারিত ঠিকানা দিন (কমপক্ষে ১০ অক্ষর)';
            }
            break;
            
        case 'deliveryArea':
            if (!value) {
                isValid = false;
                errorMessage = 'এলাকা নির্বাচন করুন';
            }
            break;
    }
    
    if (!isValid) {
        showFieldError(field, errorMessage);
    } else {
        clearFieldError({ target: field });
    }
    
    return isValid;
}

// Show Field Error
function showFieldError(field, message) {
    clearFieldError({ target: field });
    
    field.classList.add('error');
    
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    
    field.parentNode.appendChild(errorElement);
}

// Clear Field Error
function clearFieldError(e) {
    const field = e.target;
    field.classList.remove('error');
    
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

// Handle Checkout Submit
async function handleCheckoutSubmit(e) {
    e.preventDefault();
    
    if (cart.length === 0) {
        showNotification('আপনার কার্ট খালি!', 'error');
        return;
    }
    
    // Validate all fields
    const form = e.target;
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    let isFormValid = true;
    
    inputs.forEach(input => {
        const event = new Event('blur');
        input.dispatchEvent(event);
        
        if (input.classList.contains('error')) {
            isFormValid = false;
        }
    });
    
    if (!isFormValid) {
        showNotification('দয়া করে সকল প্রয়োজনীয় তথ্য সঠিকভাবে পূরণ করুন', 'error');
        return;
    }
    
    // Prepare order data
    const orderData = prepareOrderData(form);
    
    // Disable submit button
    const submitBtn = document.getElementById('placeOrderBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'অর্ডার প্রসেস হচ্ছে...';
    }
    
    try {
        // Submit order to API
        const result = await submitOrder(orderData);
        
        if (result.success) {
            // Clear cart and redirect to success page
            clearCart();
            window.location.href = `success.html?order_id=${result.data.order_id}`;
        } else {
            throw new Error(result.error || 'অর্ডার সাবমিট করতে সমস্যা হচ্ছে');
        }
    } catch (error) {
        console.error('Order submission error:', error);
        showNotification(error.message || 'অর্ডার সাবমিট করতে সমস্যা হচ্ছে', 'error');
        
        // Re-enable submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'অর্ডার কনফার্ম করুন';
        }
    }
}

// Prepare Order Data
function prepareOrderData(form) {
    const formData = new FormData(form);
    const deliveryArea = document.getElementById('deliveryArea');
    const deliveryFee = deliveryArea.value === 'inside_dhaka' ? 80 : 150;
    
    return {
        customer_name: formData.get('customerName'),
        phone: formData.get('phone'),
        email: formData.get('email') || '',
        address: formData.get('address'),
        delivery_area: formData.get('deliveryArea'),
        payment_method: formData.get('paymentMethod') || 'cash',
        special_notes: formData.get('specialNotes') || '',
        products: cart.map(item => ({
            product_id: item.id,
            product_name: item.name,
            price: item.price,
            quantity: item.quantity,
            color: '', // You can add color selection in the future
            main_image: item.image
        })),
        delivery_fee: deliveryFee,
        total_amount: getCartTotal() + deliveryFee
    };
}

// Submit Order to API
async function submitOrder(orderData) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw new Error('নেটওয়ার্ক সমস্যা। পরে আবার চেষ্টা করুন।');
    }
}

// Display Order Success
function displayOrderSuccess() {
    const orderId = getQueryParam('order_id');
    const orderDetails = document.getElementById('orderDetails');
    
    if (orderId && orderDetails) {
        orderDetails.innerHTML = `
            <div class="order-success-details">
                <div class="order-info">
                    <div class="info-item">
                        <strong>অর্ডার নম্বর:</strong>
                        <span>${orderId}</span>
                    </div>
                    <div class="info-item">
                        <strong>অর্ডার তারিখ:</strong>
                        <span>${formatDate(new Date())}</span>
                    </div>
                    <div class="info-item">
                        <strong>স্ট্যাটাস:</strong>
                        <span class="status-pending">প্রসেসিং</span>
                    </div>
                </div>
                <div class="delivery-info">
                    <h4>ডেলিভারি তথ্য</h4>
                    <p>আমরা শীঘ্রই আপনার অর্ডারটি প্রসেস করব এবং আপনার সাথে যোগাযোগ করব।</p>
                    <p>যেকোনো প্রয়োজনে আমাদের হেল্পলাইনে কল করুন।</p>
                </div>
            </div>
        `;
    }
    
    // Update success message
    const successMessage = document.getElementById('successMessage');
    if (successMessage && orderId) {
        successMessage.innerHTML = `
            আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে!<br>
            অর্ডার নম্বর: <strong>${orderId}</strong>
        `;
    }
}

// Initialize checkout page when loaded
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('checkout.html')) {
        initializeCheckoutPage();
    }
    
    if (window.location.pathname.includes('success.html')) {
        displayOrderSuccess();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeCheckoutPage,
        setupCheckoutForm,
        handleCheckoutSubmit,
        prepareOrderData,
        submitOrder,
        displayOrderSuccess
    };
}