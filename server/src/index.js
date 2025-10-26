require("dotenv").config();
const express = require("express");
const cors = require("cors");
const homeRoutes = require("./routes/home.routes");
const PORT = process.env.PORT;

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

app.use("/api", homeRoutes); // <— mounted under /api
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
