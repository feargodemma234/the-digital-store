const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const WALLETS = {
  SOL: "3wSMFEkjRyD7eWu9sTrtiKrBcRPDsNBCu9X4xm4tenbf",

  DOGE: "DTPkSQ9omnxgh7kFL8jUnc6KVR7JqsBWqf",

  USDT_TRC20: "TF29vt78UY8XHx5bk19W3u1b33JcZbUcaE",

  BNB: "0x00c07014Ef8a60eC2E95ee559b58590dd18F89A7",

  ETH: "0x00c07014Ef8a60eC2E95ee559b58590dd18F89A7",

  BTC: "bc1qdr3k3p09kjey0cdlijhrkeqjvx2ane6ujzz6xy"
};

// Home
app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "QKJ Payment API"
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

// Payment verification endpoint
app.post("/api/verify-payment", async (req, res) => {
  try {
    const {
      product_id,
      currency,
      transaction_hash
    } = req.body;

    // Check required information
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

    // Supported currencies
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

    // Get the receiving wallet
    const receivingWallet = WALLETS[currency];

    console.log("Payment verification request:");
    console.log({
      product_id,
      currency,
      transaction_hash,
      receivingWallet
    });

    // Blockchain verification will be added next.
    return res.json({
      success: false,
      verified: false,
      message: "Blockchain verification has not been enabled yet."
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

// Start server
const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`QKJ Payment API running on port ${PORT}`);
});