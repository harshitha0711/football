const Score = require("./models/score");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/football")
  .then(() => {})
  .catch((err) => {});

app.get("/", (req, res) => {
  res.send("API Running");
});

app.get("/max-score", async (req, res) => {
  try {
    const bestRecord = await Score.findOne().sort({ score: -1 }).lean();
    res.json({ score: bestRecord ? bestRecord.score : 0 });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/score", async (req, res) => {
  try {
    const { score } = req.body;
    if (typeof score !== "number" || score < 0) {
      return res.status(400).json({ error: "Invalid score" });
    }

    const updatedScore = new Score({ score });
    await updatedScore.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(5000, () => {});