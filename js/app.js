import { defaultProducts } from "../data/products.js";
import { STORE_CONFIG } from "./config.js";

let products = JSON.parse(localStorage.getItem(STORE_CONFIG.productsStorageKey)) || defaultProducts;
let cart = [];
let currentCategory = "todos";
let searchQuery = "";

function money(value) {
    return `$${Number(value).toFixed(2)} ${STORE_CONFIG.currency}`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function renderProducts() {
    const grid = document.getElementById("product-grid");
    const filtered = products.filter(product =>
        (currentCategory === "todos" || product.category === currentCategory) &&
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!filtered.length) {
        grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:2rem;color:#888;">No hay productos disponibles.</p>`;
        return;
    }

    grid.innerHTML = filtered.map(product => `
        <article class="product-card">
            <span class="product-badge">${escapeHtml(product.badge || "Nuevo")}</span>
            <img src="${escapeHtml(product.image)}" class="product-img" alt="${escapeHtml(product.name)}" loading="lazy">
            <div class="product-info">
                <h3 class="product-title">${escapeHtml(product.name)}</h3>
                <div class="product-price">${money(product.price)}</div>
                <button class="add-to-cart-btn" data-add-product="${product.id}">
                    <i class="fas fa-cart-plus"></i> Agregar al carrito
                </button>
            </div>
        </article>
    `).join("");
}

function openCart() {
    document.getElementById("cart-sidebar").classList.add("active");
    document.getElementById("cart-overlay").classList.add("active");
}

function closeCart() {
    document.getElementById("cart-sidebar").classList.remove("active");
    document.getElementById("cart-overlay").classList.remove("active");
}

function updateCart() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById("cart-count").textContent = count;

    const container = document.getElementById("cart-items");
    const whatsappButton = document.getElementById("whatsapp-order-btn");

    if (!cart.length) {
        container.innerHTML = `<p style="text-align:center;color:#999;margin-top:2rem;">El carrito está vacío</p>`;
        document.getElementById("cart-total-price").textContent = money(0);
        whatsappButton.href = "#";
        whatsappButton.setAttribute("aria-disabled", "true");
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
            <div class="cart-item-details">
                <div style="font-weight:600;font-size:.9rem;">${escapeHtml(item.name)}</div>
                <div style="color:#777;font-size:.8rem;">${money(item.price)} × ${item.quantity}</div>
                <div class="cart-quantity">
                    <button data-cart-action="decrease" data-product-id="${item.id}" aria-label="Reducir cantidad">−</button>
                    <span>${item.quantity}</span>
                    <button data-cart-action="increase" data-product-id="${item.id}" aria-label="Aumentar cantidad">+</button>
                    <button class="cart-remove" data-cart-action="remove" data-product-id="${item.id}">Eliminar</button>
                </div>
            </div>
        </div>
    `).join("");

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    document.getElementById("cart-total-price").textContent = money(total);

    // El carrito NO procesa pagos. Genera directamente el pedido para WhatsApp de empresa.
    let message = ` *Pedido desde ${STORE_CONFIG.name}*\n\n`;
    cart.forEach((item, index) => {
        message += `${index + 1}. *${item.name}*\n   Cantidad: ${item.quantity}\n   Precio: ${money(item.price * item.quantity)}\n\n`;
    });
    message += ` *Total estimado: ${money(total)}*\n\n`;
    message += `Hola, quiero realizar este pedido. ¿Me confirman disponibilidad, talla/color y datos de entrega?`;

    whatsappButton.href = `https://wa.me/${STORE_CONFIG.whatsappPhone}?text=${encodeURIComponent(message)}`;
    whatsappButton.removeAttribute("aria-disabled");
}

function addToCart(id) {
    const product = products.find(item => item.id === Number(id));
    if (!product) return;

    const item = cart.find(entry => entry.id === product.id);
    if (item) item.quantity += 1;
    else cart.push({ ...product, quantity: 1 });

    updateCart();
    openCart();
}

function changeQuantity(id, delta) {
    const item = cart.find(entry => entry.id === Number(id));
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) cart = cart.filter(entry => entry.id !== Number(id));
    updateCart();
}

document.addEventListener("click", event => {
    const addButton = event.target.closest("[data-add-product]");
    if (addButton) addToCart(addButton.dataset.addProduct);

    const cartButton = event.target.closest("[data-cart-action]");
    if (cartButton) {
        const id = cartButton.dataset.productId;
        const action = cartButton.dataset.cartAction;
        if (action === "increase") changeQuantity(id, 1);
        if (action === "decrease") changeQuantity(id, -1);
        if (action === "remove") {
            cart = cart.filter(item => item.id !== Number(id));
            updateCart();
        }
    }
});

document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", event => {
        document.querySelectorAll(".filter-btn").forEach(item => item.classList.remove("active"));
        event.currentTarget.classList.add("active");
        currentCategory = event.currentTarget.dataset.category;
        renderProducts();
    });
});

document.getElementById("search-input").addEventListener("input", event => {
    searchQuery = event.target.value;
    renderProducts();
});

document.getElementById("open-cart").addEventListener("click", openCart);
document.getElementById("close-cart").addEventListener("click", closeCart);
document.getElementById("cart-overlay").addEventListener("click", closeCart);

document.getElementById("whatsapp-order-btn").addEventListener("click", event => {
    if (!cart.length) event.preventDefault();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeCart();
});

renderProducts();
updateCart();
