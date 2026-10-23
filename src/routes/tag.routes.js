import { Router } from "express";
import {
    createTag,
    deleteTag,
    getAllTags,
    getTagById,
    updateTag,
} from "../controllers/tag.controller.js";
import {
    createTagValidation,
    tagIdValidation,
    updateTagValidation,
} from "../middlewares/validations/tag.validations.js";
import { validate } from "../middlewares/validate.js";

export const tagRouter = Router();

tagRouter.post("/tags", createTagValidation, validate, createTag);
tagRouter.get("/tags", getAllTags);
tagRouter.get("/tags/:id", tagIdValidation, validate, getTagById);
tagRouter.put("/tags/:id", updateTagValidation, validate, updateTag);
tagRouter.delete("/tags/:id", tagIdValidation, validate, deleteTag);