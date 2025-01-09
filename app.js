require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_API_KEY);
const express = require("express");
const cors = require("cors");

const app = express();

// Configuração do CORS e headers adicionais
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

// URL de confirmação do pagamento
const PAYMENT_CONFIRMATION_URL = `${process.env.FRONT_END_URL}/payment-confirmation`;

app.post("/create-checkout-session", async (req, res) => {
  try {
    console.log(req.body);

    // Validação dos produtos enviados
    if (!req.body || !Array.isArray(req.body.products)) {
      return res.status(400).send({ error: "Invalid request format." });
    }

    const items = req.body.products.map((product) => {
      if (!product.name || !product.price || !product.quantity) {
        throw new Error("Product must have name, price, and quantity.");
      }

      return {
        price_data: {
          currency: "brl",
          product_data: {
            name: product.name,
          },
          unit_amount: parseInt(`${product.price}00`),
        },
        quantity: product.quantity,
      };
    });

    // Criação da sessão do Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      line_items: items,
      mode: "payment",
      success_url: `${PAYMENT_CONFIRMATION_URL}?success=true`,
      cancel_url: `${PAYMENT_CONFIRMATION_URL}?canceled=true`,
    });

    res.send({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error.message);
    res.status(500).send({ error: "Failed to create checkout session." });
  }
});

// Iniciando o servidor
const PORT = 5000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
