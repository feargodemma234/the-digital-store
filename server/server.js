const express = require("express");

const app = express();

app.use(express.json());

/* ================================
   YOUR PAYMENT WALLETS
================================ */

const WALLETS = {
  USDT:
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


/* ================================
   BASIC ROUTES
================================ */

app.get("/", (req, res) => {

  res.json({
    status: "online",
    service: "QKJ Payment API"
  });

});


app.get("/health", (req, res) => {

  res.json({
    status: "ok"
  });

});


/* ================================
   PAYMENT VERIFICATION ENDPOINT
================================ */

app.post("/api/verify-payment", async (req, res) => {

  try {

    const {
      product_id,
      product_name,
      price_usd,
      currency,
      transaction_hash
    } = req.body;


    /* ----------------------------
       CHECK REQUIRED DATA
    ---------------------------- */

    if (!product_id) {

      return res.status(400).json({
        success: false,
        message: "Product ID is required."
      });

    }


    if (!currency) {

      return res.status(400).json({
        success: false,
        message: "Payment currency is required."
      });

    }


    if (!transaction_hash) {

      return res.status(400).json({
        success: false,
        message: "Transaction hash is required."
      });

    }


    /* ----------------------------
       CHECK CURRENCY
    ---------------------------- */

    if (!WALLETS[currency]) {

      return res.status(400).json({
        success: false,
        message: "Unsupported payment currency."
      });

    }


    console.log("Payment verification request:", {
      product_id,
      product_name,
      price_usd,
      currency,
      transaction_hash
    });


    /*
      TEMPORARY RESPONSE

      We will replace this with
      real blockchain verification
      next.
    */

    return res.json({

      success: false,

      verified: false,

      message:
        "Blockchain verification has not been enabled yet."

    });


  } catch (error) {

    console.error(
      "Verification error:",
      error
    );


    return res.status(500).json({

      success: false,

      verified: false,

      message:
        "Payment verification failed."

    });

  }

});


/* ================================
   START SERVER
================================ */

const PORT =
  process.env.PORT || 10000;


app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `QKJ Payment API running on port ${PORT}`
    );

  }
);