document.addEventListener('DOMContentLoaded', () => {
    
    // --- Cart Utility Functions ---

    // 1. Function to get the current cart from localStorage
    const getCart = () => {
        const cartJSON = localStorage.getItem('flipkartCloneCart');
        // If nothing is stored, return an empty array []
        return cartJSON ? JSON.parse(cartJSON) : [];
    };

    // 2. Function to get the total count of items (sum of all quantities)
    const getTotalCartItems = () => {
        const cart = getCart();
        return cart.reduce((total, item) => total + item.quantity, 0);
    };

    // 3. Function to update the cart count visible in the header on ANY page
    const updateCartCountDisplay = () => {
        const totalItems = getTotalCartItems();
        // Crucial: Select the element using the specific class
        const cartLink = document.querySelector('.user-nav .cart-link'); 
        
        if (cartLink) {
            cartLink.textContent = `Cart (${totalItems})`; 
            console.log(`[INIT] Header Cart count set to: ${totalItems}`); 
        } else {
             console.error("Error: Header cart link (.cart-link) not found.");
        }
    };
    
    // 4. Function to save the cart and update display
    const saveCart = (cart) => {
        localStorage.setItem('flipkartCloneCart', JSON.stringify(cart));
        updateCartCountDisplay();
        
        // If we are currently on the cart page, we must immediately re-render the item list
        if (document.getElementById('cart-items-list')) {
            renderCartItems();
        }
    };

    // 5. Formats price with Indian currency symbol and comma separators
    const formatPrice = (price) => {
        return `₹${price.toLocaleString('en-IN')}`;
    };

    // 6. Function to remove an item from the cart (FIXED MATCHING)
    const removeItemFromCart = (productName) => {
        let cart = getCart();
        
        // FIX: Trim the incoming product name to ensure exact matching
        const cleanProductName = productName.trim();
        
        // Filter out the item with the matching name
        const initialCartLength = cart.length;
        
        // FIX: When filtering, also trim the saved name if necessary for safety
        cart = cart.filter(item => item.name.trim() !== cleanProductName);

        if (cart.length < initialCartLength) {
             console.log(`[DEBUG] Successfully removed "${cleanProductName}". New cart items array size: ${cart.length}`);
        } else {
             // This error should now only appear if the cart was empty or the item was genuinely not there
             console.error(`[DEBUG] Error: Item "${cleanProductName}" was not found in cart.`, cart);
        }

        saveCart(cart); // This saves the empty or reduced cart and triggers UI updates
        alert(`"${cleanProductName}" has been removed.`);
    };
    
    // 7. Function to add a product to the cart (saves to localStorage)
    const addToCart = (productName, productPrice) => {
        const cart = getCart();
        
        // FIX: Ensure the product name is trimmed when saving it to localStorage
        const cleanProductName = productName.trim();
        
        const existingItem = cart.find(item => item.name === cleanProductName);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                name: cleanProductName,
                price: productPrice,
                quantity: 1
            });
        }
        
        saveCart(cart); // Saves data and updates count display
        alert(`1 x ${cleanProductName} added to cart. Cart Total Items: ${getTotalCartItems()}`);
    };

    // --- Core Rendering Function for cart.html ---
    const renderCartItems = () => {
        const cart = getCart();
        const listContainer = document.getElementById('cart-items-list');
        const summaryItemCount = document.getElementById('summary-item-count');
        const summarySubtotal = document.getElementById('summary-subtotal');
        const summaryTotal = document.getElementById('summary-total');
        
        if (!listContainer) return; // Exit if not on the cart page

        listContainer.innerHTML = ''; // Clear previous content
        let subtotal = 0;
        
        if (cart.length === 0) {
            // Display message for empty cart
            listContainer.innerHTML = '<p style="text-align:center; padding: 50px; font-size: 18px; color: #878787;">Your Flipkart Cart is empty. Start shopping now!</p>';
        } else {
            // Render each item
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                subtotal += itemTotal;

                const itemHTML = document.createElement('div');
                itemHTML.className = 'cart-item';
                itemHTML.innerHTML = `
                    <!-- FIX: Using a standard image placeholder URL for reliable loading -->
                    <img src="https://placehold.co/80x80/2874F0/ffffff?text=Product" alt="${item.name}">
                    <div class="item-details">
                        <h4>${item.name}</h4>
                        <p>Price: ${formatPrice(item.price)} | Qty: ${item.quantity}</p>
                        <!-- Ensure data-product-name uses the existing (potentially unclean) item name -->
                        <button class="remove-btn" data-product-name="${item.name}">REMOVE</button>
                    </div>
                    <!-- CHANGED class from item-price-col to item-price-display -->
                    <div class="item-price-display">${formatPrice(itemTotal)}</div>
                `;
                listContainer.appendChild(itemHTML);
            });
        }
        
        // --- Update Summary Details ---
        const totalItemsCount = getTotalCartItems();
        
        if (summaryItemCount) summaryItemCount.textContent = totalItemsCount;
        if (summarySubtotal) summarySubtotal.textContent = formatPrice(subtotal);
        if (summaryTotal) summaryTotal.textContent = formatPrice(subtotal);
        
        // REMOVED: document.querySelectorAll('.remove-btn').forEach(button => { ... });
        // Event delegation handles the clicks now (see step 2)
    };
    
    // ------------------------------------------------------------------
    // --- Event Handlers and Initial Setup ---
    // ------------------------------------------------------------------

    // 1. "Add to Cart" logic (attaches click listeners to all product cards)
    const cartButtons = document.querySelectorAll('.add-to-cart, .detail-cart-btn');

    cartButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            
            let productName = '';
            let productPriceText = '';
            
            // Logic to correctly extract data from the nearest product container
            const card = event.target.closest('.product-card');
            const detailContainer = event.target.closest('.product-detail-container');
            
            if (card) {
                productName = card.querySelector('h4').textContent.trim();
                productPriceText = card.querySelector('.price').textContent.trim();
            } else if (detailContainer) {
                // Ensure name is grabbed without surrounding whitespace
                productName = detailContainer.querySelector('h1').textContent.trim();
                // Assumes price is the first text content in .detail-price element
                productPriceText = detailContainer.querySelector('.detail-price').textContent.split(' ')[0].trim();
            } else { 
                console.error("Add to Cart failed: Could not find product data container.");
                return;
            }

            // Cleans price string (e.g., "₹39,999" -> 39999)
            const numericPrice = parseFloat(productPriceText.replace(/[₹,]/g, ''));
            
            // Call the function to save data and update the display
            addToCart(productName, numericPrice);
        });
    });

    // 2. NEW: EVENT DELEGATION for REMOVE buttons
    const cartListContainer = document.getElementById('cart-items-list');
    if (cartListContainer) {
        cartListContainer.addEventListener('click', (event) => {
            const clickedElement = event.target;

            // Check if the clicked element has the specific class
            if (clickedElement.classList.contains('remove-btn')) {
                const productName = clickedElement.getAttribute('data-product-name');
                console.log(`[DEBUG] Delegated REMOVE click received for product: ${productName}`);
                
                removeItemFromCart(productName);
            }
        });
    }

    // 3. Initial Setup: RUN ON EVERY PAGE LOAD
    updateCartCountDisplay(); // Updates the header counter on load
    
    // IMPORTANT: Only render cart items if the necessary container elements are present (i.e., we are on cart.html).
    if (document.getElementById('cart-items-list')) {
        console.log("[INIT] Rendering cart items on cart.html...");
        renderCartItems();
    }

    // 4. Search button log (kept for completeness)
    const searchBtn = document.querySelector('.search-btn');
    const searchInput = document.querySelector('.search-container input');
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            if (searchInput.value) {
                alert(`Simulating search for: ${searchInput.value}`);
            }
        });
    }

});
