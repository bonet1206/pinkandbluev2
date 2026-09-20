import { defaultProducts } from "../data/products.js";
import { STORE_CONFIG } from "./config.js";

let products = JSON.parse(localStorage.getItem(STORE_CONFIG.productsStorageKey)) || defaultProducts;
let selectedImageData = "";

const login = document.getElementById("admin-login");
const dashboard = document.getElementById("admin-dashboard");
const passwordInput = document.getElementById("admin-password");
const loginMessage = document.getElementById("login-message");

function saveProducts() {
    localStorage.setItem(STORE_CONFIG.productsStorageKey, JSON.stringify(products));
}

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

function renderAdminTable() {
    document.getElementById("admin-table-body").innerHTML = products.map(product => `
        <tr>
            <td><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}"></td>
            <td>${escapeHtml(product.name)}</td>
            <td>${escapeHtml(product.category)}</td>
            <td>${money(product.price)}</td>
            <td>
                <button class="delete-btn" data-delete-product="${product.id}" aria-label="Eliminar producto">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join("");
}

function showDashboard() {
    login.classList.add("hidden");
    dashboard.classList.add("active");
    renderAdminTable();
}

function doLogin() {
    // Se conserva la contraseña actual del prototipo.
    const allowed = ["1234", "admin"];
    if (allowed.includes(passwordInput.value)) {
        sessionStorage.setItem("pb_admin_session", "1");
        loginMessage.textContent = "";
        showDashboard();
    } else {
        loginMessage.textContent = "Contraseña incorrecta.";
        passwordInput.select();
    }
}

function readImageAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

document.getElementById("login-btn").addEventListener("click", doLogin);
passwordInput.addEventListener("keydown", event => {
    if (event.key === "Enter") doLogin();
});

document.getElementById("logout-btn").addEventListener("click", () => {
    sessionStorage.removeItem("pb_admin_session");
    location.reload();
});

document.getElementById("prod-image-file").addEventListener("change", async event => {
    const file = event.target.files?.[0];
    selectedImageData = "";
    document.getElementById("image-preview").innerHTML = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Selecciona un archivo de imagen válido.");
        event.target.value = "";
        return;
    }

    // Redimensionamos antes de guardar para evitar llenar LocalStorage con archivos enormes.
    const dataUrl = await readImageAsDataUrl(file);
    const image = new Image();
    image.onload = () => {
        const max = 1200;
        const scale = Math.min(1, max / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        selectedImageData = canvas.toDataURL("image/jpeg", 0.82);
        document.getElementById("image-preview").innerHTML = `
            <img src="${selectedImageData}" alt="Vista previa" style="max-width:180px;max-height:180px;border-radius:10px;box-shadow:var(--shadow-sm);">`;
    };
    image.src = dataUrl;
});

document.getElementById("add-product-form").addEventListener("submit", event => {
    event.preventDefault();

    const product = {
        id: Date.now(),
        name: document.getElementById("prod-name").value.trim(),
        category: document.getElementById("prod-category").value,
        price: Number.parseFloat(document.getElementById("prod-price").value),
        badge: document.getElementById("prod-badge").value.trim() || "Nuevo",
        image: selectedImageData
    };

    if (!product.name || !Number.isFinite(product.price) || !selectedImageData) {
        alert("Completa los datos y selecciona una imagen desde tu equipo.");
        return;
    }

    products.push(product);
    saveProducts();
    renderAdminTable();
    event.target.reset();
    selectedImageData = "";
    document.getElementById("image-preview").innerHTML = "";
    alert("¡Producto agregado exitosamente!");
});

document.addEventListener("click", event => {
    const button = event.target.closest("[data-delete-product]");
    if (!button) return;

    const id = Number(button.dataset.deleteProduct);
    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;

    products = products.filter(product => product.id !== id);
    saveProducts();
    renderAdminTable();
});

if (sessionStorage.getItem("pb_admin_session") === "1") showDashboard();
