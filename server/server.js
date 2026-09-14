const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const WALLETS = {
  BNB: "0x00c07014Ef8a60eC2E95ee559b58590dd18F89A7",
  ETH: "0x00c07014Ef8a60eC2E95ee559b58590dd18F89A7",

  SOL: "3wSMFEkjRyD7eWu9sTrtiKrBcRPDsNBCu9X4xm4tenbf",
  DOGE: "DTPkSQ9omnxgh7kFL8jUnc6KVR7JqsBWqf",
  USDT_TRC20: "TF29vt78UY8XHx5bk19W3u1b33JcZbUcaE",
  BTC: "bc1qdr3k3p09kjey0cdlijhrkeqjvx2ane6ujzz6xy"
};

const RPC_URLS = {
  ETH: process.env.ETH_RPC_URL,
  BNB: process.env.BNB_RPC_URL
};

function sameAddress(a, b) {
  return String(a || "").toLowerCase() === String(b || "").toLowerCase();
}

function hexToBigInt(hex) {
  return BigInt(hex);
}

async function rpcRequest(rpcUrl, method, params) {
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
    throw new Error(`RPC request failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || "Blockchain RPC error");
  }

  return data.result;
}

async function verifyEvmTransaction(currency, transactionHash) {
  const rpcUrl = RPC_URLS[currency];

  if (!rpcUrl) {
    return {
      verified: false,
      message: `${currency} RPC is not configured.`
    };
  }

  const transaction = await rpcRequest(
    rpcUrl,
    "eth_getTransactionByHash",
    [transactionHash]
  );

  if (!transaction) {
    return {
      verified: false,
      message: "Transaction was not found on the blockchain."
    };
  }

  const expectedWallet = WALLETS[currency];

  if (!sameAddress(transaction.to, expectedWallet)) {
    return {
      verified: false,
      message: "Transaction was not sent to the QKJ Store wallet."
    };
  }

  const receipt = await rpcRequest(
    rpcUrl,
    "eth_getTransactionReceipt",
    [transactionHash]
  );

  if (!receipt) {
    return {
      verified: false,
      message: "Transaction has not been confirmed yet."
    };
  }

  if (receipt.status !== "0x1") {
    return {
      verified: false,
      message: "Transaction failed on the blockchain."
    };
  }

  const amountWei = hexToBigInt(transaction.value);

  if (amountWei <= 0n) {
    return {
      verified: false,
      message: "Transaction contains no native cryptocurrency payment."
    };
  }

  return {
    verified: true,
    message: `${currency} payment transaction verified.`,
    transaction_hash: transactionHash,
    currency,
    receiving_wallet: expectedWallet,
    amount_base_units: amountWei.toString(),
    block_number: parseInt(transaction.blockNumber, 16)
  };
}

// Home
app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "QKJ Payment API"
  });
});

// Health
app.get("/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

// Verify payment
app.post("/api/verify-payment", async (req, res) => {
  try {
    const {
      product_id,
      currency,
      transaction_hash
    } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "Product ID is required."
      });
    }

    if (!currency) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "Currency is required."
      });
    }

    if (!transaction_hash) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "Transaction hash is required."
      });
    }

    const supportedCurrencies = [
      "ETH",
      "BNB",
      "SOL",
      "BTC",
      "DOGE",
      "USDT_TRC20"
    ];

    if (!supportedCurrencies.includes(currency)) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "Unsupported cryptocurrency."
      });
    }

    // Real verification for ETH and BNB
    if (currency === "ETH" || currency === "BNB") {
      const result = await verifyEvmTransaction(
        currency,
        transaction_hash
      );

      return res.json({
        success: result.verified,
        ...result,
        product_id
      });
    }

    // Other currencies will be added next.
    return res.json({
      success: false,
      verified: false,
      message: `${currency} blockchain verification has not been enabled yet.`,
      product_id
    });

  } catch (error) {
    console.error("Verification error:", error);

    return res.status(500).json({
      success: false,
      verified: false,
      message: "Server error while verifying payment."
    });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`QKJ Payment API running on port ${PORT}`);
});