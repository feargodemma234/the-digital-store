// ============================================================
// QKJ STORE
// COMPLETE CRYPTO PAYMENT VERIFICATION SERVER
//
// Supported:
//   ETH       - Ethereum mainnet
//   BNB       - BNB Smart Chain
//   SOL       - Solana mainnet
//   USDT_TRC20 - USDT on Tron TRC20
//   BTC       - Bitcoin mainnet
//   DOGE      - Dogecoin mainnet
//
// Node.js 18+
// ============================================================

const express = require("express");
const cors = require("cors");

const app = express();


// ============================================================
// SERVER CONFIG
// ============================================================

const PORT =
  process.env.PORT || 10000;


// ============================================================
// STORE CONFIG
// ============================================================

const SHEET_ID =
  "1u9uKN8GeX-1VElXVIdXoNNEsG6xppKGa2gI-PEnDDaI";

const SHEET_NAME =
  "Sheet1";


// ============================================================
// PAYMENT WALLETS
// ============================================================

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


// ============================================================
// BLOCKCHAIN RPC / API CONFIG
// ============================================================

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
  process.env.TRON_API_KEY || "";


// Bitcoin
const BTC_API_URL =
  process.env.BTC_API_URL ||
  "https://blockstream.info/api";


// Dogecoin
const DOGE_API_URL =
  process.env.DOGE_API_URL ||
  "https://api.blockcypher.com/v1/doge/main";

const BLOCKCYPHER_TOKEN =
  process.env.BLOCKCYPHER_TOKEN || "";


// ============================================================
// PAYMENT SETTINGS
// ============================================================

// Number of blockchain confirmations required.
//
// ETH / BNB:
//   2 confirmations
//
// BTC / DOGE:
//   1 confirmation
//
// SOL:
//   confirmed commitment
//
// TRON:
//   confirmed transaction
//

const EVM_MIN_CONFIRMATIONS = 2;

const BTC_MIN_CONFIRMATIONS = 1;

const DOGE_MIN_CONFIRMATIONS = 1;


// Small protection against tiny exchange-rate differences.
//
// Example:
//
// Product = $10
//
// If required amount is 0.005 ETH,
// customer must send at least that amount.
//
// We do NOT accept an underpayment.
//
const PRICE_TOLERANCE = 0.005;


// ============================================================
// TRON USDT CONTRACT
// ============================================================

const TRON_USDT_CONTRACT =
  "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";


// USDT TRC20 uses 6 decimals.
const TRON_USDT_DECIMALS = 6;


// ============================================================
// EXPRESS
// ============================================================

app.use(
  cors({
    origin: "*"
  })
);

app.use(
  express.json({
    limit: "100kb"
  })
);


// ============================================================
// BASIC HEALTH CHECK
// ============================================================

app.get(
  "/",
  (req, res) => {

    res.json({
      ok: true,
      service: "QKJ Store Payment API",
      version: "2.0.0",
      supportedCurrencies: [
        "ETH",
        "BNB",
        "SOL",
        "USDT_TRC20",
        "BTC",
        "DOGE"
      ]
    });

  }
);


// ============================================================
// SIMPLE API HEALTH ENDPOINT
// ============================================================

app.get(
  "/api/health",
  (req, res) => {

    res.json({
      ok: true,
      ethereum: Boolean(ETH_RPC_URL),
      bnb: Boolean(BNB_RPC_URL),
      solana: Boolean(SOL_RPC_URL),
      tron: Boolean(TRON_API_URL),
      bitcoin: Boolean(BTC_API_URL),
      dogecoin: Boolean(DOGE_API_URL)
    });

  }
);


// ============================================================
// GOOGLE SHEETS
// ============================================================

async function getProductsFromSheet() {

  const url =
    "https://docs.google.com/spreadsheets/d/" +
    SHEET_ID +
    "/gviz/tq?tqx=out:json&sheet=" +
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


  const columns =
    data.table.cols.map(
      col =>
        String(
          col.label || ""
        )
          .trim()
          .toLowerCase()
    );


  const rows =
    data.table.rows || [];


  return rows.map(row => {

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


    return normalizeProduct(
      product
    );

  });

}


// ============================================================
// PRODUCT NORMALIZER
// ============================================================

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


// ============================================================
// FIND PRODUCT
// ============================================================

async function findProduct(
  productId
) {

  const products =
    await getProductsFromSheet();


  return products.find(
    product =>
      String(product.id) ===
      String(productId)
  );

}


// ============================================================
// COINGECKO PRICE
// ============================================================

async function getCryptoUsdPrice(
  currency
) {

  // USDT is designed to track USD.
  if (
    currency ===
    "USDT_TRC20"
  ) {

    return 1;

  }


  const coinIds = {

    ETH:
      "ethereum",

    BNB:
      "binancecoin",

    SOL:
      "solana",

    BTC:
      "bitcoin",

    DOGE:
      "dogecoin"

  };


  const coinId =
    coinIds[currency];


  if (!coinId) {

    throw new Error(
      "Unsupported currency."
    );

  }


  const url =
    "https://api.coingecko.com/api/v3/simple/price" +
    "?ids=" +
    encodeURIComponent(coinId) +
    "&vs_currencies=usd";


  const headers = {
    "Accept":
      "application/json"
  };


  // Optional CoinGecko Demo/Pro key.
  if (
    process.env.COINGECKO_API_KEY
  ) {

    headers[
      "x-cg-demo-api-key"
    ] =
      process.env.COINGECKO_API_KEY;

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
      "Could not obtain cryptocurrency price."
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
      "Invalid cryptocurrency price."
    );

  }


  return price;

}


// ============================================================
// CALCULATE REQUIRED CRYPTO
// ============================================================

async function calculateRequiredCrypto(
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


  if (
    !Number.isFinite(required) ||
    required <= 0
  ) {

    throw new Error(
      "Could not calculate payment amount."
    );

  }


  return {

    cryptoUsdPrice,

    required

  };

}


// ============================================================
// HEX → BIGINT
// ============================================================

function hexToBigInt(
  value
) {

  if (
    value === undefined ||
    value === null
  ) {

    return 0n;

  }


  const stringValue =
    String(value);


  if (
    stringValue === ""
  ) {

    return 0n;

  }


  return BigInt(
    stringValue
  );

}


// ============================================================
// WEI → ETH/BNB
// ============================================================

function weiToNumber(
  wei
) {

  return Number(
    wei
  ) / 1e18;

}


// ============================================================
// LAMPORTS → SOL
// ============================================================

function lamportsToSol(
  lamports
) {

  return Number(
    lamports
  ) / 1e9;

}


// ============================================================
// SATOSHIS → BTC
// ============================================================

function satoshisToBtc(
  satoshis
) {

  return Number(
    satoshis
  ) / 1e8;

}


// ============================================================
// KOINU → DOGE
// ============================================================

function koinuToDoge(
  koinu
) {

  return Number(
    koinu
  ) / 1e8;

}


// ============================================================
// GENERIC EVM JSON-RPC
// ============================================================

async function evmRpc(
  rpcUrl,
  method,
  params
) {

  if (!rpcUrl) {

    throw new Error(
      "EVM RPC URL is not configured."
    );

  }


  const response =
    await fetch(
      rpcUrl,
      {

        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({

            jsonrpc:
              "2.0",

            id:
              Date.now(),

            method,

            params

          })

      }
    );


  if (!response.ok) {

    throw new Error(
      `RPC request failed: ${response.status}`
    );

  }


  const data =
    await response.json();


  if (data.error) {

    throw new Error(
      data.error.message ||
      "Blockchain RPC error."
    );

  }


  return data.result;

}


// ============================================================
// EVM PAYMENT VERIFICATION
// ============================================================

async function verifyEvmPayment({
  rpcUrl,
  transactionHash,
  walletAddress,
  requiredAmount,
  networkName
}) {

  const normalizedHash =
    String(
      transactionHash
    )
      .trim()
      .toLowerCase();


  if (
    !/^0x[a-f0-9]{64}$/.test(
      normalizedHash
    )
  ) {

    return {
      verified: false,
      message:
        "Invalid transaction hash."
    };

  }


  // Get transaction.
  const transaction =
    await evmRpc(
      rpcUrl,
      "eth_getTransactionByHash",
      [
        normalizedHash
      ]
    );


  if (!transaction) {

    return {
      verified: false,
      message:
        "Transaction was not found."
    };

  }


  // Get receipt.
  const receipt =
    await evmRpc(
      rpcUrl,
      "eth_getTransactionReceipt",
      [
        normalizedHash
      ]
    );


  if (!receipt) {

    return {
      verified: false,
      message:
        "Transaction is not confirmed yet."
    };

  }


  // Transaction must have succeeded.
  if (
    receipt.status !==
    "0x1"
  ) {

    return {
      verified: false,
      message:
        "Transaction failed on the blockchain."
    };

  }


  // Payment must go directly to our wallet.
  if (
    String(
      transaction.to || ""
    ).toLowerCase() !==
    walletAddress.toLowerCase()
  ) {

    return {
      verified: false,
      message:
        "Transaction was not sent to the QKJ Store wallet."
    };

  }


  const actualAmount =
    weiToNumber(
      hexToBigInt(
        transaction.value
      )
    );


  const minimumAccepted =
    requiredAmount *
    (1 - PRICE_TOLERANCE);


  if (
    actualAmount <
    minimumAccepted
  ) {

    return {
      verified: false,
      message:
        "Payment amount is too low.",
      required:
        requiredAmount,
      received:
        actualAmount
    };

  }


  // Get current block.
  const currentBlockHex =
    await evmRpc(
      rpcUrl,
      "eth_blockNumber",
      []
    );


  const currentBlock =
    Number(
      hexToBigInt(
        currentBlockHex
      )
    );


  const transactionBlock =
    Number(
      hexToBigInt(
        receipt.blockNumber
      )
    );


  const confirmations =
    currentBlock -
    transactionBlock +
    1;


  if (
    confirmations <
    EVM_MIN_CONFIRMATIONS
  ) {

    return {
      verified: false,
      message:
        `Waiting for more confirmations. ` +
        `Current confirmations: ${confirmations}.`,
      confirmations
    };

  }


  return {

    verified: true,

    network:
      networkName,

    transactionHash:
      normalizedHash,

    amount:
      actualAmount,

    confirmations

  };

}


// ============================================================
// ETH VERIFICATION
// ============================================================

async function verifyEthereum(
  transactionHash,
  requiredAmount
) {

  return verifyEvmPayment({

    rpcUrl:
      ETH_RPC_URL,

    transactionHash,

    walletAddress:
      WALLETS.ETH,

    requiredAmount,

    networkName:
      "Ethereum"

  });

}


// ============================================================
// BNB VERIFICATION
// ============================================================

async function verifyBnb(
  transactionHash,
  requiredAmount
) {

  return verifyEvmPayment({

    rpcUrl:
      BNB_RPC_URL,

    transactionHash,

    walletAddress:
      WALLETS.BNB,

    requiredAmount,

    networkName:
      "BNB Smart Chain"

  });

}


// ============================================================
// SOLANA RPC
// ============================================================

async function solanaRpc(
  method,
  params
) {

  const response =
    await fetch(
      SOL_RPC_URL,
      {

        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({

            jsonrpc:
              "2.0",

            id:
              Date.now(),

            method,

            params

          })

      }
    );


  if (!response.ok) {

    throw new Error(
      "Solana RPC request failed."
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


  return data.result;

}


// ============================================================
// SOLANA PAYMENT VERIFICATION
// ============================================================

async function verifySolanaPayment(
  transactionHash,
  requiredAmount
) {

  const signature =
    String(
      transactionHash
    ).trim();


  if (
    !/^[1-9A-HJ-NP-Za-km-z]{32,100}$/.test(
      signature
    )
  ) {

    return {
      verified: false,
      message:
        "Invalid Solana transaction signature."
    };

  }


  const result =
    await solanaRpc(
      "getTransaction",
      [
        signature,
        {
          commitment:
            "confirmed",

          encoding:
            "jsonParsed",

          maxSupportedTransactionVersion:
            0

        }
      ]
    );


  if (!result) {

    return {
      verified: false,
      message:
        "Solana transaction was not found or is not confirmed."
    };

  }


  if (
    result.meta &&
    result.meta.err
  ) {

    return {
      verified: false,
      message:
        "Solana transaction failed."
    };

  }


  let totalLamports =
    0;


  const instructions =
    [];


  if (
    result.transaction &&
    result.transaction.message &&
    Array.isArray(
      result.transaction.message.instructions
    )
  ) {

    instructions.push(
      ...result.transaction.message.instructions
    );

  }


  if (
    result.meta &&
    Array.isArray(
      result.meta.innerInstructions
    )
  ) {

    for (
      const inner
      of result.meta.innerInstructions
    ) {

      if (
        Array.isArray(
          inner.instructions
        )
      ) {

        instructions.push(
          ...inner.instructions
        );

      }

    }

  }


  for (
    const instruction
    of instructions
  ) {

    const parsed =
      instruction?.parsed;


    if (
      !parsed ||
      parsed.type !==
        "transfer"
    ) {

      continue;

    }


    const info =
      parsed.info;


    if (
      !info ||
      !info.destination
    ) {

      continue;

    }


    if (
      info.destination !==
      WALLETS.SOL
    ) {

      continue;

    }


    const lamports =
      Number(
        info.lamports || 0
      );


    if (
      Number.isFinite(
        lamports
      )
    ) {

      totalLamports +=
        lamports;

    }

  }


  const actualAmount =
    lamportsToSol(
      totalLamports
    );


  const minimumAccepted =
    requiredAmount *
    (1 - PRICE_TOLERANCE);


  if (
    actualAmount <
    minimumAccepted
  ) {

    return {
      verified: false,
      message:
        "Solana payment amount is too low.",
      required:
        requiredAmount,
      received:
        actualAmount
    };

  }


  return {

    verified: true,

    network:
      "Solana",

    transactionHash:
      signature,

    amount:
      actualAmount,

    slot:
      result.slot

  };

}


// ============================================================
// TRON API HEADERS
// ============================================================

function tronHeaders() {

  const headers = {
    "Accept":
      "application/json"
  };


  if (
    TRON_API_KEY
  ) {

    headers[
      "TRON-PRO-API-KEY"
    ] =
      TRON_API_KEY;

  }


  return headers;

}


// ============================================================
// TRON USDT VERIFICATION
// ============================================================

async function verifyTronUsdtPayment(
  transactionHash,
  requiredAmount
) {

  const hash =
    String(
      transactionHash
    ).trim();


  if (
    !/^[a-fA-F0-9]{64}$/.test(
      hash
    )
  ) {

    return {
      verified: false,
      message:
        "Invalid TRON transaction hash."
    };

  }


  const url =
    TRON_API_URL +
    "/v1/accounts/" +
    encodeURIComponent(
      WALLETS.USDT_TRC20
    ) +
    "/transactions/trc20" +
    "?only_confirmed=true" +
    "&limit=200" +
    "&contract_address=" +
    encodeURIComponent(
      TRON_USDT_CONTRACT
    );


  const response =
    await fetch(
      url,
      {
        headers:
          tronHeaders()
      }
    );


  if (!response.ok) {

    throw new Error(
      `TronGrid request failed: ${response.status}`
    );

  }


  const data =
    await response.json();


  const transactions =
    Array.isArray(
      data.data
    )
      ? data.data
      : [];


  const normalizedHash =
    hash.toLowerCase();


    const payment =
    transactions.find(
      transaction => {

        const txId =
          String(
            transaction.transaction_id ||
            ""
          ).toLowerCase();

        const recipient =
          String(
            transaction.to ||
            ""
          ).toLowerCase();

        const contract =
          String(
            transaction.token_info?.address ||
            transaction.contract_address ||
            ""
          ).toLowerCase();

        return (
          txId === normalizedHash &&
          recipient ===
            WALLETS.USDT_TRC20.toLowerCase() &&
          contract ===
            TRON_USDT_CONTRACT.toLowerCase()
        );

      }
    );


  if (!payment) {

    return {
      verified: false,

      message:
        "Confirmed USDT TRC20 transfer was not found for the QKJ wallet."
    };

  }


  const decimals =
    Number(
      payment.token_info?.decimals ??
      TRON_USDT_DECIMALS
    );


  const rawValue =
    Number(
      payment.value || 0
    );


  const actualAmount =
    rawValue /
    Math.pow(
      10,
      decimals
    );


  const minimumAccepted =
    requiredAmount *
    (1 - PRICE_TOLERANCE);


  if (
    actualAmount <
    minimumAccepted
  ) {

    return {
      verified: false,

      message:
        "USDT payment amount is too low.",

      required:
        requiredAmount,

      received:
        actualAmount
    };

  }


  return {

    verified: true,

    network:
      "Tron TRC20",

    transactionHash:
      hash,

    amount:
      actualAmount

  };

}


// ============================================================
// BITCOIN VERIFICATION
// ============================================================

async function verifyBitcoinPayment(
  transactionHash,
  requiredAmount
) {

  const hash =
    String(
      transactionHash
    ).trim();


  if (
    !/^[a-fA-F0-9]{64}$/.test(
      hash
    )
  ) {

    return {
      verified: false,

      message:
        "Invalid Bitcoin transaction ID."
    };

  }


  const txResponse =
    await fetch(
      BTC_API_URL +
      "/tx/" +
      hash
    );


  if (!txResponse.ok) {

    if (
      txResponse.status ===
      404
    ) {

      return {
        verified: false,

        message:
          "Bitcoin transaction was not found."
      };

    }


    throw new Error(
      `Bitcoin API error: ${txResponse.status}`
    );

  }


  const tx =
    await txResponse.json();


  if (
    !tx ||
    !tx.status
  ) {

    return {
      verified: false,

      message:
        "Invalid Bitcoin transaction response."
    };

  }


  if (
    tx.status.confirmed !==
    true
  ) {

    return {
      verified: false,

      message:
        "Bitcoin transaction is not confirmed yet."
    };

  }


  const outputs =
    Array.isArray(
      tx.vout
    )
      ? tx.vout
      : [];


  let receivedSatoshis =
    0;


  for (
    const output
    of outputs
  ) {

    if (
      output.scriptpubkey_address ===
      WALLETS.BTC
    ) {

      receivedSatoshis +=
        Number(
          output.value || 0
        );

    }

  }


  const actualAmount =
    satoshisToBtc(
      receivedSatoshis
    );


  const minimumAccepted =
    requiredAmount *
    (1 - PRICE_TOLERANCE);


  if (
    actualAmount <
    minimumAccepted
  ) {

    return {
      verified: false,

      message:
        "Bitcoin payment amount is too low.",

      required:
        requiredAmount,

      received:
        actualAmount
    };

  }


  return {

    verified: true,

    network:
      "Bitcoin",

    transactionHash:
      hash,

    amount:
      actualAmount,

    blockHeight:
      tx.status.block_height

  };

}


// ============================================================
// DOGECOIN VERIFICATION
// ============================================================

async function verifyDogecoinPayment(
  transactionHash,
  requiredAmount
) {

  const hash =
    String(
      transactionHash
    ).trim();


  if (
    !/^[a-fA-F0-9]{64}$/.test(
      hash
    )
  ) {

    return {
      verified: false,

      message:
        "Invalid Dogecoin transaction ID."
    };

  }


  let url =
    DOGE_API_URL +
    "/txs/" +
    hash;


  if (
    BLOCKCYPHER_TOKEN
  ) {

    url +=
      "?token=" +
      encodeURIComponent(
        BLOCKCYPHER_TOKEN
      );

  }


  const response =
    await fetch(url);


  if (!response.ok) {

    if (
      response.status ===
      404
    ) {

      return {
        verified: false,

        message:
          "Dogecoin transaction was not found."
      };

    }


    throw new Error(
      `Dogecoin API error: ${response.status}`
    );

  }


  const tx =
    await response.json();


  if (!tx) {

    return {
      verified: false,

      message:
        "Invalid Dogecoin transaction."
    };

  }


  const confirmations =
    Number(
      tx.confirmations || 0
    );


  if (
    confirmations <
    DOGE_MIN_CONFIRMATIONS
  ) {

    return {
      verified: false,

      message:
        "Dogecoin transaction is not confirmed yet.",

      confirmations
    };

  }


  const outputs =
    Array.isArray(
      tx.outputs
    )
      ? tx.outputs
      : [];


  let receivedKoinu =
    0;


  for (
    const output
    of outputs
  ) {

    const addresses =
      Array.isArray(
        output.addresses
      )
        ? output.addresses
        : [];


    if (
      addresses.includes(
        WALLETS.DOGE
      )
    ) {

      receivedKoinu +=
        Number(
          output.value || 0
        );

    }

  }


  const actualAmount =
    koinuToDoge(
      receivedKoinu
    );


  const minimumAccepted =
    requiredAmount *
    (1 - PRICE_TOLERANCE);


  if (
    actualAmount <
    minimumAccepted
  ) {

    return {
      verified: false,

      message:
        "Dogecoin payment amount is too low.",

      required:
        requiredAmount,

      received:
        actualAmount
    };

  }


  return {

    verified: true,

    network:
      "Dogecoin",

    transactionHash:
      hash,

    amount:
      actualAmount,

    confirmations

  };

}


// ============================================================
// PAYMENT VERIFICATION DISPATCHER
// ============================================================

async function verifyPayment({
  currency,
  transactionHash,
  product
}) {

  const quote =
    await calculateRequiredCrypto(
      product.price,
      currency
    );


  let result;


  switch (
    currency
  ) {

    case "ETH":

      result =
        await verifyEthereum(
          transactionHash,
          quote.required
        );

      break;


    case "BNB":

      result =
        await verifyBnb(
          transactionHash,
          quote.required
        );

      break;


    case "SOL":

      result =
        await verifySolanaPayment(
          transactionHash,
          quote.required
        );

      break;


    case "USDT_TRC20":

      result =
        await verifyTronUsdtPayment(
          transactionHash,
          quote.required
        );

      break;


    case "BTC":

      result =
        await verifyBitcoinPayment(
          transactionHash,
          quote.required
        );

      break;


    case "DOGE":

      result =
        await verifyDogecoinPayment(
          transactionHash,
          quote.required
        );

      break;


    default:

      return {
        verified: false,

        message:
          "Unsupported cryptocurrency."
      };

  }


  return {

    ...result,

    currency,

    productId:
      product.id,

    productName:
      product.name,

    productPriceUsd:
      product.price,

    quotedCryptoUsdPrice:
      quote.cryptoUsdPrice,

    requiredCryptoAmount:
      quote.required

  };

}


// ============================================================
// PAYMENT VERIFICATION ENDPOINT
// ============================================================

app.post(
  "/api/verify-payment",

  async (req, res) => {

    try {

      const {
        product_id,
        currency,
        transaction_hash
      } =
        req.body || {};


      if (
        !product_id
      ) {

        return res.status(400).json({

          verified: false,

          message:
            "Product ID is required."

        });

      }


      if (
        !currency
      ) {

        return res.status(400).json({

          verified: false,

          message:
            "Currency is required."

        });

      }


      if (
        !transaction_hash
      ) {

        return res.status(400).json({

          verified: false,

          message:
            "Transaction hash is required."

        });

      }


      const allowedCurrencies = [

        "ETH",

        "BNB",

        "SOL",

        "USDT_TRC20",

        "BTC",

        "DOGE"

      ];


      if (
        !allowedCurrencies.includes(
          currency
        )
      ) {

        return res.status(400).json({

          verified: false,

          message:
            "Unsupported cryptocurrency."

        });

      }


      const product =
        await findProduct(
          product_id
        );


      if (!product) {

        return res.status(404).json({

          verified: false,

          message:
            "Product was not found."

        });

      }


      if (
        !Number.isFinite(
          product.price
        ) ||
        product.price <= 0
      ) {

        return res.status(400).json({

          verified: false,

          message:
            "Product has an invalid price."

        });

      }


      const result =
        await verifyPayment({

          currency,

          transactionHash:
            transaction_hash,

          product

        });


      if (
        result.verified !== true
      ) {

        return res.status(400).json(
          result
        );

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
          currency,

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

        download_url:
          product.download || null

      });

    } catch (error) {

      console.error(
        "PAYMENT VERIFICATION ERROR:",
        error
      );


      return res.status(500).json({

        verified: false,

        message:
          "Payment verification service temporarily unavailable."

      });

    }

  }
);


// ============================================================
// PAYMENT QUOTE
// ============================================================

app.get(
  "/api/payment-quote",

  async (req, res) => {

    try {

      const productId =
        req.query.product_id;

      const currency =
        req.query.currency;


      if (
        !productId ||
        !currency
      ) {

        return res.status(400).json({

          ok: false,

          message:
            "product_id and currency are required."

        });

      }


      const allowedCurrencies = [

        "ETH",

        "BNB",

        "SOL",

        "USDT_TRC20",

        "BTC",

        "DOGE"

      ];


      if (
        !allowedCurrencies.includes(
          currency
        )
      ) {

        return res.status(400).json({

          ok: false,

          message:
            "Unsupported cryptocurrency."

        });

      }


      const product =
        await findProduct(
          productId
        );


      if (!product) {

        return res.status(404).json({

          ok: false,

          message:
            "Product not found."

        });

      }


      const quote =
        await calculateRequiredCrypto(
          product.price,
          currency
        );


      return res.json({

        ok: true,

        productId:
          product.id,

        currency,

        usdPrice:
          product.price,

        cryptoUsdPrice:
          quote.cryptoUsdPrice,

        cryptoAmount:
          quote.required

      });

    } catch (error) {
  console.error("Payment quote error:", error);

  res.status(500).json({
    ok: false,
    message:
      error && error.message
        ? error.message
        : "Unable to calculate payment quote."
  });

  }
);


// ============================================================
// 404
// ============================================================

app.use(
  (req, res) => {

    res.status(404).json({

      ok: false,

      message:
        "Endpoint not found."

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
      `QKJ Payment API running on port ${PORT}`
    );


    console.log(
      "Supported currencies:",

      [
        "ETH",
        "BNB",
        "SOL",
        "USDT_TRC20",
        "BTC",
        "DOGE"

      ].join(", ")

    );

  }
);