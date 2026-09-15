/* =========================================================
   QKJ STORE
   script.js
   ========================================================= */


/* =========================================================
   1. CONFIGURATION
   ========================================================= */

const SHEET_ID =
    "1u9uKN8GeX-1VElXVIdXoNNEsG6xppKGa2gI-PEnDDaI";

const SHEET_NAME = "Sheet1";

const API_URL =
    "https://qkj-payment-api.onrender.com";


/* =========================================================
   2. CRYPTO WALLETS
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
        network: "TRON — TRC20"
    },

    BTC: {
        name: "Bitcoin",
        network: "Bitcoin"
    },

    ETH: {
        name: "Ethereum",
        network: "Ethereum"
    },

    BNB: {
        name: "BNB",
        network: "BNB Smart Chain"
    },

    SOL: {
        name: "Solana",
        network: "Solana"
    },

    DOGE: {
        name: "Dogecoin",
        network: "Dogecoin"
    }

};


/* =========================================================
   4. APPLICATION STATE
   ========================================================= */

let productsData = [];

let selectedProduct = null;

let selectedCurrency = "USDT_TRC20";

let activeCategory = "all";


/* =========================================================
   5. DOM READY
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    createSearchBar();

    loadProducts();

    setupCheckout();

    setupCategoryFilters();

    setupFooterYear();

});/* =========================================================
   6. SEARCH BAR
   ========================================================= */

function createSearchBar() {

    const searchInput =
        document.getElementById("qkjSearchBar");

    const clearButton =
        document.getElementById("clearSearch");

    if (!searchInput) {
        return;
    }


    searchInput.addEventListener("input", () => {

        const query =
            searchInput.value.trim().toLowerCase();

        if (clearButton) {

            clearButton.hidden =
                query.length === 0;

        }

        filterProducts();

        updateSearchText(query);

    });


    if (clearButton) {

        clearButton.addEventListener("click", () => {

            searchInput.value = "";

            clearButton.hidden = true;

            filterProducts();

            updateSearchText("");

            searchInput.focus();

        });

    }

}


/* =========================================================
   7. SEARCH RESULT TEXT
   ========================================================= */

function updateSearchText(query) {

    const resultText =
        document.getElementById("searchResultText");

    if (!resultText) {
        return;
    }


    if (!query) {

        resultText.textContent = "";

        return;

    }


    const searchResults =
        getFilteredProducts(query);

    resultText.textContent =
        `${searchResults.length} product${
            searchResults.length === 1 ? "" : "s"
        } found`;

}


/* =========================================================
   8. FILTER PRODUCTS
   ========================================================= */

function filterProducts() {

    const searchInput =
        document.getElementById("qkjSearchBar");

    const query =
        searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

    const filteredProducts =
        getFilteredProducts(query);

    renderProducts(filteredProducts);

}


/* =========================================================
   9. GET FILTERED PRODUCTS
   ========================================================= */

function getFilteredProducts(query = "") {

    const normalizedQuery =
        query.trim().toLowerCase();


    return productsData.filter(product => {

        const category =
            String(product.category || "")
                .trim()
                .toLowerCase();


        const matchesCategory =
            activeCategory === "all" ||
            category === activeCategory;


        if (!matchesCategory) {
            return false;
        }


        if (!normalizedQuery) {
            return true;
        }


        const searchableText = [

            product.id,

            product.name,

            product.description,

            product.category

        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


        return searchableText.includes(normalizedQuery);

    });

/* =========================================================
   LOAD PRODUCTS FROM GOOGLE SHEETS
   ========================================================= */

async function loadProducts() {

    const loading =
        document.getElementById("loading");

    const errorMessage =
        document.getElementById("errorMessage");

    const productsContainer =
        document.getElementById("products");


    if (loading) {
        loading.hidden = false;
    }

    if (errorMessage) {
        errorMessage.hidden = true;
    }


    try {

        const sheetURL =
            `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;


        console.log(
            "Loading products from:",
            sheetURL
        );


        const response =
            await fetch(sheetURL);


        if (!response.ok) {

            throw new Error(
                `Google Sheets request failed: ${response.status}`
            );

        }


        const text =
            await response.text();


        console.log(
            "Google Sheets response received."
        );


        /*
         * Google Visualization returns:
         *
         * google.visualization.Query.setResponse({...});
         *
         * Remove the wrapper so JSON.parse() can read it.
         */

        const jsonText =
            text
                .replace(
                    /^\s*google\.visualization\.Query\.setResponse\(/,
                    ""
                )
                .replace(
                    /\);\s*$/,
                    ""
                );


        const data =
            JSON.parse(jsonText);


        if (
            !data ||
            !data.table
        ) {

            throw new Error(
                "Google Sheets returned no table data."
            );

        }


        productsData =
            normalizeSheetProducts(
                data.table
            );


        console.log(
            "Products loaded:",
            productsData
        );


        if (loading) {
            loading.hidden = true;
        }


        if (
            !productsData ||
            productsData.length === 0
        ) {

            if (productsContainer) {

                productsContainer.innerHTML = `

                    <div class="no-products">

                        <h3>
                            No products found
                        </h3>

                        <p>
                            Your Google Sheet is connected,
                            but no valid products were found.
                        </p>

                    </div>

                `;

            }

            return;

        }


        filterProducts();


    } catch (error) {

        console.error(
            "PRODUCT LOADING ERROR:",
            error
        );


        if (loading) {
            loading.hidden = true;
        }


        if (errorMessage) {

            errorMessage.hidden = false;

            errorMessage.innerHTML = `

                <strong>
                    Unable to load products.
                </strong>

                <p>
                    ${escapeHTML(error.message)}
                </p>

            `;

        }

    }

}



/* =========================================================
   11. NORMALIZE GOOGLE SHEET PRODUCTS
   ========================================================= */

function normalizeSheetProducts(table) {

    if (!table.cols || !table.rows) {
        return [];
    }


    const headers =
        table.cols.map((column, index) => {

            const label =
                column.label ||
                column.id ||
                `column_${index}`;

            return normalizeHeader(label);

        });


    return table.rows
        .map(row => {

            const values =
                row.c || [];


            const product = {};


            headers.forEach((header, index) => {

                const cell =
                    values[index];


                product[header] =
                    cell && cell.v !== undefined
                        ? cell.v
                        : "";

            });


            return {

                id:
                    getFirstValue(
                        product,
                        [
                            "id",
                            "product_id",
                            "sku"
                        ]
                    ),

                name:
                    getFirstValue(
                        product,
                        [
                            "name",
                            "product_name",
                            "title"
                        ]
                    ),

                description:
                    getFirstValue(
                        product,
                        [
                            "description",
                            "desc",
                            "details"
                        ]
                    ),

                price:
                    parseFloat(
                        getFirstValue(
                            product,
                            [
                                "price_usd",
                                "price",
                                "p",
                                "usd",
                                "amount"
                            ]
                        )
                    ) || 0,

                image:
                    getFirstValue(
                        product,
                        [
                            "image",
                            "image_url",
                            "img",
                            "photo"
                        ]
                    ),

                download:
                    getFirstValue(
                        product,
                        [
                            "download",
                            "download_url",
                            "file",
                            "url"
                        ]
                    ),

                category:
                    getFirstValue(
                        product,
                        [
                            "category",
                            "type",
                            "product_category"
                        ]
                    )

            };

        })
        .filter(product => {

            return (
                product.id ||
                product.name
            );

        });

}


/* =========================================================
   12. NORMALIZE HEADER
   ========================================================= */

function normalizeHeader(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[\s\-]+/g, "_");

}


/* =========================================================
   13. GET FIRST AVAILABLE VALUE
   ========================================================= */

function getFirstValue(object, keys) {

    for (const key of keys) {

        const value =
            object[key];

        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        ) {

            return value;

        }

    }

    return "";

}/* =========================================================
   14. RENDER PRODUCTS
   ========================================================= */

function renderProducts(products) {

    const container =
        document.getElementById("products");

    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!products || products.length === 0) {

        container.innerHTML = `

            <div class="no-products">

                <h3>
                    No products found
                </h3>

                <p>
                    Try another search or category.
                </p>

            </div>

        `;

        return;
    }


    products.forEach(product => {

        const card =
            createProductCard(product);

        container.appendChild(card);

    });

}


/* =========================================================
   15. CREATE PRODUCT CARD
   ========================================================= */

function createProductCard(product) {

    const card =
        document.createElement("article");

    card.className =
        "product-card";


    const imageHTML =
        product.image

            ? `

                <img
                    src="${escapeHTML(product.image)}"
                    alt="${escapeHTML(product.name)}"
                    class="product-image"
                    loading="lazy"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                >

                <div
                    class="product-image-placeholder"
                    style="display:none"
                >
                    Image unavailable
                </div>

            `

            : `

                <div class="product-image-placeholder">
                    No image
                </div>

            `;


    const category =
        product.category || "Digital Product";


    const price =
        formatUSD(product.price);


    card.innerHTML = `

        <div class="product-image-wrapper">

            ${imageHTML}

        </div>


        <div class="product-content">

            <div class="product-category">
                ${escapeHTML(category)}
            </div>


            <h3 class="product-title">
                ${escapeHTML(
                    product.name || "Untitled Product"
                )}
            </h3>


            <p class="product-description">
                ${escapeHTML(
                    product.description ||
                    "Digital product."
                )}
            </p>


            <div class="product-bottom">

                <div class="product-price">
                    ${price}
                </div>


                <button
                    type="button"
                    class="buy-button"
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


    return card;

}/* =========================================================
   16. CATEGORY FILTERS
   ========================================================= */

function setupCategoryFilters() {

    const buttons =
        document.querySelectorAll(
            "[data-category]"
        );


    buttons.forEach(button => {

        button.addEventListener("click", () => {

            buttons.forEach(item => {

                item.classList.remove("active");

            });


            button.classList.add("active");


            activeCategory =
                String(
                    button.dataset.category || "all"
                )
                    .trim()
                    .toLowerCase();


            filterProducts();


            const searchInput =
                document.getElementById(
                    "qkjSearchBar"
                );


            const query =
                searchInput
                    ? searchInput.value.trim().toLowerCase()
                    : "";


            updateSearchText(query);

        });

    });

}/* =========================================================
   17. CHECKOUT SETUP
   ========================================================= */

function setupCheckout() {

    const cryptoSelect =
        document.getElementById("cryptoSelect");

    const verifyButton =
        document.getElementById("verifyPayment");


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


    document
        .querySelectorAll("[data-close-modal]")
        .forEach(button => {

            button.addEventListener(
                "click",
                closeCheckout
            );

        });


    const modal =
        document.getElementById(
            "checkoutModal"
        );


    if (modal) {

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

    }

}


/* =========================================================
   18. OPEN CHECKOUT
   ========================================================= */

function openCheckout(product) {

    selectedProduct =
        product;


    const modal =
        document.getElementById(
            "checkoutModal"
        );


    const productName =
        document.getElementById(
            "checkoutProductName"
        );


    const productPrice =
        document.getElementById(
            "checkoutProductPrice"
        );


    const usdAmount =
        document.getElementById(
            "usdAmount"
        );


    const transactionHash =
        document.getElementById(
            "transactionHash"
        );


    const paymentMessage =
        document.getElementById(
            "paymentMessage"
        );


    if (productName) {

        productName.textContent =
            product.name || "Product";

    }


    if (productPrice) {

        productPrice.textContent =
            formatUSD(product.price);

    }


    if (usdAmount) {

        usdAmount.textContent =
            `${formatUSD(product.price)} USD`;

    }


    if (transactionHash) {

        transactionHash.value = "";

    }


    if (paymentMessage) {

        paymentMessage.className =
            "payment-message";

        paymentMessage.textContent = "";

    }


    selectedCurrency =
        "USDT_TRC20";


    const cryptoSelect =
        document.getElementById(
            "cryptoSelect"
        );


    if (cryptoSelect) {

        cryptoSelect.value =
            selectedCurrency;

    }


    updatePaymentDetails();


    if (modal) {

        modal.classList.add("active");

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.style.overflow =
            "hidden";

    }

}


/* =========================================================
   19. CLOSE CHECKOUT
   ========================================================= */

function closeCheckout() {

    const modal =
        document.getElementById(
            "checkoutModal"
        );


    if (modal) {

        modal.classList.remove("active");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    document.body.style.overflow =
        "";

}


/* =========================================================
   20. UPDATE PAYMENT DETAILS
   ========================================================= */

async function updatePaymentDetails() {

    const network =
        document.getElementById(
            "network"
        );


    const walletAddress =
        document.getElementById(
            "walletAddress"
        );


    if (network) {

        network.value =
            CRYPTO_INFO[selectedCurrency]
                ? CRYPTO_INFO[selectedCurrency].network
                : "";

    }


    if (walletAddress) {

        walletAddress.textContent =
            WALLETS[selectedCurrency] ||
            "Wallet unavailable";

    }


    /*
       We intentionally DO NOT calculate the crypto amount here.

       The customer is instructed to check the current
       exchange rate before sending.

       The backend still performs the real payment
       verification.
    */

}/* =========================================================
   21. COPY WALLET ADDRESS
   ========================================================= */

async function copyWalletAddress() {

    const walletElement =
        document.getElementById(
            "walletAddress"
        );


    if (!walletElement) {
        return;
    }


    const address =
        walletElement.textContent.trim();


    if (
        !address ||
        address === "Loading wallet..." ||
        address === "Wallet unavailable"
    ) {

        return;

    }


    try {

        await navigator.clipboard.writeText(
            address
        );


        showPaymentMessage(
            "Wallet address copied.",
            "success"
        );


    } catch (error) {

        console.error(
            "Copy failed:",
            error
        );


        showPaymentMessage(
            "Unable to copy automatically. Please copy the wallet address manually.",
            "error"
        );

    }

}/* =========================================================
   22. VERIFY PAYMENT
   ========================================================= */

async function verifyPayment() {

    if (!selectedProduct) {

        showPaymentMessage(
            "Please select a product first.",
            "error"
        );

        return;

    }


    const transactionInput =
        document.getElementById(
            "transactionHash"
        );


    const verifyButton =
        document.getElementById(
            "verifyPayment"
        );


    if (!transactionInput) {
        return;
    }


    const transactionHash =
        transactionInput.value.trim();


    if (!transactionHash) {

        showPaymentMessage(
            "Please enter your transaction hash.",
            "error"
        );

        transactionInput.focus();

        return;

    }


    if (verifyButton) {

        verifyButton.disabled = true;

        verifyButton.textContent =
            "Verifying Payment...";

    }


    showPaymentMessage(
        "Checking the blockchain. Please wait...",
        "loading"
    );


    try {

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
                            transactionHash

                    })

                }
            );


        let data = {};


        try {

            data =
                await response.json();

        } catch {

            throw new Error(
                "The payment server returned an invalid response."
            );

        }


        if (
            !response.ok ||
            !data.verified
        ) {

            throw new Error(
                data.message ||
                "Payment could not be verified."
            );

        }


        showPaymentMessage(
            "Payment verified successfully. Preparing your download...",
            "success"
        );


        const downloadURL =
            data.download_url ||
            data.downloadUrl;


        if (!downloadURL) {

            throw new Error(
                "Payment was verified, but no download is available for this product."
            );

        }


        /*
           Give the browser a moment to show the
           successful verification message.
        */

        setTimeout(() => {

            window.location.href =
                downloadURL;

        }, 1000);


    } catch (error) {

        console.error(
            "Payment verification error:",
            error
        );


        showPaymentMessage(
            error.message ||
            "Payment verification failed.",
            "error"
        );


        if (verifyButton) {

            verifyButton.disabled =
                false;

            verifyButton.textContent =
                "Verify Payment";

        }

    }

/* =========================================================
   23. PAYMENT MESSAGE
   ========================================================= */

function showPaymentMessage(
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            "paymentMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        `payment-message ${type}`;

}/* =========================================================
   24. FORMAT USD
   ========================================================= */

function formatUSD(value) {

    const number =
        Number(value);


    if (!Number.isFinite(number)) {

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
   25. ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}/* =========================================================
   26. FOOTER YEAR
   ========================================================= */

function setupFooterYear() {

    const year =
        document.getElementById("year");


    if (year) {

        year.textContent =
            new Date().getFullYear();

    }

}