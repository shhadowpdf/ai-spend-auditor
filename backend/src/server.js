import express from "express";
import cors from "cors";
import "dotenv/config";
import toolRoutes from "./routes/tool.routes.js";
const PORT = process.env.PORT;


const app = express();
app.use(cors({
    origin: "*",
}));

app.use(express.json());

app.get("/api/health", (req, res) => {
    res.status(200).send({message: "Hey from backend"})
});

app.use("/api/tools", toolRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});