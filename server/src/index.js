// server/src/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const riotRoutes = require("./routes/riot.routes.js");      // add .js (optional but safe)
const summaryRoutes = require("./routes/summary.routes.js"); // add .js
const { errorHandler } = require("./middleware/error.js");

const PORT = process.env.PORT || 4000; // fallback

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

app.get("/api/test", (_req, res) => res.json({ message: "API is working!" }));

app.use("/api/riot", riotRoutes);
app.use("/api/summary", summaryRoutes);

// must be after routes
app.use(errorHandler);

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
