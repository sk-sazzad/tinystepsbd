class Product {
    constructor(id, name, price, category, ageRange, description, images, stock, features) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.category = category; // clothes, toys, feeding, etc.
        this.ageRange = ageRange; // 0-6m, 6-12m, 1-2y, etc.
        this.description = description;
        this.images = images;
        this.stock = stock;
        this.features = features; // safety features, materials, etc.
        this.rating = 0;
        this.reviews = [];
    }

    // Calculate discount price
    calculateDiscount(discountPercentage) {
        return this.price * (1 - discountPercentage / 100);
    }

    // Check if product is in stock
    isInStock() {
        return this.stock > 0;
    }

    // Update stock quantity
    updateStock(quantity) {
        this.stock += quantity;
    }

    // Add review with safety validation for children's products
    addReview(review) {
        // Validate review for children's product standards
        if (this.validateReview(review)) {
            this.reviews.push(review);
            this.calculateAverageRating();
        }
    }

    // Calculate average rating
    calculateAverageRating() {
        if (this.reviews.length === 0) {
            this.rating = 0;
            return;
        }
        const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
        this.rating = total / this.reviews.length;
    }

    // Validate review for children's products
    validateReview(review) {
        // Check for appropriate content in reviews
        const inappropriateKeywords = ['unsafe', 'dangerous', 'harmful'];
        const hasInappropriateContent = inappropriateKeywords.some(keyword => 
            review.comment.toLowerCase().includes(keyword)
        );
        
        return !hasInappropriateContent && review.rating >= 1 && review.rating <= 5;
    }

    // Get product details for display
    getProductDetails() {
        return {
            id: this.id,
            name: this.name,
            price: this.price,
            category: this.category,
            ageRange: this.ageRange,
            description: this.description,
            stock: this.stock,
            rating: this.rating,
            reviewCount: this.reviews.length,
            features: this.features
        };
    }

    // Check if product is age-appropriate for given age
    isAgeAppropriate(childAge) {
        const ageRanges = {
            '0-6m': { min: 0, max: 0.5 },
            '6-12m': { min: 0.5, max: 1 },
            '1-2y': { min: 1, max: 2 },
            '2-4y': { min: 2, max: 4 },
            '4-6y': { min: 4, max: 6 }
        };

        const range = ageRanges[this.ageRange];
        if (!range) return true; // If no specific range, assume appropriate
        
        return childAge >= range.min && childAge <= range.max;
    }
}

// Product categories specific to children's store
const ProductCategories = {
    CLOTHING: 'clothing',
    TOYS: 'toys',
    FEEDING: 'feeding',
    DIAPERING: 'diapering',
    BATH: 'bath',
    SAFETY: 'safety',
    FURNITURE: 'furniture',
    GEAR: 'gear'
};

// Age ranges for products
const AgeRanges = {
    NEWBORN: '0-3m',
    INFANT: '3-12m',
    TODDLER: '1-3y',
    PRESCHOOL: '3-5y',
    SCHOOL_AGE: '5-8y'
};

export { Product, ProductCategories, AgeRanges };