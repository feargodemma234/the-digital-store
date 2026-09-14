/* =========================================================
   QKJ STORE - SCRIPT.JS
   ========================================================= */

const SHEET_ID =
  "1u9uKN8GeX-1VElXVIdXoNNEsG6xppKGa2gI-PEnDDaI";

const SHEET_NAME = "Sheet1";

const API_URL =
  "https://qkj-payment-api.onrender.com";


/* =========================================================
   CRYPTO WALLETS
   ========================================================= */

const WALLETS = {
  USDT_TRC20:
    "TF29vt78UY8XHx5bk19W3u1b33JcZbUcaE",

  BTC:
    "bc1qdr3k3p09kjey0cdlijhrkeqjvx2ane6ujzz6xy",

  ETH:
    "0x00c07014Ef8a60eC2E95ee559b58590dd18F89A7",

  BNB:
    "0x00c07014Ef8a60eC2E95ee559b58590dd18F89A7",

  SOL:
    "3wSMFEkjRyD7eWu9sTrtiKrBcRPDsNBCu9X4xm4tenbf",

  DOGE:
    "DTPkSQ9omnxgh7kFL8jUnc6KVR7JqsBWqf"
};


/* =========================================================
   CRYPTO INFORMATION
   ========================================================= */

const CRYPTO_INFO = {
  USDT_TRC20: {
    name: "USDT",
    network: "TRON (TRC20)",
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


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let products = [];
let selectedProduct = null;


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const productsContainer =
  document.getElementById("products");

const loading =
  document.getElementById("loading");

const errorMessage =
  document.getElementById("errorMessage");

const checkoutModal =
  document.getElementById("checkoutModal");

const checkoutProductName =
  document.getElementById("checkoutProductName");

const checkoutProductPrice =
  document.getElementById("checkoutProductPrice");

const cryptoSelect =
  document.getElementById("cryptoSelect");

const networkDisplay =
  document.getElementById("networkDisplay");

const walletDisplay =
  document.getElementById("walletDisplay");

const amountDisplay =
  document.getElementById("amountDisplay");

const transactionHash =
  document.getElementById("transactionHash");

const verifyButton =
  document.getElementById("verifyButton");

const verifyMessage =
  document.getElementById("verifyMessage");


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   NORMALIZE PRODUCT
   ========================================================= */

function normalizeProduct(row) {
  const get = (...keys) => {
    for (const key of keys) {
      if (
        row[key] !== undefined &&
        row[key] !== null &&
        String(row[key]).trim() !== ""
      ) {
        return String(row[key]).trim();
      }
    }

    return "";
  };

  return {
    id: get("id", "product_id", "sku"),

    name: get(
      "name",
      "title",
      "product_name"
    ),

    description: get(
      "description",
      "desc",
      "details"
    ),

    price: parseFloat(
      get(
        "price_usd",
        "price",
        "p",
        "usd",
        "amount"
      )
    ) || 0,

    image: get(
      "image",
      "image_url",
      "img",
      "thumbnail"
    ),

    download: get(
      "download",
      "download_url",
      "file",
      "file_url"
    ),

    category: get(
      "category",
      "type"
    )
  };
}


/* =========================================================
   LOAD PRODUCTS FROM GOOGLE SHEETS
   ========================================================= */

async function loadProducts() {
  if (loading) {
    loading.style.display = "block";
  }

  if (errorMessage) {
    errorMessage.style.display = "none";
  }

  try {
    const url =
      `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        "Could not connect to Google Sheets."
      );
    }

    const text = await response.text();

    const jsonText = text
      .replace(
        /^.*setResponse\(/,
        ""
      )
      .replace(
        /\);?\s*$/,
        ""
      );

    const data = JSON.parse(jsonText);

    const columns = data.table.cols.map(
      column =>
        String(
          column.label || column.id || ""
        )
          .trim()
          .toLowerCase()
      );

    products = data.table.rows
      .map(row => {
        const product = {};

        columns.forEach((column, index) => {
          product[column] =
            row.c[index]?.v ?? "";
        });

        return normalizeProduct(product);
      })
      .filter(product => product.name);

    renderProducts(products);

  } catch (error) {
    console.error(
      "Product loading error:",
      error
    );

    if (errorMessage) {
      errorMessage.textContent =
        "Unable to load products. Please try again later.";

      errorMessage.style.display = "block";
    }
  } finally {
    if (loading) {
      loading.style.display = "none";
    }
  }
}


/* =========================================================
   RENDER PRODUCTS
   ========================================================= */

function renderProducts(list) {
  if (!productsContainer) return;

  productsContainer.innerHTML = "";

  if (!list.length) {
    productsContainer.innerHTML = `
      <p class="no-products">
        No products available yet.
      </p>
    `;

    return;
  }

  list.forEach(product => {
    const card =
      document.createElement("div");

    card.className = "product-card";

    /*
      IMPORTANT:
      The image now has class="product-image"
      so the CSS can control its size.
    */

    const imageHTML =
      product.image
        ? `
          <img
            class="product-image"
            src="${escapeHtml(product.image)}"
            alt="${escapeHtml(product.name)}"
            loading="lazy"
            onerror="this.style.display='none'"
          >
        `
        : `
          <div class="product-image-placeholder">
            No Image
          </div>
        `;

    card.innerHTML = `
      ${imageHTML}

      <div class="product-content">

        <h3>
          ${escapeHtml(product.name)}
        </h3>

        <p>
          ${escapeHtml(product.description)}
        </p>

        <div class="product-bottom">

          <div class="product-price">
            $${product.price.toFixed(2)}
          </div>

          <button
            class="buy-button"
            type="button"
          >
            Buy Now
          </button>

        </div>

      </div>
    `;

    const buyButton =
      card.querySelector(".buy-button");

    buyButton.addEventListener(
      "click",
      () => openCheckout(product)
    );

    productsContainer.appendChild(card);
  });
}


/* =========================================================
   OPEN CHECKOUT
   ========================================================= */

function openCheckout(product) {
  selectedProduct = product;

  if (checkoutProductName) {
    checkoutProductName.textContent =
      product.name;
  }

  if (checkoutProductPrice) {
    checkoutProductPrice.textContent =
      `$${product.price.toFixed(2)}`;
  }

  if (cryptoSelect) {
    cryptoSelect.value =
      "USDT_TRC20";
  }

  updateCryptoInformation();

  if (transactionHash) {
    transactionHash.value = "";
  }

  if (verifyMessage) {
    verifyMessage.textContent = "";
    verifyMessage.style.display = "none";
  }

  if (checkoutModal) {
    checkoutModal.style.display = "flex";
  }
}


/* =========================================================
   CLOSE CHECKOUT
   ========================================================= */

function closeCheckout() {
  if (checkoutModal) {
    checkoutModal.style.display = "none";
  }

  selectedProduct = null;
}


/* =========================================================
   UPDATE CRYPTO INFORMATION
   ========================================================= */

function updateCryptoInformation() {
  if (!cryptoSelect) return;

  const crypto =
    cryptoSelect.value;

  const info =
    CRYPTO_INFO[crypto];

  if (!info) return;

  if (networkDisplay) {
    networkDisplay.textContent =
      info.network;
  }

  if (walletDisplay) {
    walletDisplay.textContent =
      WALLETS[crypto];
  }

  /*
    ONLY USDT AUTO-CALCULATES.

    Other cryptocurrencies display a message
    telling the customer that the backend must
    provide the current amount.
  */

  if (
    crypto === "USDT_TRC20" &&
    selectedProduct
  ) {
    if (amountDisplay) {
      amountDisplay.textContent =
        `${selectedProduct.price.toFixed(2)} USDT`;
    }
  } else {
    if (amountDisplay) {
      amountDisplay.textContent =
        `Payment amount will be calculated for ${info.symbol}.`;
    }
  }
}


/* =========================================================
   VERIFY TRANSACTION
   ========================================================= */

async function verifyTransaction() {
  if (!selectedProduct) {
    showVerifyMessage(
      "Please select a product first.",
      true
    );

    return;
  }

  const crypto =
    cryptoSelect?.value;

  const hash =
    transactionHash?.value.trim();

  if (!crypto) {
    showVerifyMessage(
      "Please select a cryptocurrency.",
      true
    );

    return;
  }

  if (!hash) {
    showVerifyMessage(
      "Please enter your transaction hash.",
      true
    );

    return;
  }

  /*
    Prevent repeated clicks.
  */

  if (verifyButton) {
    verifyButton.disabled = true;
    verifyButton.textContent =
      "Verifying...";
  }

  showVerifyMessage(
    "Checking the blockchain transaction...",
    false
  );

  try {
    const response =
      await fetch(
        `${API_URL}/verify-payment`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            productId:
              selectedProduct.id,

            productName:
              selectedProduct.name,

            crypto: crypto,

            transactionHash:
              hash
          })
        }
      );

    const data =
      await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
        "Payment could not be verified."
      );
    }

    showVerifyMessage(
      "Payment verified successfully. Preparing your download...",
      false
    );

    /*
      The backend should return a secure download URL
      only after it has independently verified the
      blockchain transaction.
    */

    if (data.downloadUrl) {
      setTimeout(() => {
        window.location.href =
          data.downloadUrl;
      }, 1000);

      return;
    }

    /*
      Fallback only if backend does not return
      a secure download URL.
    */

    if (selectedProduct.download) {
      setTimeout(() => {
        window.location.href =
          selectedProduct.download;
      }, 1000);

      return;
    }

    showVerifyMessage(
      "Payment was verified, but the download file is not available yet.",
      true
    );

  } catch (error) {
    console.error(
      "Verification error:",
      error
    );

    showVerifyMessage(
      error.message ||
      "Unable to verify payment. Please try again.",
      true
    );

  } finally {
    if (verifyButton) {
      verifyButton.disabled = false;
      verifyButton.textContent =
        "Verify Payment";
    }
  }
}


/* =========================================================
   VERIFICATION MESSAGE
   ========================================================= */

function showVerifyMessage(
  message,
  isError
) {
  if (!verifyMessage) return;

  verifyMessage.textContent =
    message;

  verifyMessage.style.display =
    "block";

  verifyMessage.classList.toggle(
    "error",
    Boolean(isError)
  );

  verifyMessage.classList.toggle(
    "success",
    !isError
  );
}


/* =========================================================
   CATEGORY FILTER
   ========================================================= */

function filterProducts(category) {
  if (category === "all") {
    renderProducts(products);
    return;
  }

  const filtered =
    products.filter(product =>
      String(product.category)
        .toLowerCase() ===
      String(category)
        .toLowerCase()
    );

  renderProducts(filtered);
}


/* =========================================================
   CATEGORY BUTTONS
   ========================================================= */

document
  .querySelectorAll(
    "[data-category]"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(
            "[data-category]"
          )
          .forEach(btn =>
            btn.classList.remove(
              "active"
            )
          );

        button.classList.add(
          "active"
        );

        filterProducts(
          button.dataset.category
        );
      }
    );

  });


/* =========================================================
   CRYPTO SELECT
   ========================================================= */

if (cryptoSelect) {
  cryptoSelect.addEventListener(
    "change",
    updateCryptoInformation
  );
}


/* =========================================================
   VERIFY BUTTON
   ========================================================= */

if (verifyButton) {
  verifyButton.addEventListener(
    "click",
    verifyTransaction
  );
}


/* =========================================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
   ========================================================= */

if (checkoutModal) {
  checkoutModal.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        checkoutModal
      ) {
        closeCheckout();
      }

    }
  );
}


/* =========================================================
   ESC KEY CLOSES MODAL
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape" &&
      checkoutModal &&
      checkoutModal.style.display === "flex"
    ) {
      closeCheckout();
    }

  }
);


/* =========================================================
   LOAD STORE
   ========================================================= */

loadProducts();


/* =========================================================
   FOOTER YEAR
   ========================================================= */

const yearElement =
  document.getElementById("year");

if (yearElement) {
  yearElement.textContent =
    new Date().getFullYear();
}