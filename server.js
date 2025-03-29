const express = require("express");
const { reserveCal } = require("./Reserve");

const app = express();
const port = 3000;

// Endpoint for reserve calculation
app.get("/api/cpi-rcpi", async (req, res) => {
    try {
        const data = await reserveCal();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch reserve data" });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
