/* =========================================================
   QKJ STORE
   FULL STORE SCRIPT
   ========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
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
    symbol: "USDT",
    autoCalculate: true
  },

  BTC: {
    name: "Bitcoin",
    network: "Bitcoin",
    symbol: "BTC",
    autoCalculate: false
  },

  ETH: {
    name: "Ethereum",
    network: "Ethereum",
    symbol: "ETH",
    autoCalculate: false
  },

  BNB: {
    name: "BNB",
    network: "BNB Smart Chain",
    symbol: "BNB",
    autoCalculate: false
  },

  SOL: {
    name: "Solana",
    network: "Solana",
    symbol: "SOL",
    autoCalculate: false
  },

  DOGE: {
    name: "Dogecoin",
    network: "Dogecoin",
    symbol: "DOGE",
    autoCalculate: false
  }

};


/* =========================================================
   GLOBAL STATE
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
   HTML ESCAPE
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


  const priceText = get(
    "price",
    "price_usd",
    "p",
    "usd",
    "amount",
    "cost"
  );


  const parsedPrice =
    parseFloat(
      String(priceText)
        .replace(/[$,]/g, "")
    );


  return {

    id: get(
      "id",
      "product_id",
      "sku"
    ),

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

    price:
      Number.isFinite(parsedPrice)
        ? parsedPrice
        : 0,

    image: get(
      "image",
      "image_url",
      "img",
      "thumbnail",
      "photo"
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
   LOAD PRODUCTS
   ========================================================= */

async function loadProducts() {

  if (loading) {
    loading.style.display = "block";
  }


  if (errorMessage) {
    errorMessage.style.display = "none";
  }


  try {

    /*
      Google Visualization API
    */

    const url =
      `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${encodeURIComponent(SHEET_NAME)}&tqx=out:json&_=${Date.now()}`;


    const response =
      await fetch(
        url,
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        `Google Sheets returned HTTP ${response.status}`
      );

    }


    const text =
      await response.text();


    /*
      Google wraps the JSON in:
      google.visualization.Query.setResponse(...)
    */

    const start =
      text.indexOf("{");

    const end =
      text.lastIndexOf("}");


    if (
      start === -1 ||
      end === -1
    ) {

      throw new Error(
        "Google Sheets did not return valid data."
      );

    }


    const jsonText =
      text.substring(
        start,
        end + 1
      );


    const data =
      JSON.parse(jsonText);


    if (
      !data.table ||
      !Array.isArray(data.table.cols) ||
      !Array.isArray(data.table.rows)
    ) {

      throw new Error(
        "The Google Sheet could not be read."
      );

    }


    /*
      Read column names.
    */

    const columns =
      data.table.cols.map(
        (column, index) => {

          return String(
            column.label ||
            column.id ||
            `column_${index}`
          )
            .trim()
            .toLowerCase();

        }
      );


    /*
      Convert rows into normal JavaScript objects.
    */

    products =
      data.table.rows
        .map(row => {

          const product = {};


          columns.forEach(
            (column, index) => {

              const cell =
                row.c?.[index];


              product[column] =
                cell?.v ??
                cell?.f ??
                "";

            }
          );


          return normalizeProduct(
            product
          );

        })
        .filter(product => {

          return (
            product.name &&
            product.id
          );

        });


    console.log(
      "QKJ Store products:",
      products
    );


    if (!products.length) {

      throw new Error(
        "No products were found in Sheet1."
      );

    }


    renderProducts(products);


  } catch (error) {

    console.error(
      "QKJ Store loading error:",
      error
    );


    if (errorMessage) {

      errorMessage.innerHTML = `
        <strong>Unable to load products.</strong>
        <br>
        Please make sure your Google Sheet is set to
        <strong>Anyone with the link → Viewer</strong>.
      `;

      errorMessage.style.display =
        "block";

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

  if (!productsContainer) {
    return;
  }


  productsContainer.innerHTML = "";


  if (!list.length) {

    productsContainer.innerHTML = `
      <div class="no-products">
        No products available.
      </div>
    `;

    return;

  }


  list.forEach(product => {

    const card =
      document.createElement("div");


    card.className =
      "product-card";


    /*
      PRODUCT IMAGE

      The class product-image is now included,
      so CSS can control the image size.
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
          ${escapeHtml(
            product.description
          )}
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
      card.querySelector(
        ".buy-button"
      );


    if (buyButton) {

      buyButton.addEventListener(
        "click",
        () => openCheckout(product)
      );

    }


    productsContainer.appendChild(
      card
    );

  });

}


/* =========================================================
   OPEN CHECKOUT
   ========================================================= */

function openCheckout(product) {

  selectedProduct =
    product;


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


  if (transactionHash) {

    transactionHash.value = "";

  }


  if (verifyMessage) {

    verifyMessage.textContent =
      "";

    verifyMessage.style.display =
      "none";

  }


  updateCryptoInformation();


  if (checkoutModal) {

    checkoutModal.style.display =
      "flex";

  }

}


/* =========================================================
   CLOSE CHECKOUT
   ========================================================= */

function closeCheckout() {

  if (checkoutModal) {

    checkoutModal.style.display =
      "none";

  }


  selectedProduct =
    null;

}


/* =========================================================
   UPDATE CRYPTO INFORMATION
   ========================================================= */

function updateCryptoInformation() {

  if (!cryptoSelect) {
    return;
  }


  const crypto =
    cryptoSelect.value;


  const info =
    CRYPTO_INFO[crypto];


  if (!info) {
    return;
  }


  /*
    NETWORK
  */

  if (networkDisplay) {

    networkDisplay.textContent =
      info.network;

  }


  /*
    WALLET
  */

  if (walletDisplay) {

    walletDisplay.textContent =
      WALLETS[crypto];

  }


  /*
    PAYMENT AMOUNT

    USDT:
      Product price = USDT amount.

    Other coins:
      We don't pretend to know a live exchange
      rate on the frontend.
  */

  if (amountDisplay) {

    if (
      crypto === "USDT_TRC20" &&
      selectedProduct
    ) {

      amountDisplay.textContent =
        `${selectedProduct.price.toFixed(2)} USDT`;

    } else {

      amountDisplay.textContent =
        `Current ${info.symbol} amount will be calculated by the payment system.`;

    }

  }

}


/* =========================================================
   VERIFY PAYMENT
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
    Basic hash length check.
    The backend remains responsible for real
    blockchain verification.
  */

  if (hash.length < 20) {

    showVerifyMessage(
      "The transaction hash appears to be invalid.",
      true
    );

    return;

  }


  if (verifyButton) {

    verifyButton.disabled =
      true;

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

            crypto:
              crypto,

            transactionHash:
              hash

          })

        }
      );


    let data = {};


    try {

      data =
        await response.json();

    } catch {

      data = {};

    }


    if (
      !response.ok ||
      !data.success
    ) {

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
      IMPORTANT:

      The preferred method is for the BACKEND to
      return a secure download URL only after
      verifying the transaction.

      We do NOT automatically trust a transaction
      hash on the frontend.
    */

    if (data.downloadUrl) {

      setTimeout(() => {

        window.location.href =
          data.downloadUrl;

      }, 1000);

      return;

    }


    /*
      If your backend doesn't yet return
      downloadUrl, use the product download URL
      as a temporary fallback.

      For production, the backend should return
      the protected download URL.
    */

    if (selectedProduct.download) {

      setTimeout(() => {

        window.location.href =
          selectedProduct.download;

      }, 1000);

      return;

    }


    showVerifyMessage(
      "Payment verified, but the download file is unavailable.",
      true
    );


  } catch (error) {

    console.error(
      "Payment verification error:",
      error
    );


    showVerifyMessage(
      error.message ||
      "Unable to verify payment. Please try again.",
      true
    );


  } finally {

    if (verifyButton) {

      verifyButton.disabled =
        false;

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

  if (!verifyMessage) {
    return;
  }


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

  if (
    !category ||
    category.toLowerCase() === "all"
  ) {

    renderProducts(products);

    return;

  }


  const filtered =
    products.filter(product => {

      return String(
        product.category
      )
        .trim()
        .toLowerCase() ===
      String(category)
        .trim()
        .toLowerCase();

    });


  renderProducts(
    filtered
  );

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
          .forEach(btn => {

            btn.classList.remove(
              "active"
            );

          });


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
   CLOSE MODAL BY CLICKING OUTSIDE
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
   ESC KEY
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
   FOOTER YEAR
   ========================================================= */

const yearElement =
  document.getElementById("year");


if (yearElement) {

  yearElement.textContent =
    new Date().getFullYear();

}


/* =========================================================
   START STORE
   ========================================================= */

loadProducts();