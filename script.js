// ============================================
// QKJ STORE
// FRONTEND SCRIPT
// ============================================


// ============================================
// CONFIGURATION
// ============================================

const SHEET_ID =
  "1u9uKN8GeX-1VElXVIdXoNNEsG6xppKGa2gI-PEnDDaI";

const SHEET_NAME = "Sheet1";

const API_URL =
  "https://qkj-payment-api.onrender.com";


// ============================================
// CRYPTO WALLETS
// ============================================

const WALLETS = {

  ETH:
    "0x00c07014Ef8a60eC2E95ee559b58590dd18F89A7",

  BNB:
    "0x00c07014Ef8a60eC2E95ee559b58590dd18F89A7",

  SOL:
    "3wSMFEkjRyD7eWu9sTrtiKrBcRPDsNBCu9X4xm4tenbf",

  DOGE:
    "DTPkSQ9omnxgh7kFL8jUnc6KVR7JqsBWqf",

  USDT_TRC20:
    "TF29vt78UY8XHx5bk19W3u1b33JcZbUcaE",

  BTC:
    "bc1qdr3k3p09kjey0cdlijhrkeqjvx2ane6ujzz6xy"
};


// ============================================
// STORE STATE
// ============================================

let products = [];

let selectedProduct = null;


// ============================================
// LOAD PRODUCTS FROM GOOGLE SHEETS
// ============================================

async function loadProducts() {

  try {

    const url =
      `https://docs.google.com/spreadsheets/d/` +
      `${SHEET_ID}/gviz/tq?tqx=out:json&sheet=` +
      encodeURIComponent(SHEET_NAME);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Could not load Google Sheet.");
    }

    const text = await response.text();

    const jsonText = text
      .replace(/^[^(]*\(/, "")
      .replace(/\);?\s*$/, "");

    const data = JSON.parse(jsonText);

    const rows = data.table.rows || [];

    const columns =
      data.table.cols.map(col =>
        String(col.label || "").trim().toLowerCase()
      );

    products = rows.map(row => {

      const values =
        row.c.map(cell =>
          cell && cell.v !== undefined
            ? cell.v
            : ""
        );

      const product = {};

      columns.forEach((column, index) => {
        product[column] = values[index] ?? "";
      });

      return normalizeProduct(product);

    });

    renderProducts(products);

  } catch (error) {

    console.error(
      "Product loading error:",
      error
    );

    const container =
      document.getElementById("products");

    if (container) {
      container.innerHTML =
        "<p>Unable to load products right now.</p>";
    }
  }
}


// ============================================
// NORMALIZE PRODUCT DATA
// ============================================

function normalizeProduct(product) {

  return {

    id:
      product.id ||
      product.product_id ||
      "",

    name:
      product.name ||
      product.title ||
      "Unnamed product",

    description:
      product.description ||
      "",

    price:
      Number(
        product.price_usd ||
        product.price ||
        product.p ||
        product.usd ||
        0
      ),

    image:
      product.image ||
      product.img ||
      product.photo ||
      "",

    download:
      product.download ||
      product.download_url ||
      product.file ||
      "",

    category:
      product.category ||
      "General"
  };
}


// ============================================
// RENDER PRODUCTS
// ============================================

function renderProducts(items) {

  const container =
    document.getElementById("products");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (!items.length) {

    container.innerHTML =
      "<p>No products available.</p>";

    return;
  }

  items.forEach(product => {

    const card =
      document.createElement("div");

    card.className = "product-card";

    card.innerHTML = `

      ${
        product.image
          ? `<img
              src="${escapeHtml(product.image)}"
              alt="${escapeHtml(product.name)}"
            >`
          : ""
      }

      <div class="product-content">

        <h3>
          ${escapeHtml(product.name)}
        </h3>

        <p>
          ${escapeHtml(product.description)}
        </p>

        <div class="product-price">
          $${product.price.toFixed(2)}
        </div>

        <button
          onclick="openCheckout('${escapeJs(product.id)}')"
        >
          Buy Now
        </button>

      </div>
    `;

    container.appendChild(card);
  });
}


// ============================================
// ESCAPE HTML
// ============================================

function escapeHtml(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ============================================
// ESCAPE JAVASCRIPT STRING
// ============================================

function escapeJs(value) {

  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");
}


// ============================================
// OPEN CHECKOUT
// ============================================

function openCheckout(productId) {

  selectedProduct =
    products.find(
      product =>
        String(product.id) === String(productId)
    );

  if (!selectedProduct) {

    alert("Product could not be found.");

    return;
  }

  const modal =
    document.getElementById("checkoutModal");

  if (modal) {
    modal.style.display = "flex";
  }


  const nameElement =
    document.getElementById("checkoutProductName");

  if (nameElement) {

    nameElement.textContent =
      selectedProduct.name;
  }


  const priceElement =
    document.getElementById("checkoutPrice");

  if (priceElement) {

    priceElement.textContent =
      `$${selectedProduct.price.toFixed(2)}`;
  }


  updateWallet();
}


// ============================================
// CLOSE CHECKOUT
// ============================================

function closeCheckout() {

  const modal =
    document.getElementById("checkoutModal");

  if (modal) {
    modal.style.display = "none";
  }

  selectedProduct = null;
}


// ============================================
// UPDATE WALLET DISPLAY
// ============================================

function updateWallet() {

  const currencyElement =
    document.getElementById("paymentCurrency");

  if (!currencyElement) {
    return;
  }

  const currency =
    currencyElement.value;

  const wallet =
    WALLETS[currency];

  const walletElement =
    document.getElementById("walletAddress");

  if (walletElement) {

    walletElement.textContent =
      wallet || "Wallet unavailable";
  }
}


// ============================================
// COPY WALLET
// ============================================

async function copyWallet() {

  const currencyElement =
    document.getElementById("paymentCurrency");

  if (!currencyElement) {
    return;
  }

  const currency =
    currencyElement.value;

  const wallet =
    WALLETS[currency];

  if (!wallet) {

    alert("Wallet address unavailable.");

    return;
  }

  try {

    await navigator.clipboard.writeText(wallet);

    alert("Wallet address copied!");

  } catch (error) {

    alert(
      "Could not copy automatically. " +
      "Please copy the address manually."
    );
  }
}


// ============================================
// SUBMIT PAYMENT
// ============================================

async function submitPayment() {

  const hashElement =
    document.getElementById("transactionHash");

  const currencyElement =
    document.getElementById("paymentCurrency");


  if (!hashElement) {

    alert(
      "Transaction hash field was not found."
    );

    return;
  }


  if (!currencyElement) {

    alert(
      "Payment currency field was not found."
    );

    return;
  }


  if (!selectedProduct) {

    alert(
      "Please select a product first."
    );

    return;
  }


  const transactionHash =
    hashElement.value.trim();

  const currency =
    currencyElement.value;


  if (!transactionHash) {

    alert(
      "Please enter your transaction hash."
    );

    return;
  }


  if (!currency) {

    alert(
      "Please select a cryptocurrency."
    );

    return;
  }


  try {

    alert(
      "Checking your payment..."
    );


    const response =
      await fetch(
        `${API_URL}/api/verify-payment`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            product_id:
              selectedProduct.id,

            currency:
              currency,

            transaction_hash:
              transactionHash
          })
        }
      );


    const result =
      await response.json();


    console.log(
      "Payment verification result:",
      result
    );


    if (result.verified === true) {

      alert(
        "Payment verified successfully!"
      );


      if (result.download_url) {

        window.location.href =
          result.download_url;

      } else {

        alert(
          "Payment was verified, " +
          "but product delivery has not " +
          "been connected yet."
        );
      }

      return;
    }


    alert(
      result.message ||
      "Payment could not be verified."
    );


  } catch (error) {

    console.error(
      "Payment verification error:",
      error
    );


    alert(
      "Unable to contact the payment server. " +
      "Please try again."
    );
  }
}


// ============================================
// CURRENCY CHANGE
// ============================================

const currencySelector =
  document.getElementById(
    "paymentCurrency"
  );

if (currencySelector) {

  currencySelector.addEventListener(
    "change",
    updateWallet
  );
}


// ============================================
// START STORE
// ============================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadProducts();

  }
);