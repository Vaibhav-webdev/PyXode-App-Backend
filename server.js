import express from "express";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();

app.use(express.json());

// connect database
connectDB();

// normal routes
app.get('/', (req, res) => {
  res.send("<h2>Page Not Found!!</h2>")
})
app.use("/api", userRoutes);

server.listen(process.env.PORT, () => {
  console.log(`Server running on localhost:${process.env.PORT}`);
});