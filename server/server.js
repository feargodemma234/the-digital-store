const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 10000;

/* =========================================================
   CONFIG
========================================================= */

const SHEET_ID =
  "1u9uKN8GeX-1VElXVIdXoNNEsG6xppKGa2gI-PEnDDaI";

const SHEET_NAME = "Sheet1";

/* =========================================================
   WALLET ADDRESSES
========================================================= */

const WALLETS = {
  USDT_TRC20: "TF29vt78UY8XHx5bk19W3u1b33JcZbUcaE",

  BTC: "bc1qdr3k3p09kjey0cdlijhrkeqjvx2ane6ujzz6xy",

  ETH: "0x00c07014Ef8a60eC2E95ee559b58590dd18F89A7",

  BNB: "0x00c07014Ef8a60eC2E95ee559b58590dd18F89A7",

  SOL: "3wSMFEkjRyD7eWu9sTrtiKrBcRPDsNBCu9X4xm4tenbf",

  DOGE: "DTPkSQ9omnxgh7kFL8jUnc6KVR7JqsBWqf"
};

/* =========================================================
   RPC / API SETTINGS
========================================================= */

const ETH_RPC_URL = process.env.ETH_RPC_URL;

const BNB_RPC_URL = process.env.BNB_RPC_URL;

const SOL_RPC_URL =
  process.env.SOL_RPC_URL ||
  "https://api.mainnet.solana.com";

const TRON_API_URL =
  process.env.TRON_API_URL ||
  "https://api.trongrid.io";

const TRON_API_KEY = process.env.TRON_API_KEY;

const BTC_API_URL =
  process.env.BTC_API_URL ||
  "https://blockstream.info/api";

const DOGE_API_URL =
  process.env.DOGE_API_URL ||
  "https://api.blockcypher.com/v1/doge/main";

const BLOCKCYPHER_TOKEN =
  process.env.BLOCKCYPHER_TOKEN || "";

const PRICE_TOLERANCE = 0.005;

/* =========================================================
   TRON USDT CONTRACT
========================================================= */

const TRON_USDT_CONTRACT =
  "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

const TRON_USDT_DECIMALS = 6;

/* =========================================================
   EXPRESS
========================================================= */

app.use(
  cors({
    origin: "*"
  })
);

app.use(express.json());

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "QKJ Store Payment API",
    status: "online"
  });
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    status: "healthy"
  });
});

/* =========================================================
   GOOGLE SHEETS
========================================================= */

function sheetUrl() {
  return (
    "https://docs.google.com/spreadsheets/d/" +
    SHEET_ID +
    "/gviz/tq" +
    "?sheet=" +
    encodeURIComponent(SHEET_NAME) +
    "&tqx=out:json"
  );
}

async function getProducts() {
  const response = await fetch(sheetUrl());

  if (!response.ok) {
    throw new Error(
      `Google Sheets request failed: ${response.status}`
    );
  }

  const text = await response.text();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("Invalid Google Sheets response.");
  }

  const json = JSON.parse(
    text.substring(start, end + 1)
  );

  const cols = (json.table?.cols || []).map(
    (col) => col.label || ""
  );

  const rows = json.table?.rows || [];

  return rows
    .map((row) => {
      const product = {};

      cols.forEach((column, index) => {
        const key = String(column)
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "_");

        const cell = row.c?.[index];

        product[key] =
          cell && cell.v !== null && cell.v !== undefined
            ? cell.v
            : "";
      });

      return normalizeProduct(product);
    })
    .filter((product) => product.id);
}

/* =========================================================
   PRODUCT NORMALIZATION
========================================================= */

function firstValue(object, keys) {
  for (const key of keys) {
    if (
      object[key] !== undefined &&
      object[key] !== null &&
      String(object[key]).trim() !== ""
    ) {
      return object[key];
    }
  }

  return "";
}

function normalizeProduct(product) {
  const id = firstValue(product, [
    "id",
    "product_id"
  ]);

  const name = firstValue(product, [
    "name",
    "title",
    "product_name"
  ]);

  const description = firstValue(product, [
    "description",
    "desc",
    "details"
  ]);

  const priceRaw = firstValue(product, [
    "price_usd",
    "price",
    "p",
    "usd",
    "amount"
  ]);

  const image = firstValue(product, [
    "image",
    "image_url",
    "img",
    "thumbnail",
    "cover"
  ]);

  const download = firstValue(product, [
    "download",
    "download_url",
    "file",
    "file_url"
  ]);

  const category = firstValue(product, [
    "category",
    "type"
  ]);

  const price = Number(
    String(priceRaw).replace(/[$,]/g, "")
  );

  return {
    id: String(id).trim(),
    name: String(name).trim(),
    description: String(description).trim(),
    price: Number.isFinite(price) ? price : 0,
    image: String(image).trim(),
    download: String(download).trim(),
    category: String(category).trim()
  };
}

/* =========================================================
   FIND PRODUCT
========================================================= */

async function findProduct(productId) {
  const products = await getProducts();

  return (
    products.find(
      (product) =>
        String(product.id).toLowerCase() ===
        String(productId).toLowerCase()
    ) || null
  );
}

/* =========================================================
   CRYPTO PRICE
========================================================= */

const COINGECKO_IDS = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  SOL: "solana",
  DOGE: "dogecoin",
  USDT_TRC20: "tether"
};

async function getCryptoUsdPrice(currency) {
  const coinId = COINGECKO_IDS[currency];

  if (!coinId) {
    throw new Error("Unsupported cryptocurrency.");
  }

  const url =
    "https://api.coingecko.com/api/v3/simple/price" +
    "?ids=" +
    encodeURIComponent(coinId) +
    "&vs_currencies=usd";

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Crypto price request failed: ${response.status}`
    );
  }

  const data = await response.json();

  const price = Number(data?.[coinId]?.usd);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(
      "Unable to get current cryptocurrency price."
    );
  }

  return price;
}

/* =========================================================
   PAYMENT QUOTE
========================================================= */

async function calculateCryptoAmount(
  usdPrice,
  currency
) {
  const cryptoUsdPrice =
    await getCryptoUsdPrice(currency);

  const required =
    Number(usdPrice) / cryptoUsdPrice;

  return {
    cryptoUsdPrice,
    required
  };
}

/* =========================================================
   EVM RPC
========================================================= */

async function evmRpc(rpcUrl, method, params) {
  if (!rpcUrl) {
    throw new Error(
      "Blockchain RPC is not configured."
    );
  }

  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params
    })
  });

  if (!response.ok) {
    throw new Error(
      `RPC request failed: ${response.status}`
    );
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(
      data.error.message || "RPC error."
    );
  }

  return data.result;
}

/* =========================================================
   ETH / BNB VERIFICATION
========================================================= */

async function verifyEvmPayment(
  transactionHash,
  requiredAmount,
  currency
) {
  const rpcUrl =
    currency === "ETH"
      ? ETH_RPC_URL
      : BNB_RPC_URL;

  const wallet =
    WALLETS[currency].toLowerCase();

  if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
    throw new Error("Invalid transaction hash.");
  }

  const transaction = await evmRpc(
    rpcUrl,
    "eth_getTransactionByHash",
    [transactionHash]
  );

  if (!transaction) {
    throw new Error(
      "Transaction was not found."
    );
  }

  const receipt = await evmRpc(
    rpcUrl,
    "eth_getTransactionReceipt",
    [transactionHash]
  );

  if (!receipt) {
    throw new Error(
      "Transaction is not confirmed yet."
    );
  }

  if (receipt.status !== "0x1") {
    throw new Error(
      "Transaction failed on the blockchain."
    );
  }

  if (
    String(transaction.to || "").toLowerCase() !==
    wallet
  ) {
    throw new Error(
      "Payment was not sent to the QKJ Store wallet."
    );
  }

  const amountWei = BigInt(
    transaction.value || "0x0"
  );

  const requiredWei = BigInt(
    Math.ceil(requiredAmount * 1e18)
  );

  if (amountWei < requiredWei) {
    throw new Error(
      "The payment amount is insufficient."
    );
  }

  const latestBlockHex = await evmRpc(
    rpcUrl,
    "eth_blockNumber",
    []
  );

  const txBlock = parseInt(
    transaction.blockNumber,
    16
  );

  const latestBlock = parseInt(
    latestBlockHex,
    16
  );

  const confirmations =
    latestBlock - txBlock + 1;

  if (confirmations < 2) {
    throw new Error(
      "Transaction needs more confirmations."
    );
  }

  return {
    verified: true,
    transactionHash,
    amount: Number(amountWei) / 1e18,
    requiredCryptoAmount: requiredAmount,
    quotedCryptoUsdPrice:
      await getCryptoUsdPrice(currency),
    network:
      currency === "ETH"
        ? "Ethereum"
        : "BNB Smart Chain"
  };
}

/* =========================================================
   SOLANA VERIFICATION
========================================================= */

async function verifySolanaPayment(
  transactionHash,
  requiredAmount
) {
  if (
    !/^[1-9A-HJ-NP-Za-km-z]{80,100}$/.test(
      transactionHash
    )
  ) {
    throw new Error(
      "Invalid Solana transaction signature."
    );
  }

  const response = await fetch(
    SOL_RPC_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "getTransaction",
        params: [
          transactionHash,
          {
            encoding: "jsonParsed",
            commitment: "confirmed",
            maxSupportedTransactionVersion: 0
          }
        ]
      })
    }
  );

  const data = await response.json();

  const transaction = data.result;

  if (!transaction) {
    throw new Error(
      "Solana transaction was not found or is not confirmed."
    );
  }

  const wallet = WALLETS.SOL;

  let receivedLamports = 0;

  const instructions =
    transaction.transaction?.message
      ?.instructions || [];

  for (const instruction of instructions) {
    const parsed = instruction.parsed;

    if (
      parsed?.type === "transfer" &&
      parsed?.info?.destination === wallet
    ) {
      receivedLamports += Number(
        parsed.info.lamports || 0
      );
    }
  }

  const received =
    receivedLamports / 1e9;

  if (received < requiredAmount) {
    throw new Error(
      "The Solana payment amount is insufficient."
    );
  }

  return {
    verified: true,
    transactionHash,
    amount: received,
    requiredCryptoAmount: requiredAmount,
    quotedCryptoUsdPrice:
      await getCryptoUsdPrice("SOL"),
    network: "Solana"
  };
}

/* =========================================================
   TRON USDT VERIFICATION
========================================================= */

async function verifyTronUsdtPayment(
  transactionHash,
  requiredAmount
) {
  if (
    !/^[a-fA-F0-9]{64}$/.test(
      transactionHash
    )
  ) {
    throw new Error(
      "Invalid TRON transaction hash."
    );
  }

  const headers = {};

  if (TRON_API_KEY) {
    headers["TRON-PRO-API-KEY"] =
      TRON_API_KEY;
  }

  const url =
    `${TRON_API_URL}/v1/accounts/` +
    `${WALLETS.USDT_TRC20}` +
    `/transactions/trc20` +
    `?limit=200` +
    `&contract_address=${TRON_USDT_CONTRACT}` +
    `&only_confirmed=true`;

  const response = await fetch(url, {
    headers
  });

  if (!response.ok) {
    throw new Error(
      `TRON API request failed: ${response.status}`
    );
  }

  const data = await response.json();

  const transfers = data.data || [];

  const transfer = transfers.find(
    (item) =>
      String(item.transaction_id).toLowerCase() ===
        transactionHash.toLowerCase() &&
      String(item.to).toLowerCase() ===
        WALLETS.USDT_TRC20.toLowerCase() &&
      String(item.token_info?.address || "").toLowerCase() ===
        TRON_USDT_CONTRACT.toLowerCase()
  );

  if (!transfer) {
    throw new Error(
      "Confirmed USDT TRC20 payment was not found."
    );
  }

  const rawAmount = Number(
    transfer.value || 0
  );

  const amount =
    rawAmount /
    Math.pow(10, TRON_USDT_DECIMALS);

  if (amount + PRICE_TOLERANCE < requiredAmount) {
    throw new Error(
      "The USDT payment amount is insufficient."
    );
  }

  return {
    verified: true,
    transactionHash,
    amount,
    requiredCryptoAmount: requiredAmount,
    quotedCryptoUsdPrice:
      await getCryptoUsdPrice("USDT_TRC20"),
    network: "TRON TRC20"
  };
}

/* =========================================================
   BITCOIN VERIFICATION
========================================================= */

async function verifyBitcoinPayment(
  transactionHash,
  requiredAmount
) {
  if (
    !/^[a-fA-F0-9]{64}$/.test(
      transactionHash
    )
  ) {
    throw new Error(
      "Invalid Bitcoin transaction hash."
    );
  }

  const response = await fetch(
    `${BTC_API_URL}/tx/${transactionHash}`
  );

  if (!response.ok) {
    throw new Error(
      "Bitcoin transaction was not found."
    );
  }

  const tx = await response.json();

  if (!tx.status?.confirmed) {
    throw new Error(
      "Bitcoin transaction is not confirmed yet."
    );
  }

  let receivedSatoshis = 0;

  for (const output of tx.vout || []) {
    if (
      output.scriptpubkey_address ===
      WALLETS.BTC
    ) {
      receivedSatoshis += Number(
        output.value || 0
      );
    }
  }

  const received =
    receivedSatoshis / 1e8;

  if (received < requiredAmount) {
    throw new Error(
      "The Bitcoin payment amount is insufficient."
    );
  }

  return {
    verified: true,
    transactionHash,
    amount: received,
    requiredCryptoAmount: requiredAmount,
    quotedCryptoUsdPrice:
      await getCryptoUsdPrice("BTC"),
    network: "Bitcoin"
  };
}

/* =========================================================
   DOGE VERIFICATION
========================================================= */

async function verifyDogecoinPayment(
  transactionHash,
  requiredAmount
) {
  if (
    !/^[a-fA-F0-9]{64}$/.test(
      transactionHash
    )
  ) {
    throw new Error(
      "Invalid Dogecoin transaction hash."
    );
  }

  let url =
    `${DOGE_API_URL}/txs/${transactionHash}`;

  if (BLOCKCYPHER_TOKEN) {
    url +=
      `?token=${encodeURIComponent(
        BLOCKCYPHER_TOKEN
      )}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      "Dogecoin transaction was not found."
    );
  }

  const tx = await response.json();

  if (
    Number(tx.confirmations || 0) < 1
  ) {
    throw new Error(
      "Dogecoin transaction is not confirmed yet."
    );
  }

  let receivedKoinu = 0;

  for (const output of tx.outputs || []) {
    if (
      (output.addresses || []).includes(
        WALLETS.DOGE
      )
    ) {
      receivedKoinu += Number(
        output.value || 0
      );
    }
  }

  const received =
    receivedKoinu / 1e8;

  if (received < requiredAmount) {
    throw new Error(
      "The Dogecoin payment amount is insufficient."
    );
  }

  return {
    verified: true,
    transactionHash,
    amount: received,
    requiredCryptoAmount: requiredAmount,
    quotedCryptoUsdPrice:
      await getCryptoUsdPrice("DOGE"),
    network: "Dogecoin"
  };
}

/* =========================================================
   PAYMENT DISPATCHER
========================================================= */

async function verifyPayment(
  currency,
  transactionHash,
  requiredAmount
) {
  switch (currency) {
    case "USDT_TRC20":
      return verifyTronUsdtPayment(
        transactionHash,
        requiredAmount
      );

    case "BTC":
      return verifyBitcoinPayment(
        transactionHash,
        requiredAmount
      );

    case "ETH":
      return verifyEvmPayment(
        transactionHash,
        requiredAmount,
        "ETH"
      );

    case "BNB":
      return verifyEvmPayment(
        transactionHash,
        requiredAmount,
        "BNB"
      );

    case "SOL":
      return verifySolanaPayment(
        transactionHash,
        requiredAmount
      );

    case "DOGE":
      return verifyDogecoinPayment(
        transactionHash,
        requiredAmount
      );

    default:
      throw new Error(
        "Unsupported cryptocurrency."
      );
  }
}

/* =========================================================
   PAYMENT QUOTE
========================================================= */

app.get(
  "/api/payment-quote",
  async (req, res) => {
    try {
      const productId =
        req.query.product_id;

      const currency =
        String(
          req.query.currency || ""
        ).toUpperCase();

      if (!productId) {
        return res.status(400).json({
          ok: false,
          message: "product_id is required."
        });
      }

      if (!WALLETS[currency]) {
        return res.status(400).json({
          ok: false,
          message:
            "Unsupported cryptocurrency."
        });
      }

      const product =
        await findProduct(productId);

      if (!product) {
        return res.status(404).json({
          ok: false,
          message: "Product not found."
        });
      }

      if (
        !Number.isFinite(product.price) ||
        product.price <= 0
      ) {
        return res.status(400).json({
          ok: false,
          message:
            "Product has an invalid price."
        });
      }

      const quote =
        await calculateCryptoAmount(
          product.price,
          currency
        );

      return res.json({
        ok: true,
        productId: product.id,
        productName: product.name,
        currency,

        walletAddress:
          WALLETS[currency],

        usdPrice:
          product.price,

        cryptoUsdPrice:
          quote.cryptoUsdPrice,

        cryptoAmount:
          quote.required
      });
    } catch (error) {
      console.error(
        "Payment quote error:",
        error
      );

      return res.status(500).json({
        ok: false,
        message:
          error?.message ||
          "Unable to calculate payment quote."
      });
    }
  }
);

/* =========================================================
   VERIFY PAYMENT
========================================================= */

app.post(
  "/api/verify-payment",
  async (req, res) => {
    try {
      const {
        product_id,
        currency,
        transaction_hash
      } = req.body || {};

      const normalizedCurrency =
        String(
          currency || ""
        ).toUpperCase();

      const hash =
        String(
          transaction_hash || ""
        ).trim();

      if (!product_id) {
        return res.status(400).json({
          verified: false,
          message:
            "product_id is required."
        });
      }

      if (!WALLETS[normalizedCurrency]) {
        return res.status(400).json({
          verified: false,
          message:
            "Unsupported cryptocurrency."
        });
      }

       if (!hash) {
        return res.status(400).json({
          verified: false,
          message:
            "Transaction hash is required."
        });
      }

      const product =
        await findProduct(product_id);

      if (!product) {
        return res.status(404).json({
          verified: false,
          message:
            "Product not found."
        });
      }

      const quote =
        await calculateCryptoAmount(
          product.price,
          normalizedCurrency
        );

      const result =
        await verifyPayment(
          normalizedCurrency,
          hash,
          quote.required
        );

      if (!result.verified) {
        return res.status(400).json({
          verified: false,
          message:
            "Payment could not be verified."
        });
      }

      return res.json({
        verified: true,

        message:
          "Payment verified successfully.",

        productId:
          product.id,

        productName:
          product.name,

        currency:
          normalizedCurrency,

        transactionHash:
          result.transactionHash,

        amountReceived:
          result.amount,

        requiredAmount:
          result.requiredCryptoAmount,

        cryptoUsdPrice:
          result.quotedCryptoUsdPrice,

        network:
          result.network,

        walletAddress:
          WALLETS[normalizedCurrency],

        download_url:
          product.download || null
      });
    } catch (error) {
      console.error(
        "Payment verification error:",
        error
      );

      return res.status(400).json({
        verified: false,
        message:
          error?.message ||
          "Payment verification failed."
      });
    }
  }
);

/* =========================================================
   404
========================================================= */

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: "Endpoint not found."
  });
});

/* =========================================================
   START SERVER
========================================================= */

app.listen(PORT, () => {
  console.log(
    `QKJ Store Payment API running on port ${PORT}`
  );

  console.log(
    "Supported currencies:",
    Object.keys(WALLETS).join(", ")
  );
});