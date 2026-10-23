import { body, param } from "express-validator";
import { TagModel } from "../../models/tag.model.js";

// validacion del id de la etiqueta que llega por parametro, se reutiliza en buscar por id, actualizar y eliminar
export const tagIdValidation = [
    param("id")
        .isMongoId().withMessage("El id debe ser un ObjectId válido")
        .bail()
        // verifica que la etiqueta exista
        // se usa findById sin filtrar por isActive porque tag no tiene eliminacion logica
        // cuando se elimina una etiqueta se borra de forma fisica, entonces si no esta en la base es porque no existe
        .custom(async (id) => {
        const tag = await TagModel.findById(id);
            if (!tag) throw new Error("La etiqueta no existe");
        }),
];

// validaciones para crear una etiqueta
export const createTagValidation = [
    body("name")
        .trim()
        .notEmpty().withMessage("El nombre es obligatorio")
        .bail()
        .isString().withMessage("El nombre debe ser un texto")
        .isLength({ min: 2, max: 30 }).withMessage("El nombre debe tener entre 2 y 30 caracteres")
        .bail()
        // evita etiquetas duplicadas, si ya existe una con ese nombre no se crea otra
        .custom(async (name) => {
        const tag = await TagModel.findOne({ name });
            if (tag) throw new Error("Ya existe una etiqueta con ese nombre");
        }),
];

// validaciones para actualizar una etiqueta
export const updateTagValidation = [
    ...tagIdValidation,
    body("name")
        .optional()
        .trim()
        .notEmpty().withMessage("El nombre no puede estar vacío")
        .bail()
        .isLength({ min: 2, max: 30 }).withMessage("El nombre debe tener entre 2 y 30 caracteres")
        .bail()
        // evita duplicados excluyendo a la propia etiqueta que se esta actualizando
        // busca otra etiqueta con ese nombre cuyo id sea distinto al del parametro
        .custom(async (name, { req }) => {
        const tag = await TagModel.findOne({ name, _id: { $ne: req.params.id } });
            if (tag) throw new Error("Ya existe una etiqueta con ese nombre");
        }),
];