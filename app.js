require("dotenv").config();

const express = require("express");
const { randomUUID } = require("crypto");
const { SquareClient, SquareEnvironment } = require("square");
const cors = require("cors");
const https = require("https");
const fs = require("fs");

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

const { payments } = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN_PRODUCTION,
    environment: SquareEnvironment.Production,
});

const privateKey = fs.readFileSync(
    "/etc/letsencrypt/live/luxurytoysrepair.tech/privkey.pem",
    "utf8"
);
const certificate = fs.readFileSync(
    "/etc/letsencrypt/live/luxurytoysrepair.tech/fullchain.pem",
    "utf8"
);
const credentials = { key: privateKey, cert: certificate };

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.post("/pay", async (req, res) => {
    const { token, price } = req.body;
    try {
        const payment = await payments.create({
            idempotencyKey: randomUUID(),
            sourceId: token,
            amountMoney: {
                currency: "USD",
                amount: BigInt(price),
            },
        });
        const replacer = (key, value) =>
            typeof value === "bigint" ? value.toString() : value;

        res.json(JSON.parse(JSON.stringify(payment, replacer)));
    } catch (error) {
        console.error("Payment submission failed:", error);
        res.status(500).json({ error: error.message });
    }
});

https.createServer(credentials, app).listen(port, "0.0.0.0", () => {
    console.log(`Servidor HTTPS escuchando en el puerto ${port}`);
});
