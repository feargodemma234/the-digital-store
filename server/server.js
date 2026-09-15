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
   RPC / API SETTINGS
========================================================= */

const ETH_RPC_URL =
  process.env.ETH_RPC_URL;

const BNB_RPC_URL =
  process.env.BNB_RPC_URL;

const SOL_RPC_URL =
  process.env.SOL_RPC_URL ||
  "https://api.mainnet.solana.com";

const TRON_API_URL =
  process.env.TRON_API_URL ||
  "https://api.trongrid.io";

const TRON_API_KEY =
  process.env.TRON_API_KEY;

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
  const response = await fetch(
    sheetUrl()
  );

  if (!response.ok) {
    throw new Error(
      `Google Sheets request failed: ${response.status}`
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

  const json =
    JSON.parse(
      text.substring(
        start,
        end + 1
      )
    );

  const cols =
    (
      json.table?.cols ||
      []
    ).map(
      col =>
        col.label || ""
    );

  const rows =
    json.table?.rows || [];

  return rows
    .map(row => {

      const product = {};

      cols.forEach(
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
      product => product.id
    );
}

/* =========================================================
   PRODUCT NORMALIZATION
========================================================= */

function firstValue(
  object,
  keys
) {

  for (
    const key of keys
  ) {

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
    firstValue(
      product,
      [
        "id",
        "product_id"
      ]
    );

  const name =
    firstValue(
      product,
      [
        "name",
        "title",
        "product_name"
      ]
    );

  const description =
    firstValue(
      product,
      [
        "description",
        "desc",
        "details"
      ]
    );

  const priceRaw =
    firstValue(
      product,
      [
        "price_usd",
        "price",
        "p",
        "usd",
        "amount"
      ]
    );

  const image =
    firstValue(
      product,
      [
        "image",
        "image_url",
        "img",
        "thumbnail",
        "cover"
      ]
    );

  const download =
    firstValue(
      product,
      [
        "download",
        "download_url",
        "file",
        "file_url"
      ]
    );

  const category =
    firstValue(
      product,
      [
        "category",
        "type"
      ]
    );

  const price =
    Number(
      String(
        priceRaw
      ).replace(
        /[$,]/g,
        ""
      )
    );

  return {
    id:
      String(id).trim(),

    name:
      String(name).trim(),

    description:
      String(description).trim(),

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
   FIND PRODUCT
========================================================= */

async function findProduct(
  productId
) {

  const products =
    await getProducts();

  return (
    products.find(
      product =>
        String(
          product.id
        ).toLowerCase() ===
        String(
          productId
        ).toLowerCase()
    ) || null
  );

}

/* =========================================================
   CRYPTO PRICE
========================================================= */

const COINGECKO_IDS = {

  BTC:
    "bitcoin",

  ETH:
    "ethereum",

  BNB:
    "binancecoin",

  SOL:
    "solana",

  DOGE:
    "dogecoin",

  USDT_TRC20:
    "tether"

};

async function getCryptoUsdPrice(
  currency
) {

  const coinId =
    COINGECKO_IDS[
      currency
    ];

  if (!coinId) {

    throw new Error(
      "Unsupported cryptocurrency."
    );

  }

  const url =
    "https://api.coingecko.com/api/v3/simple/price" +
    "?ids=" +
    encodeURIComponent(
      coinId
    ) +
    "&vs_currencies=usd";

  const response =
    await fetch(url);

  if (!response.ok) {

    throw new Error(
      `Crypto price request failed: ${response.status}`
    );

  }

  const data =
    await response.json();

  const price =
    Number(
      data?.[coinId]?.usd
    );

  if (
    !Number.isFinite(price) ||
    price <= 0
  ) {

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
    await getCryptoUsdPrice(
      currency
    );

  const required =
    Number(usdPrice) /
    cryptoUsdPrice;

  return {

    cryptoUsdPrice,

    required

  };

}// ============================================================
// EVM RPC HELPER
// ============================================================

async function evmRpc(rpcUrl, method, params = []) {

  const response = await fetch(rpcUrl, {

    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params
    })

  });

  if (!response.ok) {
    throw new Error(
      `EVM RPC request failed: ${response.status}`
    );
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(
      data.error.message ||
      "EVM RPC error"
    );
  }

  return data.result;
}


// ============================================================
// ETH / BNB NATIVE TRANSACTION VERIFICATION
// ============================================================

async function verifyEvmTransaction(
  txHash,
  requiredAmount,
  wallet,
  rpcUrl
) {

  if (
    typeof txHash !== "string" ||
    !/^0x[a-fA-F0-9]{64}$/.test(txHash)
  ) {

    return {
      verified: false,
      reason: "Invalid transaction hash."
    };

  }


  if (!rpcUrl) {

    return {
      verified: false,
      reason:
        "RPC URL is not configured for this network."
    };

  }


  // Get transaction
  const transaction =
    await evmRpc(
      rpcUrl,
      "eth_getTransactionByHash",
      [txHash]
    );


  if (!transaction) {

    return {
      verified: false,
      reason:
        "Transaction was not found on the blockchain."
    };

  }


  // Make sure transaction was actually mined
  if (!transaction.blockNumber) {

    return {
      verified: false,
      reason:
        "Transaction has not been confirmed yet."
    };

  }


  // Check destination wallet
  if (
    !transaction.to ||
    transaction.to.toLowerCase() !==
    wallet.toLowerCase()
  ) {

    return {
      verified: false,
      reason:
        "Transaction was not sent to the QKJ Store wallet."
    };

  }


  // Get receipt
  const receipt =
    await evmRpc(
      rpcUrl,
      "eth_getTransactionReceipt",
      [txHash]
    );


  if (!receipt) {

    return {
      verified: false,
      reason:
        "Transaction receipt is not available yet."
    };

  }


  // Receipt status 0x1 = successful
  if (receipt.status !== "0x1") {

    return {
      verified: false,
      reason:
        "Blockchain transaction failed."
    };

  }


  // ----------------------------------------------------------
  // Calculate confirmations
  // ----------------------------------------------------------

  const latestBlockHex =
    await evmRpc(
      rpcUrl,
      "eth_blockNumber",
      []
    );


  const latestBlock =
    parseInt(
      latestBlockHex,
      16
    );

  const transactionBlock =
    parseInt(
      transaction.blockNumber,
      16
    );


  const confirmations =
    latestBlock -
    transactionBlock +
    1;


  // Require at least 2 confirmations
  if (confirmations < 2) {

    return {
      verified: false,
      reason:
        `Waiting for confirmations. Current confirmations: ${confirmations}`,
      confirmations
    };

  }


  // ----------------------------------------------------------
  // Convert transaction value from hexadecimal Wei
  // ----------------------------------------------------------

  const valueWei =
    BigInt(transaction.value);


  // Convert required coin amount to Wei
  const requiredWei =
    BigInt(
      Math.ceil(
        Number(requiredAmount) *
        1e18
      )
    );


  // ----------------------------------------------------------
  // Check payment amount
  // ----------------------------------------------------------

  if (valueWei < requiredWei) {

    const actualAmount =
      Number(valueWei) /
      1e18;

    return {
      verified: false,
      reason:
        `Insufficient payment. Received ${actualAmount}, required ${requiredAmount}.`,
      receivedAmount: actualAmount,
      requiredAmount: Number(requiredAmount),
      confirmations
    };

  }


  const actualAmount =
    Number(valueWei) /
    1e18;


  return {

    verified: true,

    confirmations,

    receivedAmount:
      actualAmount,

    requiredAmount:
      Number(requiredAmount),

    from:
      transaction.from,

    to:
      transaction.to,

    blockNumber:
      transaction.blockNumber,

    transactionHash:
      txHash

  };

}


// ============================================================
// ETH VERIFICATION
// ============================================================

async function verifyEthereumPayment(
  txHash,
  requiredAmount
) {

  return verifyEvmTransaction(

    txHash,

    requiredAmount,

    WALLETS.ETH,

    ETH_RPC_URL

  );

}


// ============================================================
// BNB VERIFICATION
// ============================================================

async function verifyBnbPayment(
  txHash,
  requiredAmount
) {

  return verifyEvmTransaction(

    txHash,

    requiredAmount,

    WALLETS.BNB,

    BNB_RPC_URL

  );

}// ============================================================
// SOLANA PAYMENT VERIFICATION
// ============================================================

async function verifySolanaPayment(
  txHash,
  requiredAmount
) {

  if (
    typeof txHash !== "string" ||
    !/^[1-9A-HJ-NP-Za-km-z]{80,100}$/.test(txHash)
  ) {

    return {
      verified: false,
      reason: "Invalid Solana transaction signature."
    };

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

        id: 1,

        method: "getTransaction",

        params: [

          txHash,

          {
            encoding: "jsonParsed",
            commitment: "confirmed",
            maxSupportedTransactionVersion: 0
          }

        ]

      })

    }
  );


  if (!response.ok) {

    throw new Error(
      `Solana RPC request failed: ${response.status}`
    );

  }


  const data =
    await response.json();


  if (data.error) {

    throw new Error(
      data.error.message ||
      "Solana RPC error."
    );

  }


  const transaction =
    data.result;


  if (!transaction) {

    return {
      verified: false,
      reason:
        "Solana transaction was not found."
    };

  }


  if (
    transaction.meta &&
    transaction.meta.err
  ) {

    return {
      verified: false,
      reason:
        "Solana transaction failed."
    };

  }


  let receivedLamports = 0;


  // ----------------------------------------------------------
  // Look through parsed transfer instructions
  // ----------------------------------------------------------

  const instructions =
    transaction.transaction.message.instructions || [];


  for (
    const instruction of instructions
  ) {

    if (
      instruction.parsed &&
      instruction.parsed.type === "transfer"
    ) {

      const info =
        instruction.parsed.info;


      if (
        info.destination ===
        WALLETS.SOL
      ) {

        receivedLamports +=
          Number(info.lamports || 0);

      }

    }

  }


  const receivedSol =
    receivedLamports / 1e9;


  if (
    receivedSol <
    Number(requiredAmount)
  ) {

    return {

      verified: false,

      reason:
        `Insufficient SOL payment. Received ${receivedSol}, required ${requiredAmount}.`,

      receivedAmount:
        receivedSol,

      requiredAmount:
        Number(requiredAmount)

    };

  }


  return {

    verified: true,

    receivedAmount:
      receivedSol,

    requiredAmount:
      Number(requiredAmount),

    transactionHash:
      txHash

  };

}


// ============================================================
// TRON USDT TRC20 VERIFICATION
// ============================================================

async function verifyTronUsdtPayment(
  txHash,
  requiredAmount
) {

  if (
    typeof txHash !== "string" ||
    !/^[a-fA-F0-9]{64}$/.test(txHash)
  ) {

    return {
      verified: false,
      reason:
        "Invalid TRON transaction hash."
    };

  }


  const url =
    `${TRON_API_URL}/v1/accounts/${WALLETS.USDT_TRC20}/transactions/trc20` +
    `?only_confirmed=true` +
    `&limit=200` +
    `&contract_address=${TRON_USDT_CONTRACT}`;


  const headers = {};


  if (TRON_API_KEY) {

    headers["TRON-PRO-API-KEY"] =
      TRON_API_KEY;

  }


  const response =
    await fetch(
      url,
      {
        headers
      }
    );


  if (!response.ok) {

    throw new Error(
      `TRON API request failed: ${response.status}`
    );

  }


  const data =
    await response.json();


  const transactions =
    data.data || [];


  const matchingTransaction =
    transactions.find(
      tx =>
        String(tx.transaction_id)
          .toLowerCase() ===
        txHash.toLowerCase()
    );


  if (!matchingTransaction) {

    return {

      verified: false,

      reason:
        "Confirmed TRON USDT transaction was not found."

    };

  }


  // ----------------------------------------------------------
  // Verify destination
  // ----------------------------------------------------------

  if (
    matchingTransaction.to !==
    WALLETS.USDT_TRC20
  ) {

    return {

      verified: false,

      reason:
        "USDT transaction was not sent to the QKJ Store wallet."

    };

  }


  // ----------------------------------------------------------
  // Verify token contract
  // ----------------------------------------------------------

  if (
    String(
      matchingTransaction.token_info?.address || ""
    ).toLowerCase() !==
    TRON_USDT_CONTRACT.toLowerCase()
  ) {

    return {

      verified: false,

      reason:
        "Transaction does not contain the correct USDT TRC20 token."

    };

  }


  const decimals =
    Number(
      matchingTransaction.token_info?.decimals ??
      TRON_USDT_DECIMALS
    );


  const rawValue =
    Number(
      matchingTransaction.value || 0
    );


  const receivedUsdt =
    rawValue /
    Math.pow(10, decimals);


  // ----------------------------------------------------------
  // Amount check
  // ----------------------------------------------------------

  if (
    receivedUsdt +
    PRICE_TOLERANCE <
    Number(requiredAmount)
  ) {

    return {

      verified: false,

      reason:
        `Insufficient USDT payment. Received ${receivedUsdt}, required ${requiredAmount}.`,

      receivedAmount:
        receivedUsdt,

      requiredAmount:
        Number(requiredAmount)

    };

  }


  return {

    verified: true,

    receivedAmount:
      receivedUsdt,

    requiredAmount:
      Number(requiredAmount),

    transactionHash:
      txHash

  };

}


// ============================================================
// BITCOIN PAYMENT VERIFICATION
// ============================================================

async function verifyBitcoinPayment(
  txHash,
  requiredAmount
) {

  if (
    typeof txHash !== "string" ||
    !/^[a-fA-F0-9]{64}$/.test(txHash)
  ) {

    return {

      verified: false,

      reason:
        "Invalid Bitcoin transaction hash."

    };

  }


  const response =
    await fetch(
      `${BTC_API_URL}/tx/${txHash}`
    );


  if (!response.ok) {

    if (response.status === 404) {

      return {

        verified: false,

        reason:
          "Bitcoin transaction was not found."

      };

    }


    throw new Error(
      `Bitcoin API request failed: ${response.status}`
    );

  }


  const transaction =
    await response.json();


  // ----------------------------------------------------------
  // Require confirmation
  // ----------------------------------------------------------

  if (
    !transaction.status ||
    !transaction.status.confirmed
  ) {

    return {

      verified: false,

      reason:
        "Bitcoin transaction is not confirmed yet."

    };

  }


  let receivedSatoshis = 0;


  // ----------------------------------------------------------
  // Check outputs sent to QKJ BTC wallet
  // ----------------------------------------------------------

  for (
    const output of transaction.vout || []
  ) {

    const addresses =
      output.scriptpubkey_address
        ? [output.scriptpubkey_address]
        : [];


    if (
      addresses.includes(
        WALLETS.BTC
      )
    ) {

      receivedSatoshis +=
        Number(output.value || 0);

    }

  }


  const receivedBtc =
    receivedSatoshis /
    1e8;


  // ----------------------------------------------------------
  // Amount check
  // ----------------------------------------------------------

  if (
    receivedBtc +
    PRICE_TOLERANCE <
    Number(requiredAmount)
  ) {

    return {

      verified: false,

      reason:
        `Insufficient BTC payment. Received ${receivedBtc}, required ${requiredAmount}.`,
receivedAmount:
        receivedBtc,

      requiredAmount:
        Number(requiredAmount)

    };

  }


  return {

    verified: true,

    receivedAmount:
      receivedBtc,

    requiredAmount:
      Number(requiredAmount),

    transactionHash:
      txHash

  };

}


// ============================================================
// DOGECOIN PAYMENT VERIFICATION
// ============================================================

async function verifyDogecoinPayment(
  txHash,
  requiredAmount
) {

  if (
    typeof txHash !== "string" ||
    !/^[a-fA-F0-9]{64}$/.test(txHash)
  ) {

    return {

      verified: false,

      reason:
        "Invalid Dogecoin transaction hash."

    };

  }


  let url =
    `${DOGE_API_URL}/txs/${txHash}`;


  if (BLOCKCYPHER_TOKEN) {

    url +=
      `?token=${encodeURIComponent(
        BLOCKCYPHER_TOKEN
      )}`;

  }


  const response =
    await fetch(url);


  if (!response.ok) {

    if (response.status === 404) {

      return {

        verified: false,

        reason:
          "Dogecoin transaction was not found."

      };

    }


    throw new Error(
      `Dogecoin API request failed: ${response.status}`
    );

  }


  const transaction =
    await response.json();


  // ----------------------------------------------------------
  // Confirmation check
  // ----------------------------------------------------------

  if (
    Number(
      transaction.confirmations || 0
    ) < 1
  ) {

    return {

      verified: false,

      reason:
        "Dogecoin transaction is not confirmed yet."

    };

  }


  let receivedDoge =
    0;


  // ----------------------------------------------------------
  // Check outputs
  // ----------------------------------------------------------

  for (
    const output of
      transaction.outputs || []
  ) {

    const addresses =
      output.addresses || [];


    if (
      addresses.includes(
        WALLETS.DOGE
      )
    ) {

      const value =
        Number(
          output.value || 0
        );


      receivedDoge +=
        value / 1e8;

    }

  }


  // ----------------------------------------------------------
  // Amount check
  // ----------------------------------------------------------

  if (
    receivedDoge +
    PRICE_TOLERANCE <
    Number(requiredAmount)
  ) {

    return {

      verified: false,

      reason:
        `Insufficient DOGE payment. Received ${receivedDoge}, required ${requiredAmount}.`,

      receivedAmount:
        receivedDoge,

      requiredAmount:
        Number(requiredAmount)

    };

  }


  return {

    verified: true,

    receivedAmount:
      receivedDoge,

    requiredAmount:
      Number(requiredAmount),

    transactionHash:
      txHash

  };

}// ============================================================
// PAYMENT VERIFICATION DISPATCHER
// ============================================================

async function verifyPayment(
  currency,
  txHash,
  requiredAmount
) {

  switch (currency) {

    case "ETH":

      return verifyEthereumPayment(
        txHash,
        requiredAmount
      );


    case "BNB":

      return verifyBnbPayment(
        txHash,
        requiredAmount
      );


    case "SOL":

      return verifySolanaPayment(
        txHash,
        requiredAmount
      );


    case "USDT_TRC20":

      return verifyTronUsdtPayment(
        txHash,
        requiredAmount
      );


    case "BTC":

      return verifyBitcoinPayment(
        txHash,
        requiredAmount
      );


    case "DOGE":

      return verifyDogecoinPayment(
        txHash,
        requiredAmount
      );


    default:

      return {

        verified: false,

        reason:
          "Unsupported cryptocurrency."

      };

  }

}


// ============================================================
// PAYMENT QUOTE ENDPOINT
// ============================================================

app.post(
  "/api/payment-quote",
  async (req, res) => {

    try {

      const {
        product_id,
        currency
      } = req.body;


      if (!product_id) {

        return res.status(400).json({

          error:
            "product_id is required."

        });

      }


      if (
        !currency ||
        !WALLETS[currency]
      ) {

        return res.status(400).json({

          error:
            "Unsupported cryptocurrency."

        });

      }


      // --------------------------------------------------------
      // Get product
      // --------------------------------------------------------

      const product =
        await getProductById(
          product_id
        );


      if (!product) {

        return res.status(404).json({

          error:
            "Product not found."

        });

      }


      // --------------------------------------------------------
      // Get live crypto price
      // --------------------------------------------------------

      const quote =
        await calculateCryptoAmount(
          product.price,
          currency
        );


      return res.json({

        success: true,

        product_id:
          product.id,

        product_name:
          product.name,

        usd_price:
          Number(product.price),

        currency,

        crypto_usd_price:
          quote.cryptoUsdPrice,

        crypto_amount:
          quote.required,

        wallet:
          WALLETS[currency],

        network:
          NETWORKS[currency]

      });

    } catch (error) {

      console.error(
        "Payment quote error:",
        error
      );


      return res.status(500).json({

        error:
          "Could not create payment quote.",

        message:
          error.message

      });

    }

  }
);


// ============================================================
// VERIFY PAYMENT ENDPOINT
// ============================================================

app.post(
  "/api/verify-payment",
  async (req, res) => {

    try {

      const {
        product_id,
        currency,
        transaction_hash
      } = req.body;


      // --------------------------------------------------------
      // Validate request
      // --------------------------------------------------------

      if (!product_id) {

        return res.status(400).json({

          verified: false,

          error:
            "product_id is required."

        });

      }


      if (!currency) {

        return res.status(400).json({

          verified: false,

          error:
            "currency is required."

        });

      }


      if (!transaction_hash) {

        return res.status(400).json({

          verified: false,

          error:
            "transaction_hash is required."

        });

      }


      if (!WALLETS[currency]) {

        return res.status(400).json({

          verified: false,

          error:
            "Unsupported cryptocurrency."

        });

      }


      // --------------------------------------------------------
      // Find product
      // --------------------------------------------------------

      const product =
        await getProductById(
          product_id
        );


      if (!product) {

        return res.status(404).json({

          verified: false,

          error:
            "Product not found."

        });

      }


      // --------------------------------------------------------
      // Calculate required crypto amount
      // --------------------------------------------------------

      const quote =
        await calculateCryptoAmount(
          product.price,
          currency
        );


      // --------------------------------------------------------
      // Verify actual blockchain transaction
      // --------------------------------------------------------

      const verification =
        await verifyPayment(

          currency,

          transaction_hash,

          quote.required

        );


      // --------------------------------------------------------
      // Payment failed
      // --------------------------------------------------------

      if (!verification.verified) {

        return res.status(400).json({

          verified: false,

          reason:
            verification.reason ||
            "Payment could not be verified.",

          product_id:
            product.id,

          currency,

          transaction_hash,

          received_amount:
            verification.receivedAmount ??
            null,

          required_amount:
            verification.requiredAmount ??
            quote.required,

          network:
            NETWORKS[currency],

          wallet:
            WALLETS[currency]

        });

      }


      // --------------------------------------------------------
      // Payment verified
      // --------------------------------------------------------

      return res.json({

        verified: true,

        message:
          "Payment verified successfully.",

        product: {

          id:
            product.id,

          name:
            product.name,

          description:
            product.description,

          price:
            product.price

        },

        currency,

        network:
          NETWORKS[currency],

        wallet:
          WALLETS[currency],

        transaction_hash,

        amount_received:
          verification.receivedAmount,

        amount_required:
          quote.required,

        crypto_usd_price:
          quote.cryptoUsdPrice,

        usd_price:
          Number(product.price),

        download_url:
          product.download || null

      });

    } catch (error) {

      console.error(
        "Payment verification error:",
        error
      );


      return res.status(500).json({

        verified: false,

        error:
          "Payment verification failed.",

        message:
          error.message

      });

    }

  }
);


// ============================================================
// 404 HANDLER
// ============================================================

app.use(
  (req, res) => {

    res.status(404).json({

      error:
        "Route not found."

    });

  }
);


// ============================================================
// START SERVER
// ============================================================

app.listen(
  PORT,
  () => {

    console.log(
      `QKJ Store Payment API running on port ${PORT}`
    );


    console.log(
      "Supported currencies:",
      Object.keys(WALLETS).join(", ")
    );

  }
);
     