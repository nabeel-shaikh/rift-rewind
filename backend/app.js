import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config(); //load environment variables from .env file
const app = express();
app.use(cors()); // allow front end requests
app.use(express.json()); // parse incoming JSON data/requests


app.get("/api/test", (req, res) => {
  res.send("Rift Rewind backend working");
});

//start server
const PORT = process.env.PORT || 3000;
app.listen(PORT,()=> console.log("Server running on port "+PORT));
