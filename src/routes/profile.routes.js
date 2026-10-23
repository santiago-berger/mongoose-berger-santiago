import { Router } from "express";
import {
    createProfile,
    deleteProfile,
    getAllProfiles,
    getProfileById,
    updateProfile,
} from "../controllers/profile.controller.js";
import {
    createProfileValidation,
    profileIdValidation,
    updateProfileValidation,
} from "../middlewares/validations/profile.validations.js";
import { validate } from "../middlewares/validate.js";

export const profileRouter = Router();

profileRouter.post("/profiles", createProfileValidation, validate, createProfile);
profileRouter.get("/profiles", getAllProfiles);
profileRouter.get("/profiles/:id", profileIdValidation, validate, getProfileById);
profileRouter.put("/profiles/:id", updateProfileValidation, validate, updateProfile);
profileRouter.delete("/profiles/:id", profileIdValidation, validate, deleteProfile);