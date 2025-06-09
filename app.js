// Stock Restaurant Management App
class StockManager {
    constructor() {
        this.products = this.loadProducts();
        this.categories = this.loadCategories();
        this.currentCategory = 'all';
        this.currentSection = 'stock';
        this.editingProductId = null;
        this.editingCategoryId = null;
        
        this.init();
    }

    init() {
        this.extractCategoriesFromProducts();
        this.validateProductCategories();
        this.setupEventListeners();
        this.renderProducts();
        this.renderCategoryFilters();
        this.updateCategoryCounts();
        this.updateAlerts();
        this.setupPWA();
        this.setupImportHandler();
    }

    // Data Management
    loadCategories() {
        const saved = localStorage.getItem('restaurant_categories');
        if (saved) {
            return JSON.parse(saved);
        }
        
        // Default categories with icons
        return [
            { id: 'carne', name: 'Carne', icon: '🥩', isDefault: true },
            { id: 'verdure', name: 'Verdure', icon: '🥬', isDefault: true },
            { id: 'formaggi', name: 'Formaggi', icon: '🧀', isDefault: true },
            { id: 'pasta', name: 'Pasta', icon: '🍝', isDefault: true },
            { id: 'condimenti', name: 'Condimenti', icon: '🫒', isDefault: true },
            { id: 'pesce', name: 'Pesce', icon: '🐟', isDefault: true },
            { id: 'dolci', name: 'Dolci', icon: '🍰', isDefault: true },
            { id: 'pane', name: 'Pane', icon: '🍞', isDefault: true },
            { id: 'bevande', name: 'Bevande', icon: '🥤', isDefault: true },
            { id: 'altri', name: 'Altri', icon: '📦', isDefault: true }
        ];
    }

    saveCategories() {
        localStorage.setItem('restaurant_categories', JSON.stringify(this.categories));
    }

    extractCategoriesFromProducts() {
        // Extract unique categories from products
        const productCategories = [...new Set(this.products.map(p => p.category))];
        
        // Add missing categories from products
        productCategories.forEach(categoryId => {
            if (!this.categories.find(c => c.id === categoryId)) {
                this.categories.push({
                    id: categoryId,
                    name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
                    icon: this.getDefaultCategoryIcon(categoryId),
                    isDefault: false
                });
            }
        });
        
        this.saveCategories();
    }

    getDefaultCategoryIcon(categoryId) {
        const defaultIcons = {
            'carne': '🥩',
            'verdure': '🥬',
            'frutta': '🍎',
            'formaggi': '🧀',
            'pasta': '🍝',
            'condimenti': '🫒',
            'pesce': '🐟',
            'dolci': '🍰',
            'pane': '🍞',
            'bevande': '🥤',
            'latticini': '🥛',
            'spezie': '🌶️',
            'conserve': '🥫',
            'surgelati': '🧊',
            'altri': '📦'
        };
        return defaultIcons[categoryId] || '📦';
    }

    addCategory(categoryData) {
        const newCategory = {
            id: categoryData.id || categoryData.name.toLowerCase().replace(/\s+/g, '_'),
            name: categoryData.name,
            icon: categoryData.icon || '📦',
            isDefault: false
        };
        
        // Check if category already exists
        if (this.categories.find(c => c.id === newCategory.id)) {
            this.showToast('❌ Categoria già esistente', 'error');
            return false;
        }
        
        this.categories.push(newCategory);
        this.saveCategories();
        this.renderCategoryFilters();
        this.renderCategoryStats();
        this.updateCategoryCounts();
        
        this.showToast('✅ Categoria aggiunta', 'success');
        return true;
    }

    updateCategory(categoryId, categoryData) {
        const index = this.categories.findIndex(c => c.id === categoryId);
        if (index !== -1) {
            // Update category
            this.categories[index] = {
                ...this.categories[index],
                name: categoryData.name,
                icon: categoryData.icon
            };
            
            this.saveCategories();
            this.renderCategoryFilters();
            this.renderCategoryStats();
            this.updateCategoryCounts();
            
            this.showToast('✅ Categoria aggiornata', 'success');
        }
    }

    deleteCategory(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) return;
        
        // Check if category has products
        const categoryProducts = this.products.filter(p => p.category === categoryId);
        
        if (categoryProducts.length > 0) {
            // Show modal to reassign products
            this.showReassignProductsModal(categoryId, categoryProducts);
        } else {
            // Delete category directly
            this.categories = this.categories.filter(c => c.id !== categoryId);
            this.saveCategories();
            this.renderCategoryFilters();
            this.renderCategoryStats();
            this.updateCategoryCounts();
            
            this.showToast('🗑️ Categoria eliminata', 'warning');
        }
    }

    reassignProducts(oldCategoryId, newCategoryId) {
        this.products.forEach(product => {
            if (product.category === oldCategoryId) {
                product.category = newCategoryId;
            }
        });
        
        this.saveProducts();
        
        // Now delete the old category
        this.categories = this.categories.filter(c => c.id !== oldCategoryId);
        this.saveCategories();
        
        this.renderProducts();
        this.renderCategoryFilters();
        this.renderCategoryStats();
        this.updateCategoryCounts();
        
        this.showToast('✅ Prodotti riassegnati e categoria eliminata', 'success');
    }

    validateProductCategories() {
        let hasChanges = false;
        const defaultCategory = this.categories.find(c => c.isDefault) || this.categories[0];
        
        this.products.forEach(product => {
            // Check if product has a valid category
            if (!product.category || !this.categories.find(c => c.id === product.category)) {
                product.category = defaultCategory.id;
                hasChanges = true;
            }
        });
        
        if (hasChanges) {
            this.saveProducts();
            console.log('Fixed products with invalid categories');
        }
    }

    loadProducts() {
        const saved = localStorage.getItem('restaurant_stock');
        if (saved) {
            return JSON.parse(saved);
        }
        
        // Complete product list pre-loaded
        return [
            // Formaggi
            { id: 1, name: 'Caciotta', category: 'formaggi', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 2, name: 'Taleggio', category: 'formaggi', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 3, name: 'Gorgonzola', category: 'formaggi', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 4, name: 'Mozzarella', category: 'formaggi', quantity: 5, minThreshold: 3, unit: 'pz' },
            { id: 5, name: 'Burrata', category: 'formaggi', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 6, name: 'Philadelphia', category: 'formaggi', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 7, name: 'Pecorino S.S', category: 'formaggi', quantity: 0, minThreshold: 1, unit: 'pz' },
            { id: 8, name: 'Pecorino buste', category: 'formaggi', quantity: 0, minThreshold: 3, unit: 'pz' },
            { id: 9, name: 'Feta', category: 'formaggi', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 10, name: 'Mascarpone', category: 'formaggi', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 11, name: 'Scamorza', category: 'formaggi', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 12, name: 'Prima blanca', category: 'formaggi', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 13, name: 'Strangozzi', category: 'formaggi', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 14, name: 'Parmigiano', category: 'formaggi', quantity: 0, minThreshold: 1, unit: 'pz' },
            { id: 15, name: 'Ricotta', category: 'formaggi', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 16, name: 'Provolone', category: 'formaggi', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 17, name: 'Fontina', category: 'formaggi', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 18, name: 'Asiago', category: 'formaggi', quantity: 0, minThreshold: 2, unit: 'pz' },
            
            // Salumi/Carni
            { id: 19, name: 'Pollo', category: 'carne', quantity: 0, minThreshold: 2, unit: 'kg' },
            { id: 20, name: 'Filetto', category: 'carne', quantity: 0, minThreshold: 1, unit: 'kg' },
            { id: 21, name: 'Contro filetto', category: 'carne', quantity: 0, minThreshold: 1, unit: 'kg' },
            { id: 22, name: 'Bistecche', category: 'carne', quantity: 6, minThreshold: 3, unit: 'pz' },
            { id: 23, name: 'Salsiccie', category: 'carne', quantity: 0, minThreshold: 5, unit: 'pz' },
            { id: 24, name: 'Macinato', category: 'carne', quantity: 0, minThreshold: 1, unit: 'kg' },
            { id: 25, name: 'Culatello', category: 'carne', quantity: 0, minThreshold: 1, unit: 'pz' },
            { id: 26, name: 'Capocollo', category: 'carne', quantity: 0, minThreshold: 1, unit: 'pz' },
            { id: 27, name: 'Guanciale', category: 'carne', quantity: 0, minThreshold: 1, unit: 'pz' },
            { id: 28, name: 'Mortadella', category: 'carne', quantity: 0, minThreshold: 1, unit: 'pz' },
            { id: 29, name: 'Prosciutto crudo', category: 'carne', quantity: 0, minThreshold: 1, unit: 'pz' },
            { id: 30, name: 'Prosciutto cotto', category: 'carne', quantity: 0, minThreshold: 1, unit: 'pz' },
            { id: 31, name: 'Bresaola', category: 'carne', quantity: 0, minThreshold: 1, unit: 'pz' },
            { id: 32, name: 'Speck', category: 'carne', quantity: 0, minThreshold: 1, unit: 'pz' },
            { id: 33, name: 'Pancetta', category: 'carne', quantity: 0, minThreshold: 1, unit: 'pz' },
            { id: 34, name: 'Agnello', category: 'carne', quantity: 0, minThreshold: 1, unit: 'kg' },
            { id: 35, name: 'Vitello', category: 'carne', quantity: 0, minThreshold: 1, unit: 'kg' },
            
            // Verdure/Ortaggi/Frutta
            { id: 36, name: 'Lattuga romana', category: 'verdure', quantity: 1, minThreshold: 5, unit: 'pz' },
            { id: 37, name: 'Rucola', category: 'verdure', quantity: 0, minThreshold: 3, unit: 'pz' },
            { id: 38, name: 'Carote', category: 'verdure', quantity: 0, minThreshold: 5, unit: 'pz' },
            { id: 39, name: 'Zucchine', category: 'verdure', quantity: 0, minThreshold: 5, unit: 'pz' },
            { id: 40, name: 'Pomodorini', category: 'verdure', quantity: 0, minThreshold: 3, unit: 'pz' },
            { id: 41, name: 'Peperoni', category: 'verdure', quantity: 0, minThreshold: 3, unit: 'pz' },
            { id: 42, name: 'Melanzane', category: 'verdure', quantity: 0, minThreshold: 3, unit: 'pz' },
            { id: 43, name: 'Basilico', category: 'verdure', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 44, name: 'Menta', category: 'verdure', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 45, name: 'Arancia', category: 'verdure', quantity: 0, minThreshold: 5, unit: 'pz' },
            { id: 46, name: 'Mela', category: 'verdure', quantity: 0, minThreshold: 5, unit: 'pz' },
            { id: 47, name: 'Uva', category: 'verdure', quantity: 0, minThreshold: 2, unit: 'kg' },
            { id: 48, name: 'Pomodori', category: 'verdure', quantity: 0, minThreshold: 5, unit: 'pz' },
            { id: 49, name: 'Cipolla', category: 'verdure', quantity: 0, minThreshold: 5, unit: 'pz' },
            { id: 50, name: 'Aglio', category: 'verdure', quantity: 0, minThreshold: 3, unit: 'pz' },
            { id: 51, name: 'Prezzemolo', category: 'verdure', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 52, name: 'Rosmarino', category: 'verdure', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 53, name: 'Limone', category: 'verdure', quantity: 0, minThreshold: 5, unit: 'pz' },
            { id: 54, name: 'Spinaci', category: 'verdure', quantity: 0, minThreshold: 3, unit: 'pz' },
            { id: 55, name: 'Broccoli', category: 'verdure', quantity: 0, minThreshold: 3, unit: 'pz' },
            
            // Pesce
            { id: 56, name: 'Salmone', category: 'pesce', quantity: 0, minThreshold: 1, unit: 'kg' },
            { id: 57, name: 'Tonno', category: 'pesce', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 58, name: 'Branzino', category: 'pesce', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 59, name: 'Orata', category: 'pesce', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 60, name: 'Gamberi', category: 'pesce', quantity: 0, minThreshold: 1, unit: 'kg' },
            { id: 61, name: 'Calamari', category: 'pesce', quantity: 0, minThreshold: 1, unit: 'kg' },
            { id: 62, name: 'Cozze', category: 'pesce', quantity: 0, minThreshold: 1, unit: 'kg' },
            { id: 63, name: 'Vongole', category: 'pesce', quantity: 0, minThreshold: 1, unit: 'kg' },
            { id: 64, name: 'Baccalà', category: 'pesce', quantity: 0, minThreshold: 1, unit: 'kg' },
            
            // Pasta/Riso
            { id: 65, name: 'Spaghetti n.5', category: 'pasta', quantity: 0, minThreshold: 5, unit: 'pz' },
            { id: 66, name: 'Pasta salsiccia', category: 'pasta', quantity: 0, minThreshold: 3, unit: 'pz' },
            { id: 67, name: 'Gnocchi', category: 'pasta', quantity: 0, minThreshold: 5, unit: 'pz' },
            { id: 68, name: 'Penne', category: 'pasta', quantity: 0, minThreshold: 5, unit: 'pz' },
            { id: 69, name: 'Riso', category: 'pasta', quantity: 0, minThreshold: 3, unit: 'kg' },
            { id: 70, name: 'Fusilli', category: 'pasta', quantity: 0, minThreshold: 5, unit: 'pz' },
            { id: 71, name: 'Rigatoni', category: 'pasta', quantity: 0, minThreshold: 5, unit: 'pz' },
            { id: 72, name: 'Linguine', category: 'pasta', quantity: 0, minThreshold: 5, unit: 'pz' },
            { id: 73, name: 'Tagliatelle', category: 'pasta', quantity: 0, minThreshold: 3, unit: 'pz' },
            { id: 74, name: 'Lasagne', category: 'pasta', quantity: 0, minThreshold: 3, unit: 'pz' },
            { id: 75, name: 'Ravioli', category: 'pasta', quantity: 0, minThreshold: 3, unit: 'pz' },
            { id: 76, name: 'Tortellini', category: 'pasta', quantity: 0, minThreshold: 3, unit: 'pz' },
            
            // Condimenti/Salse/Olii
            { id: 77, name: 'Olio EVO', category: 'condimenti', quantity: 0, minThreshold: 2, unit: 'l' },
            { id: 78, name: 'Olio cucina', category: 'condimenti', quantity: 0, minThreshold: 2, unit: 'l' },
            { id: 79, name: 'Olio gruppi', category: 'condimenti', quantity: 0, minThreshold: 2, unit: 'l' },
            { id: 80, name: 'Olio di semi', category: 'condimenti', quantity: 0, minThreshold: 2, unit: 'l' },
            { id: 81, name: 'Maionese', category: 'condimenti', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 82, name: 'Salsa tartufata', category: 'condimenti', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 83, name: 'Crema basilico', category: 'condimenti', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 84, name: 'Crema zucchine', category: 'condimenti', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 85, name: 'Aceto balsamico', category: 'condimenti', quantity: 0, minThreshold: 1, unit: 'pz' },
            { id: 86, name: 'Aceto di vino', category: 'condimenti', quantity: 0, minThreshold: 1, unit: 'pz' },
            { id: 87, name: 'Salsa pomodoro', category: 'condimenti', quantity: 0, minThreshold: 5, unit: 'pz' },
            { id: 88, name: 'Pesto', category: 'condimenti', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 89, name: 'Ketchup', category: 'condimenti', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 90, name: 'Senape', category: 'condimenti', quantity: 0, minThreshold: 1, unit: 'pz' },
            
            // Dolci/Dessert/Gelati
            { id: 91, name: 'Sorbetto', category: 'dolci', quantity: 0, minThreshold: 3, unit: 'pz' },
            { id: 92, name: 'Gelato', category: 'dolci', quantity: 0, minThreshold: 5, unit: 'pz' },
            { id: 93, name: 'Viennette', category: 'dolci', quantity: 0, minThreshold: 5, unit: 'pz' },
            { id: 94, name: 'Fragole', category: 'dolci', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 95, name: 'Frutti R', category: 'dolci', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 96, name: 'Cappellaci', category: 'dolci', quantity: 0, minThreshold: 3, unit: 'pz' },
            { id: 97, name: 'Tiramisù', category: 'dolci', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 98, name: 'Panna cotta', category: 'dolci', quantity: 0, minThreshold: 3, unit: 'pz' },
            { id: 99, name: 'Cannoli', category: 'dolci', quantity: 0, minThreshold: 5, unit: 'pz' },
            { id: 100, name: 'Cioccolato', category: 'dolci', quantity: 0, minThreshold: 2, unit: 'pz' },
            
            // Pane/Prodotti da forno
            { id: 101, name: 'Pane', category: 'pane', quantity: 0, minThreshold: 10, unit: 'pz' },
            { id: 102, name: 'Pavesini', category: 'pane', quantity: 0, minThreshold: 3, unit: 'pz' },
            { id: 103, name: 'Grissini', category: 'pane', quantity: 0, minThreshold: 5, unit: 'pz' },
            { id: 104, name: 'Focaccia', category: 'pane', quantity: 0, minThreshold: 3, unit: 'pz' },
            { id: 105, name: 'Biscotti', category: 'pane', quantity: 0, minThreshold: 5, unit: 'pz' },
            { id: 106, name: 'Crackers', category: 'pane', quantity: 0, minThreshold: 3, unit: 'pz' },
            
            // Bevande/Alcool
            { id: 107, name: 'Rum', category: 'bevande', quantity: 0, minThreshold: 1, unit: 'pz' },
            { id: 108, name: 'Vino rosso', category: 'bevande', quantity: 0, minThreshold: 5, unit: 'pz' },
            { id: 109, name: 'Vino bianco', category: 'bevande', quantity: 0, minThreshold: 5, unit: 'pz' },
            { id: 110, name: 'Prosecco', category: 'bevande', quantity: 0, minThreshold: 3, unit: 'pz' },
            { id: 111, name: 'Birra', category: 'bevande', quantity: 0, minThreshold: 10, unit: 'pz' },
            { id: 112, name: 'Acqua naturale', category: 'bevande', quantity: 0, minThreshold: 20, unit: 'pz' },
            { id: 113, name: 'Acqua frizzante', category: 'bevande', quantity: 0, minThreshold: 20, unit: 'pz' },
            { id: 114, name: 'Coca Cola', category: 'bevande', quantity: 0, minThreshold: 10, unit: 'pz' },
            { id: 115, name: 'Aranciata', category: 'bevande', quantity: 0, minThreshold: 5, unit: 'pz' },
            { id: 116, name: 'Caffè', category: 'bevande', quantity: 0, minThreshold: 3, unit: 'kg' },
            
            // Altri/Varie
            { id: 117, name: 'Carta forno', category: 'altri', quantity: 0, minThreshold: 5, unit: 'pz' },
            { id: 118, name: 'Sapone piatti', category: 'altri', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 119, name: 'Spugne gialle', category: 'altri', quantity: 0, minThreshold: 10, unit: 'pz' },
            { id: 120, name: 'Sale', category: 'altri', quantity: 0, minThreshold: 2, unit: 'kg' },
            { id: 121, name: 'Pepe', category: 'altri', quantity: 0, minThreshold: 1, unit: 'pz' },
            { id: 122, name: 'Guanti', category: 'altri', quantity: 0, minThreshold: 5, unit: 'pz' },
            { id: 123, name: 'Carta igienica', category: 'altri', quantity: 0, minThreshold: 10, unit: 'pz' },
            { id: 124, name: 'Tovaglioli', category: 'altri', quantity: 0, minThreshold: 10, unit: 'pz' },
            { id: 125, name: 'Detersivo', category: 'altri', quantity: 0, minThreshold: 2, unit: 'pz' },
            { id: 126, name: 'Sacchetti spazzatura', category: 'altri', quantity: 0, minThreshold: 5, unit: 'pz' }
        ];
    }

    saveProducts() {
        localStorage.setItem('restaurant_stock', JSON.stringify(this.products));
    }

    // Product Operations
    addProduct(productData) {
        const newProduct = {
            id: Date.now(),
            ...productData,
            quantity: parseInt(productData.quantity) || 0,
            minThreshold: parseInt(productData.minThreshold) || 1
        };
        
        this.products.push(newProduct);
        this.saveProducts();
        
        // Extract categories from products and update UI
        this.extractCategoriesFromProducts();
        this.renderCategoryFilters();
        this.renderCategoryStats();
        
        this.renderProducts();
        this.updateCategoryCounts();
        this.updateAlerts();
        
        this.showToast('✅ Prodotto aggiunto con successo', 'success');
    }

    updateProduct(id, productData) {
        const index = this.products.findIndex(p => p.id === id);
        if (index !== -1) {
            this.products[index] = {
                ...this.products[index],
                ...productData,
                quantity: parseInt(productData.quantity) || 0,
                minThreshold: parseInt(productData.minThreshold) || 1
            };
            
            this.saveProducts();
            
            // Extract categories from products and update UI
            this.extractCategoriesFromProducts();
            this.renderCategoryFilters();
            this.renderCategoryStats();
            
            this.renderProducts();
            this.updateCategoryCounts();
            this.updateAlerts();
            
            this.showToast('✅ Prodotto aggiornato', 'success');
        }
    }

    deleteProduct(id) {
        if (confirm('Sei sicuro di voler eliminare questo prodotto?')) {
            this.products = this.products.filter(p => p.id !== id);
            this.saveProducts();
            this.renderProducts();
            this.updateCategoryCounts();
            this.updateAlerts();
            
            this.showToast('🗑️ Prodotto eliminato', 'warning');
        }
    }

    updateQuantity(id, change) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            const newQuantity = Math.max(0, product.quantity + change);
            product.quantity = newQuantity;
            
            this.saveProducts();
            this.renderProducts();
            this.updateCategoryCounts();
            this.updateAlerts();
            
            const action = change > 0 ? 'aumentata' : 'diminuita';
            this.showToast(`📦 Quantità ${action}: ${product.name}`, 'success');
        }
    }

    // Status Helpers
    getProductStatus(product) {
        if (product.quantity === 0) return 'esaurito';
        if (product.quantity <= product.minThreshold) return 'basso';
        return 'ok';
    }

    getStatusText(status) {
        const statusMap = {
            'ok': 'OK',
            'basso': 'BASSO',
            'esaurito': 'ESAURITO'
        };
        return statusMap[status] || 'OK';
    }

    getCategoryIcon(category) {
        const categoryObj = this.categories.find(c => c.id === category);
        return categoryObj ? categoryObj.icon : '📦';
    }

    getCategoryName(category) {
        const categoryObj = this.categories.find(c => c.id === category);
        return categoryObj ? categoryObj.name : category.charAt(0).toUpperCase() + category.slice(1);
    }

    // Rendering
    renderCategoryFilters() {
        const filtersContainer = document.querySelector('.category-filters');
        
        // Always include 'all' filter first
        let filtersHTML = `
            <button class="category-btn ${this.currentCategory === 'all' ? 'active' : ''}" data-category="all">
                <span class="category-icon">📋</span>
                <span>TUTTI</span>
                <span class="category-count" id="count-all">0</span>
            </button>
        `;
        
        // Add dynamic category filters
        this.categories.forEach(category => {
            const count = this.products.filter(p => p.category === category.id).length;
            filtersHTML += `
                <button class="category-btn ${this.currentCategory === category.id ? 'active' : ''}" data-category="${category.id}">
                    <span class="category-icon">${category.icon}</span>
                    <span>${category.name.toUpperCase()}</span>
                    <span class="category-count" id="count-${category.id}">${count}</span>
                </button>
            `;
        });
        
        filtersContainer.innerHTML = filtersHTML;
        
        // Re-attach event listeners for category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.setActiveCategory(category);
            });
        });
    }

    renderProducts() {
        const grid = document.getElementById('stockGrid');
        const filteredProducts = this.currentCategory === 'all' 
            ? this.products 
            : this.products.filter(p => p.category === this.currentCategory);

        if (filteredProducts.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <span class="empty-icon">📦</span>
                    <p>Nessun prodotto trovato</p>
                    <button class="btn-primary" onclick="stockManager.openAddProductModal()">Aggiungi Prodotto</button>
                </div>
            `;
            return;
        }

        grid.innerHTML = filteredProducts.map(product => {
            const status = this.getProductStatus(product);
            const statusText = this.getStatusText(status);
            const categoryIcon = this.getCategoryIcon(product.category);
            
            return `
                <div class="stock-item" data-id="${product.id}">
                    <div class="stock-header">
                        <div class="stock-info">
                            <h3>${product.name}</h3>
                            <div class="category">${categoryIcon} ${product.category}</div>
                        </div>
                        <div class="stock-status ${status}">${statusText}</div>
                    </div>
                    
                    <div class="stock-controls">
                        <div class="quantity-controls">
                            <button class="qty-btn minus" onclick="stockManager.updateQuantity(${product.id}, -1)">
                                −
                            </button>
                            <span class="quantity-display">${product.quantity}</span>
                            <button class="qty-btn plus" onclick="stockManager.updateQuantity(${product.id}, 1)">
                                +
                            </button>
                        </div>
                        
                        <div class="stock-actions">
                            <button class="action-btn" onclick="stockManager.editProduct(${product.id})" title="Modifica">
                                ✏️
                            </button>
                            <button class="action-btn" onclick="stockManager.deleteProduct(${product.id})" title="Elimina">
                                🗑️
                            </button>
                        </div>
                    </div>
                    
                    <div style="margin-top: 0.5rem; font-size: 0.8rem; color: #6b7280;">
                        Unità: ${product.unit} | Min: ${product.minThreshold}
                    </div>
                </div>
            `;
        }).join('');

        // Update total count
        document.getElementById('totalItems').textContent = this.products.length;
    }

    updateCategoryCounts() {
        // Update 'all' count
        const allCountElement = document.getElementById('count-all');
        if (allCountElement) {
            allCountElement.textContent = this.products.length;
            allCountElement.style.display = this.products.length > 0 ? 'flex' : 'none';
        }
        
        // Update individual category counts
        this.categories.forEach(category => {
            const count = this.products.filter(p => p.category === category.id).length;
            const countElement = document.getElementById(`count-${category.id}`);
            if (countElement) {
                countElement.textContent = count;
                countElement.style.display = count > 0 ? 'flex' : 'none';
            }
        });

        // Update category stats section
        this.renderCategoryStats();
    }

    renderCategoryStats() {
        const statsContainer = document.getElementById('categoryStats');
        
        // Add category management header with add button
        let statsHTML = `
            <div class="category-management-header">
                <button class="btn-primary" onclick="stockManager.openAddCategoryModal()">
                    ➕ Aggiungi Categoria
                </button>
            </div>
            <div class="category-stats-grid">
        `;
        
        // Add category cards
        statsHTML += this.categories.map(category => {
            const categoryProducts = this.products.filter(p => p.category === category.id);
            const totalQuantity = categoryProducts.reduce((sum, p) => sum + p.quantity, 0);
            const lowStock = categoryProducts.filter(p => this.getProductStatus(p) !== 'ok').length;
            
            return `
                <div class="category-stat-card" data-category="${category.id}">
                    <div class="category-card-header">
                        <div class="icon">${category.icon}</div>
                        <div class="category-actions">
                            <button class="action-btn" onclick="stockManager.editCategory('${category.id}')" title="Modifica">
                                ✏️
                            </button>
                            ${!category.isDefault ? `
                                <button class="action-btn" onclick="stockManager.deleteCategory('${category.id}')" title="Elimina">
                                    🗑️
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <h3>${category.name}</h3>
                    <div class="count">${categoryProducts.length} prodotti</div>
                    <div style="font-size: 0.8rem; color: #6b7280; margin-top: 0.5rem;">
                        Totale: ${totalQuantity} | Avvisi: ${lowStock}
                    </div>
                </div>
            `;
        }).join('');
        
        statsHTML += '</div>';
        statsContainer.innerHTML = statsHTML;
    }

    updateAlerts() {
        const alertsList = document.getElementById('alertsList');
        const alertProducts = this.products.filter(p => this.getProductStatus(p) !== 'ok');
        
        if (alertProducts.length === 0) {
            alertsList.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">✅</span>
                    <p>Nessun avviso! Tutto il stock è OK.</p>
                </div>
            `;
        } else {
            alertsList.innerHTML = alertProducts.map(product => {
                const status = this.getProductStatus(product);
                const isWarning = status === 'basso';
                const icon = isWarning ? '⚠️' : '🚨';
                const message = isWarning 
                    ? `Stock basso (${product.quantity}/${product.minThreshold})` 
                    : 'Prodotto esaurito';
                
                return `
                    <div class="alert-item ${isWarning ? 'warning' : 'error'}">
                        <div class="alert-icon">${icon}</div>
                        <div class="alert-content">
                            <h4>${product.name}</h4>
                            <p>${message}</p>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        // Update alert badge
        const alertBadge = document.getElementById('alertBadge');
        alertBadge.textContent = alertProducts.length;
        alertBadge.style.display = alertProducts.length > 0 ? 'flex' : 'none';
    }

    // Category Modal Management
    openAddCategoryModal() {
        this.editingCategoryId = null;
        document.getElementById('categoryModalTitle').textContent = 'Aggiungi Categoria';
        document.getElementById('deleteCategoryBtn').style.display = 'none';
        document.getElementById('categoryForm').reset();
        document.getElementById('categoryModal').classList.add('active');
    }

    editCategory(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) return;
        
        this.editingCategoryId = categoryId;
        document.getElementById('categoryModalTitle').textContent = 'Modifica Categoria';
        document.getElementById('deleteCategoryBtn').style.display = category.isDefault ? 'none' : 'block';
        
        // Fill form
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categoryIcon').value = category.icon;
        
        document.getElementById('categoryModal').classList.add('active');
    }

    closeCategoryModal() {
        document.getElementById('categoryModal').classList.remove('active');
        this.editingCategoryId = null;
    }

    handleCategorySubmit() {
        const formData = {
            name: document.getElementById('categoryName').value.trim(),
            icon: document.getElementById('categoryIcon').value.trim() || '📦'
        };

        if (!formData.name) {
            this.showToast('❌ Nome categoria richiesto', 'error');
            return;
        }

        if (this.editingCategoryId) {
            this.updateCategory(this.editingCategoryId, formData);
        } else {
            this.addCategory(formData);
        }

        this.closeCategoryModal();
    }

    showReassignProductsModal(categoryId, products) {
        const category = this.categories.find(c => c.id === categoryId);
        const otherCategories = this.categories.filter(c => c.id !== categoryId);
        
        const modalHTML = `
            <div class="modal active" id="reassignModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Riassegna Prodotti</h2>
                        <button class="close-btn" onclick="stockManager.closeReassignModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <p>La categoria "${category.name}" contiene ${products.length} prodotti.</p>
                        <p>Seleziona una nuova categoria per questi prodotti:</p>
                        <select id="newCategorySelect" class="form-input">
                            ${otherCategories.map(cat => 
                                `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`
                            ).join('')}
                        </select>
                        <div class="products-list" style="max-height: 200px; overflow-y: auto; margin-top: 1rem; padding: 1rem; background: #f9fafb; border-radius: 8px;">
                            ${products.map(p => `<div>• ${p.name}</div>`).join('')}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="stockManager.closeReassignModal()">Annulla</button>
                        <button class="btn-primary" onclick="stockManager.confirmReassign('${categoryId}')">Riassegna</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    closeReassignModal() {
        const modal = document.getElementById('reassignModal');
        if (modal) {
            modal.remove();
        }
    }

    confirmReassign(oldCategoryId) {
        const newCategoryId = document.getElementById('newCategorySelect').value;
        this.reassignProducts(oldCategoryId, newCategoryId);
        this.closeReassignModal();
    }

    updateProductCategoryOptions() {
        const categorySelect = document.getElementById('productCategory');
        if (categorySelect) {
            categorySelect.innerHTML = this.categories.map(category => 
                `<option value="${category.id}">${category.icon} ${category.name}</option>`
            ).join('');
        }
    }

    // Product Modal Management
    openAddProductModal() {
        this.editingProductId = null;
        document.getElementById('modalTitle').textContent = 'Aggiungi Prodotto';
        document.getElementById('deleteProductBtn').style.display = 'none';
        document.getElementById('productForm').reset();
        this.updateProductCategoryOptions();
        document.getElementById('productModal').classList.add('active');
    }

    editProduct(id) {
        const product = this.products.find(p => p.id === id);
        if (!product) return;
        
        this.editingProductId = id;
        document.getElementById('modalTitle').textContent = 'Modifica Prodotto';
        document.getElementById('deleteProductBtn').style.display = 'block';
        
        // Update category options first
        this.updateProductCategoryOptions();
        
        // Fill form
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productQuantity').value = product.quantity;
        document.getElementById('productMinThreshold').value = product.minThreshold;
        document.getElementById('productUnit').value = product.unit;
        
        document.getElementById('productModal').classList.add('active');
    }

    closeProductModal() {
        document.getElementById('productModal').classList.remove('active');
        this.editingProductId = null;
    }

    // Event Listeners
    setupEventListeners() {
        // Category filters
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.setActiveCategory(category);
            });
        });

        // Bottom navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.setActiveSection(section);
            });
        });

        // Product form
        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleProductSubmit();
        });
        
        document.getElementById('categoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCategorySubmit();
        });

        // Modal close on backdrop click
        document.getElementById('productModal').addEventListener('click', (e) => {
            if (e.target.id === 'productModal') {
                this.closeProductModal();
            }
        });
        
        document.getElementById('categoryModal').addEventListener('click', (e) => {
            if (e.target.id === 'categoryModal') {
                this.closeCategoryModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeProductModal();
            }
        });
    }

    setupImportHandler() {
        document.getElementById('importFile').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    let data;
                    if (file.name.endsWith('.json')) {
                        data = JSON.parse(event.target.result);
                    } else if (file.name.endsWith('.csv')) {
                        data = this.parseCSV(event.target.result);
                    } else {
                        throw new Error('Formato file non supportato');
                    }
                    
                    this.importData(data);
                } catch (error) {
                    this.showToast('❌ Errore nell\'importazione: ' + error.message, 'error');
                }
            };
            reader.readAsText(file);
        });
    }

    handleProductSubmit() {
        const formData = {
            name: document.getElementById('productName').value.trim(),
            category: document.getElementById('productCategory').value,
            quantity: document.getElementById('productQuantity').value,
            minThreshold: document.getElementById('productMinThreshold').value,
            unit: document.getElementById('productUnit').value
        };

        if (!formData.name) {
            this.showToast('❌ Nome prodotto richiesto', 'error');
            return;
        }

        // Ensure category exists
        if (!this.categories.find(c => c.id === formData.category)) {
            this.showToast('❌ Categoria non valida', 'error');
            return;
        }

        if (this.editingProductId) {
            this.updateProduct(this.editingProductId, formData);
        } else {
            this.addProduct(formData);
        }

        this.closeProductModal();
    }

    setActiveCategory(category) {
        this.currentCategory = category;
        
        // Update UI
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
        
        this.renderProducts();
    }

    setActiveSection(section) {
        this.currentSection = section;
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === section);
        });
        
        // Update sections
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.toggle('active', sec.id === section + 'Section');
        });
        
        // Show/hide FAB based on section
        const fab = document.getElementById('addProductBtn');
        fab.style.display = section === 'stock' ? 'flex' : 'none';
    }

    // Export/Import
    exportData(format) {
        try {
            let data, filename, mimeType;
            
            if (format === 'json') {
                data = JSON.stringify(this.products, null, 2);
                filename = `stock_backup_${new Date().toISOString().split('T')[0]}.json`;
                mimeType = 'application/json';
            } else if (format === 'csv') {
                data = this.generateCSV();
                filename = `stock_export_${new Date().toISOString().split('T')[0]}.csv`;
                mimeType = 'text/csv';
            }
            
            const blob = new Blob([data], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            
            this.showToast(`📁 File ${format.toUpperCase()} scaricato`, 'success');
        } catch (error) {
            this.showToast('❌ Errore nell\'esportazione', 'error');
        }
    }

    generateCSV() {
        const headers = ['Nome', 'Categoria', 'Quantità', 'Soglia Minima', 'Unità', 'Stato'];
        const rows = this.products.map(product => [
            product.name,
            product.category,
            product.quantity,
            product.minThreshold,
            product.unit,
            this.getStatusText(this.getProductStatus(product))
        ]);
        
        return [headers, ...rows].map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
    }

    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
        
        return lines.slice(1).map((line, index) => {
            const values = line.split(',').map(v => v.replace(/"/g, ''));
            return {
                id: Date.now() + index,
                name: values[0],
                category: values[1],
                quantity: parseInt(values[2]) || 0,
                minThreshold: parseInt(values[3]) || 1,
                unit: values[4] || 'pz'
            };
        });
    }

    importData(data) {
        if (!Array.isArray(data)) {
            throw new Error('Formato dati non valido');
        }
        
        this.products = data;
        this.saveProducts();
        this.renderProducts();
        this.updateCategoryCounts();
        this.updateAlerts();
        
        this.showToast('✅ Dati importati con successo', 'success');
    }

    resetAllData() {
        if (confirm('Sei sicuro di voler cancellare tutti i dati? Questa azione non può essere annullata.')) {
            localStorage.removeItem('restaurant_stock');
            this.products = [];
            this.renderProducts();
            this.updateCategoryCounts();
            this.updateAlerts();
            
            this.showToast('🗑️ Tutti i dati sono stati cancellati', 'warning');
        }
    }

    // Toast Notifications
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✅',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${icons[type] || icons.info}</span>
                <span class="toast-message">${message}</span>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // PWA Setup
    setupPWA() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('SW registered:', registration);
                })
                .catch(error => {
                    console.log('SW registration failed:', error);
                });
        }

        // Install prompt
        this.deferredPrompt = null;
        const installPrompt = document.getElementById('installPrompt');
        const installBtn = document.getElementById('installBtn');

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            installPrompt.classList.remove('hidden');
        });

        installBtn.addEventListener('click', async () => {
            if (this.deferredPrompt) {
                this.deferredPrompt.prompt();
                const { outcome } = await this.deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    installPrompt.classList.add('hidden');
                }
                this.deferredPrompt = null;
            }
        });

        window.addEventListener('appinstalled', () => {
            installPrompt.classList.add('hidden');
            this.showToast('🎉 App installata con successo!', 'success');
        });
    }

    // Manual install trigger
    triggerInstall() {
        if (this.deferredPrompt) {
            // Use the stored prompt
            this.deferredPrompt.prompt();
            this.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    this.showToast('🎉 App installata con successo!', 'success');
                } else {
                    this.showToast('ℹ️ Installazione annullata', 'info');
                }
                this.deferredPrompt = null;
            });
        } else {
            // Check if app is already installed
            if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
                this.showToast('✅ App già installata!', 'success');
            } else {
                // Show manual installation instructions
                this.showInstallInstructions();
            }
        }
    }

    showInstallInstructions() {
        const userAgent = navigator.userAgent.toLowerCase();
        let instructions = '';
        
        if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
            instructions = 'Per installare:\n1. Clicca sui tre puntini (⋮) in alto a destra\n2. Seleziona "Installa Stock Ristorante"\n3. Conferma l\'installazione';
        } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
            instructions = 'Per installare su Safari:\n1. Tocca il pulsante Condividi (□↗)\n2. Scorri e tocca "Aggiungi alla schermata Home"\n3. Tocca "Aggiungi"';
        } else if (userAgent.includes('firefox')) {
            instructions = 'Per installare su Firefox:\n1. Clicca sui tre trattini (☰)\n2. Seleziona "Installa"\n3. Conferma l\'installazione';
        } else {
            instructions = 'Per installare questa app:\n1. Cerca l\'opzione "Installa" o "Aggiungi alla schermata Home" nel menu del browser\n2. Segui le istruzioni del tuo browser';
        }
        
        alert('📱 Istruzioni per l\'installazione:\n\n' + instructions);
    }

    // Reinitialize app with default data
    reinitializeApp() {
        if (confirm('⚠️ Sei sicuro di voler reinizializzare l\'applicazione?\n\nQuesto ripristinerà tutti i dati ai valori predefiniti. I dati attuali verranno persi.')) {
            try {
                // Clear all localStorage data
                localStorage.removeItem('restaurant_stock');
                localStorage.removeItem('restaurant_categories');
                
                // Reload default data
                this.products = [];
                this.categories = this.loadCategories();
                this.loadProducts(); // This will load default products
                
                // Update UI
                this.extractCategoriesFromProducts();
                this.validateProductCategories();
                this.renderCategoryFilters();
                this.renderCategoryStats();
                this.renderProducts();
                this.updateCategoryCounts();
                this.updateAlerts();
                
                this.showToast('🔄 Applicazione reinizializzata con successo!', 'success');
            } catch (error) {
                console.error('Errore durante la reinizializzazione:', error);
                this.showToast('❌ Errore durante la reinizializzazione', 'error');
            }
        }
    }
}

// Global functions for HTML onclick handlers
function openAddProductModal() {
    stockManager.openAddProductModal();
}

function closeProductModal() {
    stockManager.closeProductModal();
}

function deleteProduct() {
    if (stockManager.editingProductId) {
        stockManager.deleteProduct(stockManager.editingProductId);
        stockManager.closeProductModal();
    }
}

function exportData(format) {
    stockManager.exportData(format);
}

function resetAllData() {
    stockManager.resetAllData();
}

function createOrder() {
    stockManager.showToast('🚧 Funzione in sviluppo', 'info');
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.stockManager = new StockManager();
});