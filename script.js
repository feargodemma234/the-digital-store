// ============================================
// QKJ STORE
// FRONTEND SCRIPT
// ============================================


// ============================================
// CONFIGURATION
// ============================================

const SHEET_ID =
  "1u9uKN8GeX-1VElXVIdXoNNEsG6xppKGa2gI-PEnDDaI";

const SHEET_NAME =
  "Sheet1";

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
// CRYPTOCURRENCY INFORMATION
// ============================================

const CRYPTO_INFO = {

  USDT_TRC20: {
    name: "USDT",
    network: "Tron (TRC20)",
    symbol: "USDT"
  },

  BTC: {
    name: "Bitcoin",
    network: "Bitcoin",
    symbol: "BTC"
  },

  ETH: {
    name: "Ethereum",
    network: "Ethereum",
    symbol: "ETH"
  },

  BNB: {
    name: "BNB",
    network: "BNB Smart Chain",
    symbol: "BNB"
  },

  SOL: {
    name: "Solana",
    network: "Solana",
    symbol: "SOL"
  },

  DOGE: {
    name: "Dogecoin",
    network: "Dogecoin",
    symbol: "DOGE"
  }

};


// ============================================
// STORE STATE
// ============================================

let products = [];

let selectedProduct = null;

let selectedCategory = "all";


// ============================================
// LOAD PRODUCTS FROM GOOGLE SHEETS
// ============================================

async function loadProducts() {

  const loading =
    document.getElementById("loading");

  const errorMessage =
    document.getElementById("errorMessage");

  try {

    if (loading) {
      loading.style.display = "block";
    }

    if (errorMessage) {
      errorMessage.textContent = "";
    }


    const url =
      `https://docs.google.com/spreadsheets/d/` +
      `${SHEET_ID}/gviz/tq?tqx=out:json&sheet=` +
      encodeURIComponent(SHEET_NAME);


    const response =
      await fetch(url);


    if (!response.ok) {
      throw new Error(
        "Could not load Google Sheet."
      );
    }


    const text =
      await response.text();


    const jsonText =
      text
        .replace(/^[^(]*\(/, "")
        .replace(/\);?\s*$/, "");


    const data =
      JSON.parse(jsonText);


    const rows =
      data.table.rows || [];


    const columns =
      data.table.cols.map(
        col =>
          String(
            col.label || ""
          )
            .trim()
            .toLowerCase()
      );


    products =
      rows.map(row => {

        const values =
          row.c.map(cell =>
            cell &&
            cell.v !== undefined
              ? cell.v
              : ""
          );


        const product = {};


        columns.forEach(
          (column, index) => {

            product[column] =
              values[index] ?? "";

          }
        );


        return normalizeProduct(product);

      });


    renderProducts(products);


  } catch (error) {

    console.error(
      "Product loading error:",
      error
    );


    if (loading) {
      loading.style.display =
        "none";
    }


    if (errorMessage) {

      errorMessage.textContent =
        "Unable to load products right now.";

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
      String(
        product.category ||
        "General"
      )
        .trim()
        .toLowerCase()

  };

}


// ============================================
// RENDER PRODUCTS
// ============================================

function renderProducts(items) {

  const container =
    document.getElementById("products");


  const loading =
    document.getElementById("loading");


  if (!container) {
    return;
  }


  if (loading) {
    loading.style.display =
      "none";
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


    card.className =
      "product-card";


    const imageHTML =
      product.image

        ? `
          <img
            src="${escapeHtml(product.image)}"
            alt="${escapeHtml(product.name)}"
          >
        `

        : "";


    card.innerHTML = `

      ${imageHTML}

      <div class="product-content">

        <h3>
          ${escapeHtml(product.name)}
        </h3>

        <p>
          ${escapeHtml(product.description)}
        </p>

        <div class="product-price">
          $${product.price.toFixed(2)} USD
        </div>

        <button
          type="button"
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
// FILTER PRODUCTS
// ============================================

function filterProducts(category) {

  selectedCategory =
    String(category || "all")
      .trim()
      .toLowerCase();


  const buttons =
    document.querySelectorAll(
      ".category-button"
    );


  buttons.forEach(button => {

    const buttonText =
      button.textContent
        .trim()
        .toLowerCase();


    if (
      buttonText ===
      selectedCategory
    ) {

      button.classList.add(
        "active"
      );

    } else {

      button.classList.remove(
        "active"
      );

    }

  });


  if (
    selectedCategory ===
    "all"
  ) {

    renderProducts(products);

    return;

  }


  const filtered =
    products.filter(product =>
      String(
        product.category
      )
        .trim()
        .toLowerCase() ===
      selectedCategory
    );


  renderProducts(filtered);

}


// ============================================
// ESCAPE HTML
// ============================================

function escapeHtml(value) {

  return String(value)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


// ============================================
// ESCAPE JAVASCRIPT STRING
// ============================================

function escapeJs(value) {

  return String(value)

    .replace(
      /\\/g,
      "\\\\"
    )

    .replace(
      /'/g,
      "\\'"
    );

}


// ============================================
// OPEN CHECKOUT
// ============================================

function openCheckout(productId) {

  selectedProduct =
    products.find(
      product =>
        String(product.id) ===
        String(productId)
    );


  if (!selectedProduct) {

    alert(
      "Product could not be found."
    );

    return;

  }


  const modal =
    document.getElementById(
      "checkoutModal"
    );


  if (modal) {

    modal.style.display =
      "flex";

  }


  const nameElement =
    document.getElementById(
      "checkoutProductName"
    );


  if (nameElement) {

    nameElement.textContent =
      selectedProduct.name;

  }


  const descriptionElement =
    document.getElementById(
      "checkoutProductDescription"
    );


  if (descriptionElement) {

    descriptionElement.textContent =
      selectedProduct.description;

  }


  const priceElement =
    document.getElementById(
      "checkoutPrice"
    );


  if (priceElement) {

    priceElement.textContent =
      `$${selectedProduct.price.toFixed(2)}`;

  }


  const hashElement =
    document.getElementById(
      "transactionHash"
    );


  if (hashElement) {
    hashElement.value = "";
  }


  updatePaymentInformation();

}


// ============================================
// CLOSE CHECKOUT
// ============================================

function closeCheckout() {

  const modal =
    document.getElementById(
      "checkoutModal"
    );


  if (modal) {

    modal.style.display =
      "none";

  }


  selectedProduct =
    null;

}


// ============================================
// UPDATE PAYMENT INFORMATION
// ============================================

function updatePaymentInformation() {

  const currencyElement =
    document.getElementById(
      "paymentCurrency"
    );


  if (!currencyElement) {
    return;
  }


  const currency =
    currencyElement.value;


  const info =
    CRYPTO_INFO[currency];


  const wallet =
    WALLETS[currency];


  const networkElement =
    document.getElementById(
      "paymentNetwork"
    );


  const walletElement =
    document.getElementById(
      "walletAddress"
    );


  const amountElement =
    document.getElementById(
      "paymentAmount"
    );


  if (networkElement) {

    networkElement.textContent =
      info
        ? info.network
        : "Network unavailable";

  }


  if (walletElement) {

    walletElement.value =
      wallet ||
      "Wallet unavailable";

  }


  if (amountElement) {

    if (selectedProduct && info) {

      amountElement.textContent =
        `Product price: $${selectedProduct.price.toFixed(2)} USD`;

    } else {

      amountElement.textContent =
        "Select a cryptocurrency.";

    }

  }

}


// ============================================
// UPDATE WALLET
// ============================================

function updateWallet() {

  updatePaymentInformation();

}


// ============================================
// SELECT CURRENCY
// ============================================

function selectCurrency(currency) {

  const currencyElement =
    document.getElementById(
      "paymentCurrency"
    );


  if (currencyElement) {

    currencyElement.value =
      currency;

  }


  updatePaymentInformation();

}


// ============================================
// COPY WALLET
// ============================================

async function copyWallet() {

  const currencyElement =
    document.getElementById(
      "paymentCurrency"
    );


  if (!currencyElement) {
    return;
  }


  const currency =
    currencyElement.value;


  const wallet =
    WALLETS[currency];


  if (!wallet) {

    alert(
      "Wallet address unavailable."
    );

    return;

  }


  try {

    await navigator.clipboard.writeText(
      wallet
    );


    alert(
      "Wallet address copied!"
    );


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
    document.getElementById(
      "transactionHash"
    );


  const currencyElement =
    document.getElementById(
      "paymentCurrency"
    );


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
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({

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


    if (
      result.verified === true
    ) {

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
// CLOSE MODAL WHEN CLICKING OUTSIDE
// ============================================

window.addEventListener(
  "click",
  event => {

    const modal =
      document.getElementById(
        "checkoutModal"
      );


    if (
      modal &&
      event.target === modal
    ) {

      closeCheckout();

    }

  }
);


// ============================================
// CURRENCY CHANGE
// ============================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const currencySelector =
      document.getElementById(
        "paymentCurrency"
      );


    if (currencySelector) {

      currencySelector.addEventListener(
        "change",
        updatePaymentInformation
      );

    }


    // Current year

    const yearElement =
      document.getElementById(
        "year"
      );


    if (yearElement) {

      yearElement.textContent =
        new Date().getFullYear();

    }


    // Load products

    loadProducts();

  }
);