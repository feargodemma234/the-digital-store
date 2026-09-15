// ============================================================
// QKJ STORE - COMPLETE SCRIPT
// ============================================================

// ============================================================
// 1. CONFIGURATION
// ============================================================

const SHEET_ID = "1u9uKN8GeX-1VElXVIdXoNNEsG6xppKGa2gI-PEnDDaI";
const SHEET_NAME = "Sheet1";

const API_URL = "https://qkj-payment-api.onrender.com";


// ============================================================
// 2. CRYPTO WALLETS
// ============================================================

const WALLETS = {
    USDT_TRC20: "TF29vt78UY8XHx5bk19W3u1b33JcZbUcaE",
    BTC: "bc1qdr3k3p09kjey0cdlijhrkeqjvx2ane6ujzz6xy",
    ETH: "0x00c07014Ef8a60eC2E95ee559b58590dd18F89A7",
    BNB: "0x00c07014Ef8a60eC2E95ee559b58590dd18F89A7",
    SOL: "3wSMFEkjRyD7eWu9sTrtiKrBcRPDsNBCu9X4xm4tenbf",
    DOGE: "DTPkSQ9omnxgh7kFL8jUnc6KVR7JqsBWqf"
};


// ============================================================
// 3. CRYPTO INFORMATION
// ============================================================

const CRYPTO_INFO = {
    USDT_TRC20: {
        name: "USDT",
        network: "TRON (TRC20)"
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
        network: "BNB Smart Chain (BEP20)"
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


// ============================================================
// 4. GLOBAL STATE
// ============================================================

let productsData = [];
let selectedProduct = null;
let selectedCurrency = "USDT_TRC20";
let activeCategory = "all";


// ============================================================
// 5. START APP
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("QKJ Store starting...");

    createSearchBar();
    setupCheckout();
    setupCategoryFilters();
    setupFooterYear();

    loadProducts();
});


// ============================================================
// 6. SEARCH BAR
// ============================================================

function createSearchBar() {

    const searchInput = document.getElementById("qkjSearchBar");
    const clearButton = document.getElementById("clearSearch");

    if (!searchInput) {
        console.warn("Search input not found.");
        return;
    }

    searchInput.addEventListener("input", () => {

        const query = searchInput.value.trim();

        updateSearchText(query);
        filterProducts();

    });

    if (clearButton) {

        clearButton.addEventListener("click", () => {

            searchInput.value = "";

            updateSearchText("");

            filterProducts();

            searchInput.focus();

        });

    }
}


// ============================================================
// 7. SEARCH TEXT
// ============================================================

function updateSearchText(query) {

    const resultText = document.getElementById("searchResultText");

    if (!resultText) {
        return;
    }

    if (!query) {

        resultText.textContent = "";

        return;
    }

    const results = getFilteredProducts(query);

    resultText.textContent =
        `${results.length} product${results.length === 1 ? "" : "s"} found`;
}


// ============================================================
// 8. FILTER PRODUCTS
// ============================================================

function filterProducts() {

    const searchInput = document.getElementById("qkjSearchBar");

    const query = searchInput
        ? searchInput.value.trim()
        : "";

    const filtered = getFilteredProducts(query);

    renderProducts(filtered);
}


function getFilteredProducts(query = "") {

    const normalizedQuery = query.toLowerCase();

    return productsData.filter(product => {

        const matchesCategory =
            activeCategory === "all" ||
            normalizeCategory(product.category) ===
            normalizeCategory(activeCategory);

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
}


// ============================================================
// 9. LOAD PRODUCTS FROM GOOGLE SHEETS
// ============================================================

async function loadProducts() {

    const loading = document.getElementById("loading");
    const errorBox = document.getElementById("errorMessage");
    const productsBox = document.getElementById("products");

    if (loading) {
        loading.style.display = "block";
    }

    if (errorBox) {
        errorBox.style.display = "none";
        errorBox.innerHTML = "";
    }

    if (productsBox) {
        productsBox.innerHTML = "";
    }

    const url =
        `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq` +
        `?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

    console.log("Loading products from:");
    console.log(url);

    try {

        const response = await fetch(url, {
            method: "GET",
            cache: "no-store"
        });

        console.log(
            "Google Sheets HTTP status:",
            response.status
        );

        if (!response.ok) {

            throw new Error(
                `Google Sheets returned HTTP ${response.status}`
            );

        }

        const text = await response.text();

        console.log(
            "Google Sheets response received."
        );

        console.log(
            "Response length:",
            text.length
        );


        // --------------------------------------------------------
        // Google GViz returns:
        //
        // google.visualization.Query.setResponse({...});
        // --------------------------------------------------------

        const match = text.match(
            /google\.visualization\.Query\.setResponse\(([\s\S]*)\);?\s*$/
        );

        if (!match) {

            console.error(
                "Unexpected Google Sheets response:",
                text.substring(0, 1000)
            );

            throw new Error(
                "Could not read Google Sheets data. " +
                "Make sure the sheet is shared publicly."
            );
        }


        let data;

        try {

            data = JSON.parse(match[1]);

        } catch (parseError) {

            console.error(
                "Google Sheets JSON parse error:",
                parseError
            );

            throw new Error(
                "Google Sheets returned invalid data."
            );
        }


        if (!data.table) {

            throw new Error(
                "Google Sheets returned no table data."
            );
        }


        console.log(
            "Google Sheets table:",
            data.table
        );


        const products =
            normalizeSheetProducts(data.table);


        console.log(
            "Normalized products:",
            products
        );


        productsData = products;


        if (loading) {
            loading.style.display = "none";
        }


        if (products.length === 0) {

            if (productsBox) {

                productsBox.innerHTML = `
                    <div class="no-products">
                        <h3>No products found</h3>
                        <p>
                            The Google Sheet was reached successfully,
                            but no valid products were detected.
                        </p>
                    </div>
                `;

            }

            return;
        }


        renderProducts(products);


        console.log(
            `QKJ Store loaded ${products.length} product(s).`
        );

    } catch (error) {

        console.error(
            "PRODUCT LOADING ERROR:",
            error
        );


        if (loading) {
            loading.style.display = "none";
        }


        if (errorBox) {

            errorBox.style.display = "block";

            errorBox.innerHTML = `
                <strong>Could not load products.</strong>
                <br><br>
                ${escapeHTML(error.message)}
                <br><br>
                Please check that your Google Sheet is shared as
                <strong>Anyone with the link → Viewer</strong>.
            `;

        }
    }
}


// ============================================================
// 10. NORMALIZE GOOGLE SHEET PRODUCTS
// ============================================================

function normalizeSheetProducts(table) {

    if (!table || !Array.isArray(table.cols)) {

        console.error(
            "Invalid Google Sheets table:",
            table
        );

        return [];
    }


    const headers = table.cols.map((column, index) => {

        return normalizeHeader(
            column.label ||
            column.id ||
            `column_${index}`
        );

    });


    console.log(
        "Detected sheet headers:",
        headers
    );


    const rows = table.rows || [];


    return rows
        .map((row, rowIndex) => {

            const values = row.c || [];

            const object = {};


            headers.forEach((header, index) => {

                const cell = values[index];

                object[header] =
                    cell && cell.v !== undefined
                        ? cell.v
                        : "";

            });


            const id = getFirstValue(object, [
                "id",
                "product_id",
                "productid"
            ]);


            const name = getFirstValue(object, [
                "name",
                "product_name",
                "productname",
                "title"
            ]);


            const description = getFirstValue(object, [
                "description",
                "desc",
                "details"
            ]);


            const price = getFirstValue(object, [
                "price",
                "price_usd",
                "priceusd",
                "usd",
                "usd_price",
                "usdprice",
                "p"
            ]);


            const image = getFirstValue(object, [
                "image",
                "image_url",
                "imageurl",
                "thumbnail",
                "cover"
            ]);


            const download = getFirstValue(object, [
                "download",
                "download_url",
                "downloadurl",
                "file",
                "file_url",
                "fileurl"
            ]);


            const category = getFirstValue(object, [
                "category",
                "type",
                "product_category"
            ]);


            const product = {

                id: String(id || `product-${rowIndex + 1}`),

                name: String(
                    name || "Unnamed Product"
                ),

                description: String(
                    description || ""
                ),

                price: parseFloat(price) || 0,

                image: String(
                    image || ""
                ),

                download: String(
                    download || ""
                ),

                category: String(
                    category || "Other"
                )

            };


            // Ignore completely empty rows.

            const isEmpty =
                !id &&
                !name &&
                !description &&
                !price &&
                !image &&
                !download &&
                !category;


            if (isEmpty) {
                return null;
            }


            return product;

        })
        .filter(Boolean);

}


// ============================================================
// 11. NORMALIZE HEADER
// ============================================================

function normalizeHeader(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[\s\-\/]+/g, "_")
        .replace(/[^\w]/g, "");

}


// ============================================================
// 12. GET FIRST VALUE
// ============================================================

function getFirstValue(object, keys) {

    for (const key of keys) {

        const value = object[key];

        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        ) {

            return value;

        }

    }

    return "";

}


// ============================================================
// 13. RENDER PRODUCTS
// ============================================================

function renderProducts(products) {

    const container =
        document.getElementById("products");

    if (!container) {

        console.error(
            "Products container #products not found."
        );

        return;
    }


    container.innerHTML = "";


    if (!products || products.length === 0) {

        container.innerHTML = `
            <div class="no-products">
                <h3>No products found</h3>
                <p>Try another search or category.</p>
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


// ============================================================
// 14. CREATE PRODUCT CARD
// ============================================================

function createProductCard(product) {

    const card =
        document.createElement("article");

    card.className = "product-card";


    const imageHTML = product.image

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
        `;


    card.innerHTML = `

        <div class="product-image-wrap">

            ${imageHTML}

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


    if (buyButton) {

        buyButton.addEventListener(
            "click",
            () => openCheckout(product)
        );

    }


    return card;
}


// ============================================================
// 15. CATEGORY FILTERS
// ============================================================

function setupCategoryFilters() {

    const buttons =
        document.querySelectorAll(
            "[data-category]"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                activeCategory =
                    button.dataset.category ||
                    "all";


                buttons.forEach(btn => {

                    btn.classList.remove(
                        "active"
                    );

                });


                button.classList.add(
                    "active"
                );


                filterProducts();

            }
        );

    });

}


function normalizeCategory(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[_\-]+/g, " ")
        .replace(/\s+/g, " ");

}


// ============================================================
// 16. CHECKOUT SETUP
// ============================================================

function setupCheckout() {

    const cryptoSelect =
        document.getElementById("cryptoSelect");


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


    const verifyButton =
        document.getElementById("verifyPayment");


    if (verifyButton) {

        verifyButton.addEventListener(
            "click",
            verifyPayment
        );

    }


    const closeButton =
        document.getElementById("closeCheckout");


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeCheckout
        );

    }


    const modal =
        document.getElementById("checkoutModal");


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


// ============================================================
// 17. OPEN CHECKOUT
// ============================================================

function openCheckout(product) {

    selectedProduct = product;


    const modal =
        document.getElementById("checkoutModal");


    if (!modal) {
        return;
    }


    const nameElement =
        document.getElementById(
            "checkoutProductName"
        );


    const priceElement =
        document.getElementById(
            "checkoutProductPrice"
        );


    if (nameElement) {

        nameElement.textContent =
            product.name;

    }


    if (priceElement) {

        priceElement.textContent =
            formatUSD(product.price);

    }


    const transactionInput =
        document.getElementById(
            "transactionHash"
        );


    if (transactionInput) {

        transactionInput.value = "";

    }


    showPaymentMessage(
        "",
        ""
    );


    const cryptoSelect =
        document.getElementById(
            "cryptoSelect"
        );


    if (cryptoSelect) {

        selectedCurrency =
            cryptoSelect.value ||
            "USDT_TRC20";

    }


    updatePaymentDetails();


    modal.style.display = "flex";

    document.body.style.overflow = "hidden";

}


// ============================================================
// 18. CLOSE CHECKOUT
// ============================================================

function closeCheckout() {

    const modal =
        document.getElementById(
            "checkoutModal"
        );


    if (modal) {

        modal.style.display = "none";

    }


    document.body.style.overflow = "";

    selectedProduct = null;

}


// ============================================================
// 19. UPDATE PAYMENT DETAILS
// ============================================================

function updatePaymentDetails() {

    const info =
        CRYPTO_INFO[selectedCurrency];


    if (!info) {
        return;
    }


    const networkElement =
        document.getElementById("network");


    const walletElement =
        document.getElementById("walletAddress");


    const usdAmountElement =
        document.getElementById("usdAmount");


    if (networkElement) {

        networkElement.textContent =
            info.network;

    }


    if (walletElement) {

        walletElement.textContent =
            WALLETS[selectedCurrency] ||
            "";

    }


    if (
        usdAmountElement &&
        selectedProduct
    ) {

        usdAmountElement.textContent =
            formatUSD(selectedProduct.price);

    }

}


// ============================================================
// 20. COPY WALLET ADDRESS
// ============================================================

async function copyWalletAddress() {

    const wallet =
        WALLETS[selectedCurrency];


    if (!wallet) {
        return;
    }


    try {

        await navigator.clipboard.writeText(
            wallet
        );


        showPaymentMessage(
            "Wallet address copied.",
            "success"
        );


    } catch (error) {

        // Fallback for older browsers.

        const textarea =
            document.createElement("textarea");

        textarea.value = wallet;

        document.body.appendChild(
            textarea
        );

        textarea.select();

        document.execCommand("copy");

        textarea.remove();


        showPaymentMessage(
            "Wallet address copied.",
            "success"
        );

    }

}


// ============================================================
// 21. VERIFY PAYMENT
// ============================================================

async function verifyPayment() {

    if (!selectedProduct) {

        showPaymentMessage(
            "Please select a product first.",
            "error"
        );

        return;
    }


    const hashInput =
        document.getElementById(
            "transactionHash"
        );


    const verifyButton =
        document.getElementById(
            "verifyPayment"
        );


    const transactionHash =
        hashInput
            ? hashInput.value.trim()
            : "";


    if (!transactionHash) {

        showPaymentMessage(
            "Please enter your transaction hash.",
            "error"
        );

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


        let data = null;


        try {

            data =
                await response.json();

        } catch {

            throw new Error(
                "The payment server returned an invalid response."
            );

        }


        console.log(
            "Payment verification response:",
            data
        );


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
            "Payment verified! Preparing your download...",
            "success"
        );


        // --------------------------------------------------------
        // IMPORTANT:
        //
        // The server must return the download URL only after
        // successful blockchain verification.
        // --------------------------------------------------------

        const downloadURL =
            data.download_url ||
            data.downloadUrl;


        if (!downloadURL) {

            throw new Error(
                "Payment was verified, but no download was returned."
            );

        }


        setTimeout(() => {

            window.location.href =
                downloadURL;

        }, 1000);


    } catch (error) {

        console.error(
            "PAYMENT VERIFICATION ERROR:",
            error
        );


        showPaymentMessage(
            error.message ||
            "Payment verification failed.",
            "error"
        );


    } finally {

        if (verifyButton) {

            verifyButton.disabled = false;

            verifyButton.textContent =
                "Verify Payment";

        }

    }

}


// ============================================================
// 22. PAYMENT MESSAGE
// ============================================================

function showPaymentMessage(
    message,
    type = ""
) {

    const element =
        document.getElementById(
            "paymentMessage"
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


// ============================================================
// 23. FORMAT USD
// ============================================================

function formatUSD(value) {

    const number =
        Number(value);


    if (!Number.isFinite(number)) {

        return "$0.00";

    }


    return number.toLocaleString(
        "en-US",
        {
            style: "currency",
            currency: "USD"
        }
    );

}


// ============================================================
// 24. ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ============================================================
// 25. FOOTER YEAR
// ============================================================

function setupFooterYear() {

    const year =
        document.getElementById(
            "footerYear"
        );


    if (year) {

        year.textContent =
            new Date().getFullYear();

    }

}


// ============================================================
// 26. DEBUG INFORMATION
// ============================================================

console.log(
    "QKJ Store script loaded successfully."
);

console.log(
    "API:",
    API_URL
);

console.log(
    "Sheet:",
    SHEET_ID,
    SHEET_NAME
);