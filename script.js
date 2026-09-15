/* =========================================================
   QKJ STORE - FRONTEND
========================================================= */

const SHEET_ID =
  "1u9uKN8GeX-1VElXVIdXoNNEsG6xppKGa2gI-PEnDDaI";

const SHEET_NAME = "Sheet1";

const API_URL =
  "https://qkj-payment-api.onrender.com";

/* =========================================================
   WALLET ADDRESSES
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
    network: "TRON TRC20",
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
   STATE
========================================================= */

let productsData = [];

let selectedProduct = null;

let selectedCurrency =
  "USDT_TRC20";

/* =========================================================
   ELEMENT HELPERS
========================================================= */

function getElement(...ids) {
  for (const id of ids) {
    const element =
      document.getElementById(id);

    if (element) {
      return element;
    }
  }

  return null;
}

/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    createSearchBar();

    loadProducts();

    setupCheckout();

    setupCategoryFilters();

    setupFooterYear();
  }
);

/* =========================================================
   SEARCH BAR
========================================================= */

function createSearchBar() {
  if (
    document.getElementById(
      "qkjSearchBar"
    )
  ) {
    return;
  }

  const productsSection =
    getElement(
      "products",
      "productGrid"
    );

  if (!productsSection) {
    return;
  }

  const searchWrapper =
    document.createElement("div");

  searchWrapper.className =
    "search-wrapper";

  searchWrapper.innerHTML = `
    <div class="search-box">
      <span class="search-icon">🔎</span>

      <input
        type="search"
        id="qkjSearchBar"
        class="search-input"
        placeholder="Search products..."
        autocomplete="off"
      />

      <button
        type="button"
        id="clearSearch"
        class="clear-search"
        aria-label="Clear search"
        hidden
      >
        ×
      </button>
    </div>

    <div
      id="searchResultText"
      class="search-result-text"
    ></div>
  `;

  /*
    Put search bar immediately before
    the products container.
  */

  productsSection.parentNode.insertBefore(
    searchWrapper,
    productsSection
  );

  const searchInput =
    document.getElementById(
      "qkjSearchBar"
    );

  const clearButton =
    document.getElementById(
      "clearSearch"
    );

  searchInput.addEventListener(
    "input",
    () => {
      const query =
        searchInput.value
          .trim()
          .toLowerCase();

      clearButton.hidden =
        query.length === 0;

      filterProducts();

      updateSearchText(query);
    }
  );

  clearButton.addEventListener(
    "click",
    () => {
      searchInput.value = "";

      clearButton.hidden = true;

      filterProducts();

      updateSearchText("");

      searchInput.focus();
    }
  );
}

/* =========================================================
   SEARCH + CATEGORY FILTER
========================================================= */

let activeCategory = "all";

function setupCategoryFilters() {
  const buttons =
    document.querySelectorAll(
      "[data-category]"
    );

  buttons.forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        activeCategory =
          String(
            button.dataset.category ||
              "all"
          ).toLowerCase();

        buttons.forEach(
          (item) =>
            item.classList.remove(
              "active"
            )
        );

        button.classList.add(
          "active"
        );

        filterProducts();
      }
    );
  });
}

function filterProducts() {
  const searchInput =
    document.getElementById(
      "qkjSearchBar"
    );

  const query =
    searchInput?.value
      ?.trim()
      .toLowerCase() || "";

  let filtered =
    productsData.filter(
      (product) => {
        const category =
          String(
            product.category || ""
          ).toLowerCase();

        const categoryMatches =
          activeCategory === "all" ||
          category === activeCategory;

        const searchableText =
          [
            product.name,
            product.description,
            product.category,
            product.id
          ]
            .join(" ")
            .toLowerCase();

        const searchMatches =
          !query ||
          searchableText.includes(query);

        return (
          categoryMatches &&
          searchMatches
        );
      }
    );

  renderProducts(filtered);
}

function updateSearchText(query) {
  const resultText =
    document.getElementById(
      "searchResultText"
    );

  if (!resultText) {
    return;
  }

  if (!query) {
    resultText.textContent = "";
    return;
  }

  const count =
    productsData.filter(
      (product) => {
        const searchableText =
          [
            product.name,
            product.description,
            product.category,
            product.id
          ]
            .join(" ")
            .toLowerCase();

        return searchableText.includes(
          query
        );
      }
    ).length;

  resultText.textContent =
    `${count} product${
      count === 1 ? "" : "s"
    } found`;
}

/* =========================================================
   GOOGLE SHEETS
========================================================= */

async function loadProducts() {
  const loading =
    getElement("loading");

  const error =
    getElement("errorMessage");

  const productsContainer =
    getElement("products");

  if (loading) {
    loading.style.display = "block";
  }

  if (error) {
    error.style.display = "none";
  }

  try {
    const url =
      "https://docs.google.com/spreadsheets/d/" +
      SHEET_ID +
      "/gviz/tq" +
      "?sheet=" +
      encodeURIComponent(
        SHEET_NAME
      ) +
      "&tqx=out:json";

    const response =
      await fetch(url);

    if (!response.ok) {
      throw new Error(
        "Unable to load products."
      );
    }

    const text =
      await response.text();

    const start =
      text.indexOf("{");

    const end =
      text.lastIndexOf("}");

    if (
      start === -1 ||
      end === -1
    ) {
      throw new Error(
        "Invalid Google Sheets response."
      );
    }

    const data =
      JSON.parse(
        text.substring(
          start,
          end + 1
        )
      );

    const columns =
      (
        data.table?.cols || []
      ).map(
        (column) =>
          column.label || ""
      );

    const rows =
      data.table?.rows || [];

    productsData =
      rows
        .map((row) => {
          const product = {};

          columns.forEach(
            (column, index) => {
              const key =
                String(column)
                  .trim()
                  .toLowerCase()
                  .replace(
                    /\s+/g,
                    "_"
                  );

              const cell =
                row.c?.[index];

              product[key] =
                cell &&
                cell.v !== null &&
                cell.v !== undefined
                  ? cell.v
                  : "";
            }
          );

          return normalizeProduct(
            product
          );
        })
        .filter(
          (product) =>
            product.id
        );

    filterProducts();
  } catch (err) {
    console.error(
      "Product loading error:",
      err
    );

    if (error) {
      error.textContent =
        "Unable to load products. Please try again.";

      error.style.display = "block";
    }

    if (productsContainer) {
      productsContainer.innerHTML = "";
    }
  } finally {
    if (loading) {
      loading.style.display = "none";
    }
  }
}

/* =========================================================
   PRODUCT NORMALIZATION
========================================================= */

function firstValue(
  object,
  keys
) {
  for (const key of keys) {
    if (
      object[key] !== undefined &&
      object[key] !== null &&
      String(
        object[key]
      ).trim() !== ""
    ) {
      return object[key];
    }
  }

  return "";
}

function normalizeProduct(
  product
) {
  const id =
    firstValue(product, [
      "id",
      "product_id"
    ]);

  const name =
    firstValue(product, [
      "name",
      "title",
      "product_name"
    ]);

  const description =
    firstValue(product, [
      "description",
      "desc",
      "details"
    ]);

  const priceRaw =
    firstValue(product, [
      "price_usd",
      "price",
      "p",
      "usd",
      "amount"
    ]);

  const image =
    firstValue(product, [
      "image",
      "image_url",
      "img",
      "thumbnail",
      "cover"
    ]);

  const download =
    firstValue(product, [
      "download",
      "download_url",
      "file",
      "file_url"
    ]);

  const category =
    firstValue(product, [
      "category",
      "type"
    ]);

  const price =
    Number(
      String(priceRaw)
        .replace(
          /[$,]/g,
          ""
        )
    );

  return {
    id: String(id).trim(),

    name: String(name).trim(),

    description:
      String(
        description
      ).trim(),

    price:
      Number.isFinite(price)
        ? price
        : 0,

    image:
      String(image).trim(),

    download:
      String(download).trim(),

    category:
      String(category).trim()
  };
}

/* =========================================================
   RENDER PRODUCTS
========================================================= */

function renderProducts(
  products
) {
  const container =
    getElement("products");

  if (!container) {
    return;
  }

  if (!products.length) {
    container.innerHTML = `
      <div class="no-products">
        <div class="no-products-icon">
          🔎
        </div>

        <h3>No products found</h3>

        <p>
          Try another search or category.
        </p>
      </div>
    `;

    return;
  }

  container.innerHTML =
    products
      .map(
        (product) =>
          createProductCard(
            product
          )
      )
      .join("");

  container
    .querySelectorAll(
      ".buy-button"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          const productId =
            button.dataset.productId;

          const product =
            productsData.find(
              (item) =>
                item.id ===
                productId
            );

          if (product) {
            openCheckout(product);
          }
        }
      );
    });
}

/* =========================================================
   PRODUCT CARD
========================================================= */

function createProductCard(
  product
) {
  const safeName =
    escapeHtml(
      product.name
    );

  const safeDescription =
    escapeHtml(
      product.description
    );

  const safeCategory =
    escapeHtml(
      product.category
    );

  const image =
    product.image
      ? `
        <img
          class="product-image"
          src="${escapeAttribute(
            product.image
          )}"
          alt="${escapeAttribute(
            product.name
          )}"
          loading="lazy"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        />

        <div
          class="product-image-placeholder"
          style="display:none;"
        >
          No image
        </div>
      `
      : `
        <div class="product-image-placeholder">
          No image
        </div>
      `;

  return `
    <article class="product-card">

      <div class="product-image-wrapper">
        ${image}
      </div>

      <div class="product-content">

        ${
          product.category
            ? `
              <span class="product-category">
                ${safeCategory}
              </span>
            `
            : ""
        }

        <h3 class="product-title">
          ${safeName}
        </h3>

        <p class="product-description">
          ${safeDescription}
        </p>

        <div class="product-bottom">

          <div class="product-price">
            $${Number(
              product.price || 0
            ).toFixed(2)}
          </div>

          <button
            type="button"
            class="buy-button"
            data-product-id="${escapeAttribute(
              product.id
            )}"
          >
            Buy Now
          </button>

        </div>

      </div>

    </article>
  `;
}

/* =========================================================
   CHECKOUT
========================================================= */

function setupCheckout() {
  const cryptoSelect =
    getElement(
      "cryptoSelect",
      "crypto"
    );

  const verifyButton =
    getElement(
      "verifyPayment",
      "verifyButton"
    );

  if (cryptoSelect) {
    cryptoSelect.addEventListener(
      "change",
      () => {
        selectedCurrency =
          cryptoSelect.value;

        updatePaymentDetails();
      }
    );
  }

  if (verifyButton) {
    verifyButton.addEventListener(
      "click",
      verifyPayment
    );
  }

  /*
    Close modal buttons
  */

  document
    .querySelectorAll(
      ".close-modal, .modal-close, [data-close-modal]"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        closeCheckout
      );
    });

  /*
    Close when clicking outside modal
  */

  const modal =
    getElement(
      "checkoutModal",
      "paymentModal"
    );

  if (modal) {
    modal.addEventListener(
      "click",
      (event) => {
        if (
          event.target === modal
        ) {
          closeCheckout();
        }
      }
    );
  }
}

/* =========================================================
   OPEN CHECKOUT
========================================================= */

async function openCheckout(
  product
) {
  selectedProduct = product;

  selectedCurrency =
    "USDT_TRC20";

  const modal =
    getElement(
      "checkoutModal",
      "paymentModal"
    );

  if (!modal) {
    console.error(
      "Checkout modal not found."
    );

    return;
  }

  /*
    Product information
  */

  const productName =
    getElement(
      "checkoutProductName",
      "paymentProductName",
      "modalProductName"
    );

  const productPrice =
    getElement(
      "checkoutProductPrice",
      "paymentProductPrice",
      "modalProductPrice"
    );

  if (productName) {
    productName.textContent =
      product.name;
  }

  if (productPrice) {
    productPrice.textContent =
      `$${Number(
        product.price
      ).toFixed(2)}`;
  }

  /*
    Reset transaction hash
  */

  const hashInput =
    getElement(
      "transactionHash",
      "txHash",
      "transaction_hash"
    );

  if (hashInput) {
    hashInput.value = "";
  }

  /*
    Reset message
  */

  setPaymentMessage(
    "",
    ""
  );

  /*
    Reset crypto select
  */

  const cryptoSelect =
    getElement(
      "cryptoSelect",
      "crypto"
    );

  if (cryptoSelect) {
    cryptoSelect.value =
      "USDT_TRC20";

    selectedCurrency =
      "USDT_TRC20";
  }

  /*
    Show modal
  */

  modal.classList.add(
    "active"
  );

  modal.style.display = "flex";

  await updatePaymentDetails();
}

/* =========================================================
   CLOSE CHECKOUT
========================================================= */

function closeCheckout() {
  const modal =
    getElement(
      "checkoutModal",
      "paymentModal"
    );

  if (!modal) {
    return;
  }

  modal.classList.remove(
    "active"
  );

  modal.style.display = "none";

  selectedProduct = null;
}

/* =========================================================
   UPDATE PAYMENT DETAILS
========================================================= */

async function updatePaymentDetails() {
  if (!selectedProduct) {
    return;
  }

  const currency =
    selectedCurrency;

  const info =
    CRYPTO_INFO[currency];

  /*
    Wallet
  */

  const wallet =
    WALLETS[currency];

  const walletElement =
    getElement(
      "walletAddress",
      "paymentWallet",
      "wallet"
    );

  if (walletElement) {
    walletElement.textContent =
      wallet;
  }

  /*
    Network
  */

  const networkElement =
    getElement(
      "network",
      "paymentNetwork"
    );

  if (networkElement) {
    networkElement.textContent =
      info.network;
  }

  /*
    Currency
  */

  const currencyElement =
    getElement(
      "paymentCurrency",
      "selectedCurrency"
    );

  if (currencyElement) {
    currencyElement.textContent =
      info.symbol;
  }

  /*
    Amount
  */

  const amountElement =
    getElement(
      "paymentAmount",
      "amount",
      "cryptoAmount"
    );

  if (amountElement) {
    amountElement.textContent =
      "Calculating...";
  }

  /*
    Get fresh quote from backend
  */

  try {
    const url =
      API_URL +
      "/api/payment-quote" +
      "?product_id=" +
      encodeURIComponent(
        selectedProduct.id
      ) +
      "&currency=" +
      encodeURIComponent(
        currency
      );

    const response =
      await fetch(url);

    const data =
      await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(
        data.message ||
          "Unable to calculate payment amount."
      );
    }

    /*
      Use wallet returned by server.
      This makes the frontend match
      the backend wallet configuration.
    */

    if (
      data.walletAddress &&
      walletElement
    ) {
      walletElement.textContent =
        data.walletAddress;
    }

    if (amountElement) {
      amountElement.textContent =
        formatCryptoAmount(
          data.cryptoAmount,
          currency
        ) +
        " " +
        info.symbol;
    }

    /*
      USD price
    */

    const usdElement =
      getElement(
        "usdAmount",
        "paymentUsdAmount"
      );

    if (usdElement) {
      usdElement.textContent =
        `$${Number(
          data.usdPrice
        ).toFixed(2)}`;
    }

    /*
      Crypto price
    */

    const rateElement =
      getElement(
        "cryptoRate",
        "paymentCryptoRate"
      );

    if (rateElement) {
      rateElement.textContent =
        `1 ${info.symbol} ≈ $${Number(
          data.cryptoUsdPrice
        ).toFixed(4)}`;
    }
  } catch (error) {
    console.error(
      "Quote error:",
      error
    );

    if (amountElement) {
      amountElement.textContent =
        "Unable to calculate";
    }

    setPaymentMessage(
      error.message ||
        "Payment verification failed.",
      "error"
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
   PAYMENT MESSAGE
========================================================= */

function setPaymentMessage(
  message,
  type
) {
  const element =
    getElement(
      "paymentMessage",
      "verificationMessage",
      "verifyMessage"
    );

  if (!element) {
    return;
  }

  element.textContent =
    message || "";

  element.className =
    "payment-message";

  if (type) {
    element.classList.add(
      type
    );
  }
}

/* =========================================================
   FORMAT CRYPTO
========================================================= */

function formatCryptoAmount(
  amount,
  currency
) {
  const value =
    Number(amount);

  if (
    !Number.isFinite(value)
  ) {
    return "0";
  }

  if (
    currency ===
    "USDT_TRC20"
  ) {
    return value.toFixed(2);
  }

  if (currency === "BTC") {
    return value.toFixed(8);
  }

  if (currency === "ETH") {
    return value.toFixed(6);
  }

  if (currency === "BNB") {
    return value.toFixed(6);
  }

  if (currency === "SOL") {
    return value.toFixed(6);
  }

  if (currency === "DOGE") {
    return value.toFixed(4);
  }

  return value.toFixed(8);
}

/* =========================================================
   FOOTER YEAR
========================================================= */

function setupFooterYear() {
  const year =
    document.getElementById(
      "year"
    );

  if (year) {
    year.textContent =
      new Date().getFullYear();
  }
}

/* =========================================================
   HTML ESCAPING
========================================================= */

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

function escapeAttribute(value) {
  return escapeHtml(value);
}