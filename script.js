/* =========================================
   QKJ STORE
   MAIN JAVASCRIPT
========================================= */


/* =========================================
   GOOGLE SHEETS
========================================= */

const SHEET_ID =
  "1u9uKN8GeX-1VElXVIdXoNNEsG6xppKGa2gI-PEnDDaI";

const SHEET_NAME =
  "Sheet1";


/* =========================================
   WALLET ADDRESSES
========================================= */

const wallets = {

  USDT: {
    name: "USDT",
    network: "Tron (TRC20)",
    address:
      "TF29vt78UY8XHx5bk19W3u1b33JcZbUcaE"
  },

  BTC: {
    name: "Bitcoin",
    network: "Bitcoin",
    address:
      "bc1qdr3k3p09kjey0cdlijhrkeqjvx2ane6ujzz6xy"
  },

  ETH: {
    name: "Ethereum",
    network: "Ethereum",
    address:
      "0x00c07014Ef8a60eC2E95ee559b58590dd18F89A7"
  },

  BNB: {
    name: "BNB",
    network: "BNB Smart Chain",
    address:
      "0x00c07014Ef8a60eC2E95ee559b58590dd18F89A7"
  },

  SOL: {
    name: "Solana",
    network: "Solana",
    address:
      "3wSMFEkjRyD7eWu9sTrtiKrBcRPDsNBCu9X4xm4tenbf"
  },

  DOGE: {
    name: "Dogecoin",
    network: "Dogecoin",
    address:
      "DTPkSQ9omnxgh7kFL8jUnc6KVR7JqsBWqf"
  }

};


/* =========================================
   GLOBAL VARIABLES
========================================= */

let products = [];

let selectedProduct = null;

let selectedCurrency = "USDT";

let currentCategory = "all";


/* =========================================
   PAGE LOAD
========================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    const year =
      document.getElementById("year");

    if (year) {
      year.textContent =
        new Date().getFullYear();
    }

    loadProducts();

  }
);


/* =========================================
   LOAD PRODUCTS
========================================= */

async function loadProducts() {

  const loading =
    document.getElementById("loading");

  const container =
    document.getElementById(
      "productContainer"
    );

  const error =
    document.getElementById(
      "errorMessage"
    );


  if (loading) {
    loading.style.display = "block";
    loading.textContent =
      "Loading products...";
  }

  if (error) {
    error.style.display = "none";
    error.textContent = "";
  }

  if (container) {
    container.innerHTML = "";
  }


  try {

    /*
      Google Sheets Visualization API

      This reads the public Sheet directly.
    */

    const url =
      "https://docs.google.com/spreadsheets/d/" +
      SHEET_ID +
      "/gviz/tq?tqx=out:json&sheet=" +
      encodeURIComponent(SHEET_NAME);


    const response =
      await fetch(url);


    if (!response.ok) {
      throw new Error(
        "Google Sheets returned HTTP " +
        response.status
      );
    }


    const text =
      await response.text();


    /*
      Google returns JSON wrapped inside:

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
        "Could not read Google Sheet data."
      );

    }


    const json =
      JSON.parse(
        text.substring(
          start,
          end + 1
        )
      );


    const table =
      json.table;


    if (
      !table ||
      !table.cols ||
      !table.rows
    ) {

      throw new Error(
        "The Google Sheet contains no readable data."
      );

    }


    /*
      Get column names.
    */

    const headers =
      table.cols.map(
        function (column) {

          return String(
            column.label || ""
          )
            .trim()
            .toLowerCase();

        }
      );


    console.log(
      "Google Sheet headers:",
      headers
    );


    /*
      Convert rows into products.
    */

    products =
      table.rows
        .map(
          function (row) {

            const product = {};


            headers.forEach(
              function (header, index) {

                const cell =
                  row.c &&
                  row.c[index];


                product[header] =
                  cell &&
                  cell.v !== null &&
                  cell.v !== undefined
                    ? String(cell.v)
                    : "";

              }
            );


            return normalizeProduct(
              product
            );

          }
        )
        .filter(
          function (product) {

            return (
              product.id &&
              product.name
            );

          }
        );


    console.log(
      "Products loaded:",
      products
    );


    if (loading) {
      loading.style.display = "none";
    }


    if (products.length === 0) {

      if (error) {

        error.textContent =
          "No products were found. Check your Google Sheet headers and make sure the sheet is public.";

        error.style.display =
          "block";

      }

      return;
    }


    renderProducts();


  } catch (err) {

    console.error(
      "Product loading error:",
      err
    );


    if (loading) {
      loading.style.display =
        "none";
    }


    if (error) {

      error.textContent =
        "Could not load products. Make sure your Google Sheet is shared as 'Anyone with the link → Viewer'.";

      error.style.display =
        "block";

    }

  }

}


/* =========================================
   NORMALIZE PRODUCT
========================================= */

function normalizeProduct(product) {

  /*
    Your sheet may call the price column:

    price_usd
    price
    p
    usd
    product_price

    This function accepts all of them.
  */

  const price =
    firstValue(
      product.price_usd,
      product.price,
      product.p,
      product.usd,
      product.product_price,
      product.amount
    );


  const image =
    firstValue(
      product.image,
      product.image_url,
      product.photo,
      product.thumbnail
    );


  const download =
    firstValue(
      product.download,
      product.download_url,
      product.file,
      product.file_url
    );


  const category =
    firstValue(
      product.category,
      product.categories,
      "other"
    );


  return {

    id:
      String(
        product.id || ""
      ).trim(),

    name:
      String(
        product.name || ""
      ).trim(),

    description:
      String(
        product.description || ""
      ).trim(),

    price_usd:
      parseFloat(price) || 0,

    image:
      String(
        image || ""
      ).trim(),

    download:
      String(
        download || ""
      ).trim(),

    category:
      String(
        category || "other"
      )
        .trim()
        .toLowerCase()

  };

}


/* =========================================
   FIRST AVAILABLE VALUE
========================================= */

function firstValue() {

  const values =
    Array.from(arguments);


  for (
    let i = 0;
    i < values.length;
    i++
  ) {

    if (
      values[i] !== undefined &&
      values[i] !== null &&
      String(values[i]).trim() !== ""
    ) {

      return values[i];

    }

  }


  return "";

}


/* =========================================
   RENDER PRODUCTS
========================================= */

function renderProducts() {

  const container =
    document.getElementById(
      "productContainer"
    );


  if (!container) {
    return;
  }


  container.innerHTML = "";


  let filteredProducts =
    products;


  if (
    currentCategory !== "all"
  ) {

    filteredProducts =
      products.filter(
        function (product) {

          return (
            product.category ===
            currentCategory
          );

        }
      );

  }


  if (
    filteredProducts.length === 0
  ) {

    container.innerHTML =
      `
        <div class="loading">
          No products found in this category.
        </div>
      `;

    return;
  }


  filteredProducts.forEach(
    function (product) {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "product-card";


      const safeName =
        escapeHTML(
          product.name
        );


      const safeDescription =
        escapeHTML(
          product.description
        );


      const safeCategory =
        escapeHTML(
          product.category
        );


      let imageHTML = "";


      if (product.image) {

        imageHTML =
          `
            <img
              class="product-image"
              src="${escapeAttribute(product.image)}"
              alt="${escapeAttribute(product.name)}"
              onerror="this.style.display='none'"
            >
          `;

      } else {

        imageHTML =
          `
            <div class="product-placeholder">
              📦
            </div>
          `;

      }


      card.innerHTML =
        `
          ${imageHTML}

          <div class="product-info">

            <h3>
              ${safeName}
            </h3>

            <div class="product-category">
              ${safeCategory}
            </div>

            <p class="product-description">
              ${safeDescription}
            </p>

            <div class="product-bottom">

              <div class="product-price">
                $${product.price_usd.toFixed(2)}
              </div>

              <button
                class="buy-button"
                data-product-id="${escapeAttribute(product.id)}">

                Buy Now

              </button>

            </div>

          </div>
        `;


      const button =
        card.querySelector(
          ".buy-button"
        );


      button.addEventListener(
        "click",
        function () {

          openCheckout(
            product.id
          );

        }
      );


      container.appendChild(
        card
      );

    }
  );

}


/* =========================================
   FILTER PRODUCTS
========================================= */

function filterProducts(category) {

  currentCategory =
    category
      .toLowerCase();


  document
    .querySelectorAll(
      ".category-button"
    )
    .forEach(
      function (button) {

        button.classList.remove(
          "active"
        );

      }
    );


  const buttons =
    document.querySelectorAll(
      ".category-button"
    );


  buttons.forEach(
    function (button) {

      const text =
        button.textContent
          .trim()
          .toLowerCase();


      if (
        text === category ||
        (
          category === "all" &&
          text === "all"
        )
      ) {

        button.classList.add(
          "active"
        );

      }

    }
  );


  renderProducts();

}


/* =========================================
   OPEN CHECKOUT
========================================= */

function openCheckout(productId) {

  const product =
    products.find(
      function (item) {

        return item.id ===
          productId;

      }
    );


  if (!product) {

    alert(
      "Product could not be found."
    );

    return;

  }


  selectedProduct =
    product;


  const name =
    document.getElementById(
      "checkoutProductName"
    );

  const description =
    document.getElementById(
      "checkoutProductDescription"
    );

  const price =
    document.getElementById(
      "checkoutProductPrice"
    );


  if (name) {
    name.textContent =
      product.name;
  }


  if (description) {
    description.textContent =
      product.description;
  }


  if (price) {

    price.textContent =
      `$${product.price_usd.toFixed(2)} USD`;

  }


  document
    .getElementById(
      "paymentModal"
    )
    .classList.add(
      "show"
    );


  updatePayment();

}


/* =========================================
   CLOSE CHECKOUT
========================================= */

function closeCheckout() {

  const modal =
    document.getElementById(
      "paymentModal"
    );


  if (modal) {

    modal.classList.remove(
      "show"
    );

  }

}


/* =========================================
   SELECT CURRENCY
========================================= */

function selectCurrency(currency) {

  selectedCurrency =
    currency;


  updatePayment();

}


/* =========================================
   UPDATE PAYMENT
========================================= */

function updatePayment() {

  if (!selectedProduct) {
    return;
  }


  const wallet =
    wallets[
      selectedCurrency
    ];


  if (!wallet) {
    return;
  }


  const network =
    document.getElementById(
      "paymentNetwork"
    );


  const address =
    document.getElementById(
      "walletAddress"
    );


  if (network) {

    network.textContent =
      wallet.network;

  }


  if (address) {

    address.value =
      wallet.address;

  }


  const amount =
    document.getElementById(
      "paymentAmount"
    );


  if (amount) {

    amount.textContent =
      `$${selectedProduct.price_usd.toFixed(2)} USD`;

  }

}


/* =========================================
   COPY WALLET
========================================= */

async function copyWallet() {

  const address =
    document.getElementById(
      "walletAddress"
    );


  if (!address) {
    return;
  }


  try {

    await navigator.clipboard.writeText(
      address.value
    );


    alert(
      "Wallet address copied!"
    );


  } catch (error) {

    address.select();

    document.execCommand(
      "copy"
    );


    alert(
      "Wallet address copied!"
    );

  }

}


/* =========================================
   SUBMIT PAYMENT
========================================= */

function submitPayment() {

  if (!selectedProduct) {

    alert(
      "No product selected."
    );

    return;

  }


  const txInput =
    document.getElementById(
      "txHash"
    );


  const txHash =
    txInput
      ? txInput.value.trim()
      : "";


  if (!txHash) {

    alert(
      "Please enter your transaction hash."
    );

    return;

  }


  const paymentData = {

    product_id:
      selectedProduct.id,

    product_name:
      selectedProduct.name,

    price_usd:
      selectedProduct.price_usd,

    currency:
      selectedCurrency,

    wallet:
      wallets[
        selectedCurrency
      ].address,

    transaction_hash:
      txHash

  };


  console.log(
    "Payment submitted:",
    paymentData
  );


  /*
    At this stage this is only a
    frontend submission.

    It does NOT automatically verify
    the blockchain transaction.
  */


  alert(
    "Payment information submitted. Your transaction will need to be verified."
  );


  closeCheckout();

}


/* =========================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
========================================= */

window.addEventListener(
  "click",
  function (event) {

    const modal =
      document.getElementById(
        "paymentModal"
      );


    if (
      event.target === modal
    ) {

      closeCheckout();

    }

  }
);


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHTML(value) {

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


/* =========================================
   ESCAPE ATTRIBUTE
========================================= */

function escapeAttribute(value) {

  return escapeHTML(value);

}