import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import "dotenv/config";
import { startDB } from "./src/config/database.js";
import { userRouter } from "./src/routes/user.routes.js";
import { profileRouter } from "./src/routes/profile.routes.js";
import { tagRouter } from "./src/routes/tag.routes.js";
import { postRouter } from "./src/routes/post.routes.js";

const app = express();
const PORT = process.env.PORT || 3003;

//middlewares
// convierte el cuerpo de las peticiones que llegan en formato json a un objeto accesible en req.body
app.use(express.json());
// lee las cookies que envia el cliente en cada peticion y las deja disponibles en req.cookies
app.use(cookieParser());
// habilita cors, que permite que un frontend alojado en otro dominio o puerto pueda hacer peticiones a esta api
// sin cors el navegador bloquea las peticiones que vienen de un origen distinto al del servidor
app.use(cors());

//rutas
app.use("/api", userRouter);
app.use("/api", profileRouter);
app.use("/api", tagRouter);
app.use("/api", postRouter);

app.listen(PORT, async () => {
  await startDB();
  console.log(`Servidor listo en el puerto ${PORT}`);
});