import { Router } from "express";
import {
    createUser,
    deleteUser,
    getAllUsers,
    getUserById,
    updateUser,
} from "../controllers/user.controller.js";
import {
    createUserValidation,
    updateUserValidation,
    userIdValidation,
} from "../middlewares/validations/user.validations.js";
import { validate } from "../middlewares/validate.js";

export const userRouter = Router();

userRouter.post("/users", createUserValidation, validate, createUser);
userRouter.get("/users", getAllUsers);
userRouter.get("/users/:id", userIdValidation, validate, getUserById);
userRouter.put("/users/:id", updateUserValidation, validate, updateUser);
userRouter.delete("/users/:id", userIdValidation, validate, deleteUser);