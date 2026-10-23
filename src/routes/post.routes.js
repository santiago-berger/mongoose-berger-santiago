import { Router } from "express";
import {
    addTagToPost,
    createPost,
    deletePost,
    getAllPosts,
    getPostById,
    updatePost,
} from "../controllers/post.controller.js";
import {
    addTagToPostValidation,
    createPostValidation,
    postIdValidation,
    updatePostValidation,
} from "../middlewares/validations/post.validations.js";
import { validate } from "../middlewares/validate.js";

export const postRouter = Router();

postRouter.post("/posts", createPostValidation, validate, createPost);
postRouter.get("/posts", getAllPosts);
postRouter.get("/posts/:id", postIdValidation, validate, getPostById);
postRouter.put("/posts/:id", updatePostValidation, validate, updatePost);
postRouter.delete("/posts/:id", postIdValidation, validate, deletePost);
postRouter.post("/posts/:postId/tags/:tagId", addTagToPostValidation, validate, addTagToPost);