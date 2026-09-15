/* =========================================================
   QKJ STORE - SCRIPT.JS
   PART 1/4
   CONFIGURATION + WALLET SETTINGS + APP STARTUP
   ========================================================= */


/* =========================================================
   1. CONFIGURATION
   ========================================================= */

const SHEET_ID =
    "1u9uKN8GeX-1VElXVIdXoNNEsG6xppKGa2gI-PEnDDaI";

const SHEET_NAME =
    "Sheet1";

const API_URL =
    "https://qkj-payment-api.onrender.com";


/* =========================================================
   2. CRYPTO WALLET ADDRESSES
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
   3. CRYPTO INFORMATION
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
   4. APPLICATION STATE
   ========================================================= */

let productsData = [];

let selectedProduct = null;

let selectedCurrency =
    "USDT_TRC20";

let activeCategory =
    "all";


/* =========================================================
   5. START APPLICATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "QKJ Store starting..."
        );

        createSearchBar();

        setupCheckout();

        setupBuyButtons();

        setupCategoryFilters();

        setupFooterYear();

        loadProducts();

    }
);


/* =========================================================
   6. BASIC DOM HELPERS
   ========================================================= */

function getElement(id) {

    return document.getElementById(id);

}


function showElement(element) {

    if (!element) {
        return;
    }

    element.style.display = "";

}


function hideElement(element) {

    if (!element) {
        return;
    }

    element.style.display = "none";

}


/* =========================================================
   7. SEARCH BAR
   ========================================================= */

function createSearchBar() {

    const searchInput =
        getElement("qkjSearchBar");

    const clearButton =
        getElement("clearSearch");

    if (!searchInput) {

        console.warn(
            "Search input #qkjSearchBar not found."
        );

        return;

    }


    searchInput.addEventListener(
        "input",
        () => {

            applyProductFilters();

        }
    );


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            () => {

                searchInput.value = "";

                applyProductFilters();

                searchInput.focus();

            }
        );

    }

}


/* =========================================================
   8. APPLY SEARCH + CATEGORY FILTER
   ========================================================= */

function applyProductFilters() {

    const searchInput =
        getElement("qkjSearchBar");

    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    let filteredProducts =
        [...productsData];


    /* -------------------------
       CATEGORY FILTER
       ------------------------- */

    if (
        activeCategory &&
        activeCategory !== "all"
    ) {

        filteredProducts =
            filteredProducts.filter(
                product => {

                    const category =
                        String(
                            product.category || ""
                        )
                        .trim()
                        .toLowerCase();

                    return category ===
                        activeCategory;

                }
            );

    }


    /* -------------------------
       SEARCH FILTER
       ------------------------- */

    if (searchTerm) {

        filteredProducts =
            filteredProducts.filter(
                product => {

                    const searchableText = [

                        product.id,

                        product.name,

                        product.description,

                        product.category

                    ]
                        .join(" ")
                        .toLowerCase();


                    return searchableText
                        .includes(searchTerm);

                }
            );

    }


    renderProducts(
        filteredProducts
    );


    updateSearchResultText(
        filteredProducts.length
    );

}


/* =========================================================
   9. SEARCH RESULT TEXT
   ========================================================= */

function updateSearchResultText(count) {

    const resultText =
        getElement("searchResultText");

    if (!resultText) {
        return;
    }


    if (!productsData.length) {

        resultText.textContent = "";

        return;

    }


    const searchInput =
        getElement("qkjSearchBar");


    const hasSearch =
        searchInput &&
        searchInput.value.trim();


    if (
        hasSearch ||
        activeCategory !== "all"
    ) {

        resultText.textContent =
            `${count} product${count === 1 ? "" : "s"} found`;

    } else {

        resultText.textContent = "";

    }

}


/* =========================================================
   10. LOAD PRODUCTS FROM GOOGLE SHEETS
   ========================================================= */

async function loadProducts() {

    const loading =
        getElement("loading");

    const errorMessage =
        getElement("errorMessage");

    const productsContainer =
        getElement("products");


    if (loading) {

        loading.style.display =
            "block";

    }


    if (errorMessage) {

        errorMessage.style.display =
            "none";

    }


    if (productsContainer) {

        productsContainer.innerHTML = "";

    }


    try {

        const sheetUrl =
            "https://docs.google.com/spreadsheets/d/" +
            SHEET_ID +
            "/gviz/tq?tqx=out:json&sheet=" +
            encodeURIComponent(
                SHEET_NAME
            );


        console.log(
            "Loading products from:",
            sheetUrl
        );


        const response =
            await fetch(
                sheetUrl,
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Google Sheets request failed: ${response.status}`
            );

        }


        const rawText =
            await response.text();


        const match =
            rawText.match(
                /google\.visualization\.Query\.setResponse\(([\s\S]*)\);?\s*$/
            );


        if (!match) {

            console.error(
                "Unexpected Google Sheets response:",
                rawText.substring(0, 500)
            );

            throw new Error(
                "Could not read Google Sheets data."
            );

        }


        const json =
            JSON.parse(
                match[1]
            );


        if (
            !json.table ||
            !json.table.cols ||
            !json.table.rows
        ) {

            throw new Error(
                "Google Sheets returned no table data."
            );

        }


        productsData =
            normalizeSheetProducts(
                json.table
            );


        console.log(
            "Products loaded:",
            productsData
        );


        if (!productsData.length) {

            throw new Error(
                "No valid products found in Sheet1."
            );

        }


        applyProductFilters();


    } catch (error) {

        console.error(
            "Product loading error:",
            error
        );


        if (productsContainer) {

            productsContainer.innerHTML = "";

        }


        if (errorMessage) {

            errorMessage.textContent =
                "Unable to load products right now. Please refresh and try again.";

            errorMessage.style.display =
                "block";

        }

    } finally {

        if (loading) {

            loading.style.display =
                "none";

        }

    }

}/* =========================================================
   QKJ STORE - SCRIPT.JS
   PART 2/4
   GOOGLE SHEETS NORMALIZATION + PRODUCT CARDS + BUY NOW
   ========================================================= */


/* =========================================================
   11. NORMALIZE GOOGLE SHEET PRODUCTS
   ========================================================= */

function normalizeSheetProducts(table) {

    const columns =
        table.cols.map(
            column =>
                normalizeHeader(
                    column.label ||
                    column.id ||
                    ""
                )
        );


    const products = [];


    table.rows.forEach(
        (row, rowIndex) => {

            const values =
                row.c.map(
                    cell =>
                        cell && cell.v !== undefined
                            ? cell.v
                            : ""
                );


            const product = {

                id:
                    getFirstValue(
                        columns,
                        values,
                        [
                            "id",
                            "productid",
                            "product"
                        ]
                    ),

                name:
                    getFirstValue(
                        columns,
                        values,
                        [
                            "name",
                            "title",
                            "productname"
                        ]
                    ),

                description:
                    getFirstValue(
                        columns,
                        values,
                        [
                            "description",
                            "desc",
                            "details"
                        ]
                    ),

                price:
                    getFirstValue(
                        columns,
                        values,
                        [
                            "priceusd",
                            "price",
                            "p",
                            "usd",
                            "amount"
                        ]
                    ),

                image:
                    getFirstValue(
                        columns,
                        values,
                        [
                            "image",
                            "imageurl",
                            "img",
                            "cover",
                            "thumbnail"
                        ]
                    ),

                download:
                    getFirstValue(
                        columns,
                        values,
                        [
                            "download",
                            "downloadurl",
                            "file",
                            "fileurl"
                        ]
                    ),

                category:
                    getFirstValue(
                        columns,
                        values,
                        [
                            "category",
                            "categories",
                            "type"
                        ]
                    )

            };


            /* -------------------------
               CLEAN VALUES
               ------------------------- */

            product.id =
                String(
                    product.id || ""
                ).trim();


            product.name =
                String(
                    product.name || ""
                ).trim();


            product.description =
                String(
                    product.description || ""
                ).trim();


            product.image =
                String(
                    product.image || ""
                ).trim();


            product.download =
                String(
                    product.download || ""
                ).trim();


            product.category =
                String(
                    product.category || "Other"
                ).trim();


            /* -------------------------
               PRICE
               ------------------------- */

            const priceNumber =
                Number(
                    String(
                        product.price || ""
                    )
                    .replace(
                        /[^0-9.-]/g,
                        ""
                    )
                );


            product.price =
                Number.isFinite(
                    priceNumber
                )
                    ? priceNumber
                    : 0;


            /* -------------------------
               VALID PRODUCT
               ------------------------- */

            if (
                product.id &&
                product.name
            ) {

                products.push(
                    product
                );

            } else {

                console.warn(
                    `Skipping invalid product row ${rowIndex + 2}:`,
                    product
                );

            }

        }
    );


    return products;

}


/* =========================================================
   12. NORMALIZE HEADER
   ========================================================= */

function normalizeHeader(value) {

    return String(
        value || ""
    )
        .trim()
        .toLowerCase()
        .replace(
            /[^a-z0-9]/g,
            ""
        );

}


/* =========================================================
   13. GET FIRST MATCHING SHEET VALUE
   ========================================================= */

function getFirstValue(
    columns,
    values,
    possibleNames
) {

    for (
        const name of possibleNames
    ) {

        const normalizedName =
            normalizeHeader(name);


        const index =
            columns.indexOf(
                normalizedName
            );


        if (
            index !== -1 &&
            values[index] !== undefined
        ) {

            return values[index];

        }

    }


    return "";

}


/* =========================================================
   14. RENDER PRODUCTS
   ========================================================= */

function renderProducts(products) {

    const container =
        getElement("products");


    if (!container) {

        console.error(
            "Products container #products not found."
        );

        return;

    }


    container.innerHTML = "";


    if (
        !products ||
        products.length === 0
    ) {

        container.innerHTML = `
            <div class="no-products">
                <h3>No products found</h3>
                <p>
                    Try another search or category.
                </p>
            </div>
        `;

        return;

    }


    products.forEach(
        product => {

            const card =
                createProductCard(
                    product
                );


            container.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   15. CREATE PRODUCT CARD
   ========================================================= */

function createProductCard(product) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "product-card";


    card.innerHTML = `

        <div class="product-image-wrap">

            ${
                product.image
                    ? `
                        <img
                            src="${escapeHTML(product.image)}"
                            alt="${escapeHTML(product.name)}"
                            class="product-image"
                            loading="lazy"
                            onerror="this.style.display='none'"
                        >
                    `
                    : `
                        <div class="product-image-placeholder">
                            QKJ
                        </div>
                    `
            }

        </div>


        <div class="product-card-content">

            <div class="product-category">
                ${escapeHTML(product.category)}
            </div>


            <h3 class="product-title">
                ${escapeHTML(product.name)}
            </h3>


            <p class="product-description">
                ${escapeHTML(product.description)}
            </p>


            <div class="product-bottom">

                <strong class="product-price">
                    ${formatUSD(product.price)}
                </strong>


                <button
                    type="button"
                    class="buy-button"
                    data-product-id="${escapeHTML(product.id)}"
                >
                    Buy Now
                </button>

            </div>

        </div>

    `;


    return card;

}


/* =========================================================
   16. BUY NOW EVENT DELEGATION
   ========================================================= */

function setupBuyButtons() {

    const productsContainer =
        getElement("products");


    if (!productsContainer) {

        console.error(
            "Products container #products not found."
        );

        return;

    }


    /*
       Event delegation means the Buy Now
       buttons continue working even after
       the product list is re-rendered.
    */

    productsContainer.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".buy-button"
                );


            if (!button) {

                return;

            }


            event.preventDefault();


            const productId =
                button.dataset.productId;


            console.log(
                "Buy Now clicked:",
                productId
            );


            const product =
                productsData.find(
                    item =>
                        String(item.id) ===
                        String(productId)
                );


            if (!product) {

                console.error(
                    "Product not found:",
                    productId
                );


                showPaymentMessage(
                    "Product could not be found.",
                    "error"
                );


                return;

            }


            openCheckout(
                product
            );

        }
    );

}


/* =========================================================
   17. CATEGORY FILTERS
   ========================================================= */

function setupCategoryFilters() {

    const buttons =
        document.querySelectorAll(
            ".category-btn"
        );


    if (!buttons.length) {

        console.warn(
            "No category buttons found."
        );

        return;

    }


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    buttons.forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                    button.classList.add(
                        "active"
                    );


                    activeCategory =
                        String(
                            button.dataset.category ||
                            "all"
                        )
                        .trim()
                        .toLowerCase();


                    console.log(
                        "Category selected:",
                        activeCategory
                    );


                    applyProductFilters();

                }
            );

        }
    );

}


/* =========================================================
   18. FORMAT USD PRICE
   ========================================================= */

function formatUSD(amount) {

    const number =
        Number(amount);


    if (
        !Number.isFinite(number)
    ) {

        return "$0.00";

    }


    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(number);

}


/* =========================================================
   19. ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
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


/* =========================================================
   END OF PART 2
   ========================================================= *//* =========================================================
   QKJ STORE - SCRIPT.JS
   PART 3/4
   CHECKOUT MODAL + CRYPTO SELECTION + WALLET
   ========================================================= */


/* =========================================================
   20. CHECKOUT SETUP
   ========================================================= */

function setupCheckout() {

    const modal =
        getElement("checkoutModal");

    if (!modal) {

        console.error(
            "Checkout modal #checkoutModal not found."
        );

        return;

    }


    /* -----------------------------------------
       CLOSE BUTTON
       ----------------------------------------- */

    const closeButton =
        modal.querySelector(
            ".close-modal"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeCheckout
        );

    }


    /* -----------------------------------------
       CLICK OUTSIDE MODAL
       ----------------------------------------- */

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeCheckout();

            }

        }
    );


    /* -----------------------------------------
       ESCAPE KEY
       ----------------------------------------- */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                modal.style.display !== "none"
            ) {

                closeCheckout();

            }

        }
    );


    /* -----------------------------------------
       CRYPTO SELECT
       ----------------------------------------- */

    const cryptoSelect =
        getElement("cryptoSelect");


    if (cryptoSelect) {

        cryptoSelect.addEventListener(
            "change",
            () => {

                selectedCurrency =
                    cryptoSelect.value;

                updateCheckoutCrypto();

            }
        );

    }


    /* -----------------------------------------
       COPY WALLET
       ----------------------------------------- */

    const copyButton =
        getElement("copyWallet");


    if (copyButton) {

        copyButton.addEventListener(
            "click",
            copyWalletAddress
        );

    }


    /* -----------------------------------------
       VERIFY PAYMENT
       ----------------------------------------- */

    const verifyButton =
        getElement("verifyPayment");


    if (verifyButton) {

        verifyButton.addEventListener(
            "click",
            verifyPayment
        );

    }

}


/* =========================================================
   21. OPEN CHECKOUT
   ========================================================= */

function openCheckout(product) {

    if (!product) {

        console.error(
            "openCheckout() received no product."
        );

        return;

    }


    selectedProduct =
        product;


    selectedCurrency =
        "USDT_TRC20";


    /* -----------------------------------------
       PRODUCT NAME
       ----------------------------------------- */

    const productName =
        getElement(
            "checkoutProductName"
        );


    if (productName) {

        productName.textContent =
            product.name;

    }


    /* -----------------------------------------
       PRODUCT PRICE
       ----------------------------------------- */

    const productPrice =
        getElement(
            "checkoutProductPrice"
        );


    if (productPrice) {

        productPrice.textContent =
            formatUSD(
                product.price
            );

    }


    /* -----------------------------------------
       USD AMOUNT
       ----------------------------------------- */

    const usdAmount =
        getElement(
            "usdAmount"
        );


    if (usdAmount) {

        usdAmount.textContent =
            formatUSD(
                product.price
            );

    }


    /* -----------------------------------------
       RESET TRANSACTION HASH
       ----------------------------------------- */

    const transactionHash =
        getElement(
            "transactionHash"
        );


    if (transactionHash) {

        transactionHash.value = "";

    }


    /* -----------------------------------------
       RESET PAYMENT MESSAGE
       ----------------------------------------- */

    const paymentMessage =
        getElement(
            "paymentMessage"
        );


    if (paymentMessage) {

        paymentMessage.textContent = "";

        paymentMessage.className =
            "payment-message";

    }


    /* -----------------------------------------
       RESET CRYPTO SELECT
       ----------------------------------------- */

    const cryptoSelect =
        getElement(
            "cryptoSelect"
        );


    if (cryptoSelect) {

        cryptoSelect.value =
            selectedCurrency;

    }


    /* -----------------------------------------
       UPDATE WALLET
       ----------------------------------------- */

    updateCheckoutCrypto();


    /* -----------------------------------------
       SHOW MODAL
       ----------------------------------------- */

    const modal =
        getElement(
            "checkoutModal"
        );


    if (modal) {

        modal.style.display =
            "flex";

        document.body.classList.add(
            "modal-open"
        );

    }


    console.log(
        "Checkout opened:",
        product
    );

}


/* =========================================================
   22. CLOSE CHECKOUT
   ========================================================= */

function closeCheckout() {

    const modal =
        getElement(
            "checkoutModal"
        );


    if (!modal) {

        return;

    }


    modal.style.display =
        "none";


    document.body.classList.remove(
        "modal-open"
    );


    selectedProduct =
        null;


    console.log(
        "Checkout closed."
    );

}


/* =========================================================
   23. UPDATE CHECKOUT CRYPTO
   ========================================================= */

function updateCheckoutCrypto() {

    if (!selectedProduct) {

        return;

    }


    const crypto =
        CRYPTO_INFO[
            selectedCurrency
        ];


    if (!crypto) {

        console.error(
            "Unknown cryptocurrency:",
            selectedCurrency
        );

        return;

    }


    /* -----------------------------------------
       WALLET ADDRESS
       ----------------------------------------- */

    const walletAddress =
        getElement(
            "walletAddress"
        );


    if (walletAddress) {

        walletAddress.value =
            WALLETS[
                selectedCurrency
            ] || "";

    }


    /* -----------------------------------------
       NETWORK
       ----------------------------------------- */

    const network =
        getElement(
            "network"
        );


    if (network) {

        network.textContent =
            crypto.network;

    }


    /* -----------------------------------------
       USD AMOUNT
       ----------------------------------------- */

    const usdAmount =
        getElement(
            "usdAmount"
        );


    if (usdAmount) {

        usdAmount.textContent =
            formatUSD(
                selectedProduct.price
            );

    }


    /* -----------------------------------------
       CLEAR OLD PAYMENT MESSAGE
       ----------------------------------------- */

    const paymentMessage =
        getElement(
            "paymentMessage"
        );


    if (paymentMessage) {

        paymentMessage.textContent = "";

        paymentMessage.className =
            "payment-message";

    }


    console.log(
        "Checkout crypto updated:",
        crypto
    );

}


/* =========================================================
   24. COPY WALLET ADDRESS
   ========================================================= */

async function copyWalletAddress() {

    const walletAddress =
        getElement(
            "walletAddress"
        );


    const copyButton =
        getElement(
            "copyWallet"
        );


    if (
        !walletAddress ||
        !walletAddress.value
    ) {

        showPaymentMessage(
            "Wallet address is unavailable.",
            "error"
        );

        return;

    }


    const address =
        walletAddress.value;


    try {

        await navigator.clipboard.writeText(
            address
        );


        if (copyButton) {

            const originalText =
                copyButton.textContent;


            copyButton.textContent =
                "Copied!";


            setTimeout(
                () => {

                    copyButton.textContent =
                        originalText;

                },
                1500
            );

        }


        console.log(
            "Wallet address copied."
        );


    } catch (error) {

        console.error(
            "Clipboard error:",
            error
        );


        /* -------------------------------------
           FALLBACK FOR OLDER BROWSERS
           ------------------------------------- */

        walletAddress.select();

        walletAddress.setSelectionRange(
            0,
            walletAddress.value.length
        );


        try {

            document.execCommand(
                "copy"
            );


            if (copyButton) {

                const originalText =
                    copyButton.textContent;


                copyButton.textContent =
                    "Copied!";


                setTimeout(
                    () => {

                        copyButton.textContent =
                            originalText;

                    },
                    1500
                );

            }

        } catch (fallbackError) {

            showPaymentMessage(
                "Could not copy automatically. Please copy the address manually.",
                "error"
            );

        }

    }

}


/* =========================================================
   25. SHOW PAYMENT MESSAGE
   ========================================================= */

function showPaymentMessage(
    message,
    type = "info"
) {

    const element =
        getElement(
            "paymentMessage"
        );


    if (!element) {

        console.log(
            message
        );

        return;

    }


    element.textContent =
        message;


    element.className =
        "payment-message";


    if (type) {

        element.classList.add(
            type
        );

    }

}


/* =========================================================
   26. PAYMENT INSTRUCTIONS
   ========================================================= */

function getPaymentInstructions() {

    const crypto =
        CRYPTO_INFO[
            selectedCurrency
        ];


    if (!crypto) {

        return "";

    }


    return `
        Send the exact payment amount to the
        ${crypto.name} wallet shown above.

        Make sure you use the correct
        ${crypto.network} network.

        After sending the payment, wait for the
        transaction to be recorded on the blockchain.

        Then enter the transaction hash or transaction ID
        below.

        QKJ Store will verify the transaction against
        blockchain data before releasing the product.
    `;

}


/* =========================================================
   27. VALIDATE TRANSACTION HASH INPUT
   ========================================================= */

function validateTransactionHash(
    hash
) {

    if (!hash) {

        return {
            valid: false,
            message:
                "Please enter your transaction hash or transaction ID."
        };

    }


    const cleanedHash =
        hash.trim();


    if (
        cleanedHash.length < 10
    ) {

        return {
            valid: false,
            message:
                "The transaction hash appears to be too short."
        };

    }


    /*
       We intentionally do NOT try to decide
       whether a transaction is genuine here.

       The backend must verify the transaction
       against the appropriate blockchain.
    */


    return {
        valid: true,
        hash: cleanedHash
    };

}


/* =========================================================
   28. GET VERIFY BUTTON
   ========================================================= */

function getVerifyButton() {

    return getElement(
        "verifyPayment"
    );

}


/* =========================================================
   29. SET VERIFY BUTTON STATE
   ========================================================= */

function setVerifyButtonState(
    loading
) {

    const button =
        getVerifyButton();


    if (!button) {

        return;

    }


    if (loading) {

        button.disabled =
            true;

        button.dataset.originalText =
            button.textContent;

        button.textContent =
            "Verifying payment...";

    } else {

        button.disabled =
            false;

        button.textContent =
            button.dataset.originalText ||
            "Verify Payment";

    }

}


/* =========================================================
   30. PREPARE PAYMENT VERIFICATION
   ========================================================= */

function preparePaymentVerification() {

    if (!selectedProduct) {

        return {
            valid: false,
            message:
                "No product is currently selected."
        };

    }


    const transactionInput =
        getElement(
            "transactionHash"
        );


    if (!transactionInput) {

        return {
            valid: false,
            message:
                "Transaction input field was not found."
        };

    }


    const validation =
        validateTransactionHash(
            transactionInput.value
        );


    if (!validation.valid) {

        return validation;

    }


    if (
        !WALLETS[
            selectedCurrency
        ]
    ) {

        return {
            valid: false,
            message:
                "The selected cryptocurrency is not configured."
        };

    }


    return {
        valid: true,
        transactionHash:
            validation.hash
    };

}


/* =========================================================
   END OF PART 3
   ========================================================= *//* =========================================================
   QKJ STORE - SCRIPT.JS
   PART 4/4
   PAYMENT VERIFICATION + SUCCESS/ERROR + FOOTER
   ========================================================= */


/* =========================================================
   31. VERIFY PAYMENT
   ========================================================= */

async function verifyPayment() {

    console.log(
        "Starting payment verification..."
    );


    /* -----------------------------------------
       CHECK PRODUCT
       ----------------------------------------- */

    if (!selectedProduct) {

        showPaymentMessage(
            "Please select a product first.",
            "error"
        );

        return;

    }


    /* -----------------------------------------
       VALIDATE INPUT
       ----------------------------------------- */

    const paymentData =
        preparePaymentVerification();


    if (!paymentData.valid) {

        showPaymentMessage(
            paymentData.message,
            "error"
        );

        return;

    }


    /* -----------------------------------------
       DISABLE BUTTON
       ----------------------------------------- */

    setVerifyButtonState(
        true
    );


    showPaymentMessage(
        "Checking the transaction on the blockchain. Please wait...",
        "info"
    );


    try {

        /* -------------------------------------
           CHECK API URL
           ------------------------------------- */

        if (!API_URL) {

            throw new Error(
                "Payment API is not configured."
            );

        }


        /* -------------------------------------
           SEND VERIFICATION REQUEST
           ------------------------------------- */

        const response =
            await fetch(
                `${API_URL}/api/verify-payment`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        product_id:
                            selectedProduct.id,

                        currency:
                            selectedCurrency,

                        transaction_hash:
                            paymentData.transactionHash

                    })

                }
            );


        /* -------------------------------------
           READ RESPONSE
           ------------------------------------- */

        let data = null;


        try {

            data =
                await response.json();

        } catch (jsonError) {

            console.error(
                "Invalid API JSON response:",
                jsonError
            );

            throw new Error(
                "The payment server returned an invalid response."
            );

        }


        console.log(
            "Payment verification response:",
            data
        );


        /* -------------------------------------
           SERVER ERROR
           ------------------------------------- */

        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                `Payment server error (${response.status}).`
            );

        }


        /* -------------------------------------
           PAYMENT VERIFIED
           ------------------------------------- */

        if (
            data.verified === true
        ) {

            showPaymentMessage(
                "Payment verified successfully! Preparing your download...",
                "success"
            );


            /*
               Give the user a short moment to see
               the successful verification message.
            */

            setTimeout(
                () => {

                    const downloadUrl =
                        data.download_url ||
                        data.downloadUrl;


                    if (downloadUrl) {

                        /*
                           Open the verified download.
                        */

                        window.location.href =
                            downloadUrl;

                    } else {

                        showPaymentMessage(
                            "Payment verified, but the download link is unavailable. Please contact QKJ Store.",
                            "error"
                        );


                        setVerifyButtonState(
                            false
                        );

                    }

                },
                800
            );


            return;

        }


        /* -------------------------------------
           PAYMENT NOT VERIFIED
           ------------------------------------- */

        showPaymentMessage(
            data.message ||
            data.error ||
            "Payment could not be verified. Make sure the transaction hash, cryptocurrency, network, and amount are correct.",
            "error"
        );


    } catch (error) {

        console.error(
            "Payment verification error:",
            error
        );


        showPaymentMessage(
            error.message ||
            "Unable to verify payment right now. Please try again.",
            "error"
        );

    } finally {

        /*
           If verification succeeded, the page
           may redirect before this matters.
        */

        setVerifyButtonState(
            false
        );

    }

}


/* =========================================================
   32. FOOTER YEAR
   ========================================================= */

function setupFooterYear() {

    const footerYear =
        getElement(
            "footerYear"
        );


    if (!footerYear) {

        return;

    }


    footerYear.textContent =
        new Date()
            .getFullYear();

}


/* =========================================================
   33. HANDLE NETWORK ERRORS
   ========================================================= */

function getNetworkErrorMessage(
    error
) {

    if (
        !error
    ) {

        return "An unknown error occurred.";

    }


    if (
        error instanceof TypeError
    ) {

        return (
            "Could not connect to the payment server. " +
            "Please check your internet connection and try again."
        );

    }


    return (
        error.message ||
        "Something went wrong. Please try again."
    );

}


/* =========================================================
   34. DEBUG INFORMATION
   ========================================================= */

function getQKJDebugInfo() {

    return {

        apiUrl:
            API_URL,

        sheetId:
            SHEET_ID,

        sheetName:
            SHEET_NAME,

        productCount:
            productsData.length,

        selectedProduct:
            selectedProduct
                ? selectedProduct.id
                : null,

        selectedCurrency:
            selectedCurrency,

        activeCategory:
            activeCategory

    };

}


/* =========================================================
   35. CONSOLE STARTUP MESSAGE
   ========================================================= */

console.log(
    "%cQKJ Store",
    "font-size:20px;font-weight:bold;"
);

console.log(
    "Digital store frontend loaded."
);

console.log(
    "API:",
    API_URL
);


/* =========================================================
   36. OPTIONAL DEBUG COMMAND
   ========================================================= */

/*
   You can type this in the browser console:

       getQKJDebugInfo()

   to see the current application state.
*/


/* =========================================================
   END OF SCRIPT.JS
   ========================================================= */