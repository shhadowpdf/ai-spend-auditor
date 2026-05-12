import express from "express";
import cors from "cors";
import {ENV} from "./utils/ENV.js";
import toolRoutes from "./routes/tool.routes.js";
import publicRoutes from "./routes/public.routes.js";
const PORT = ENV.PORT;


const app = express();
app.set("trust proxy", true);
app.use(cors({
    origin: "*",
}));

app.use(express.json());

app.get("/api/health", (req, res) => {
    res.status(200).send({message: "Hey from backend"})
});

app.use("/api/tools", toolRoutes);
app.use("/",publicRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
