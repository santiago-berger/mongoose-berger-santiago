import { body, param } from "express-validator";
import { ProfileModel } from "../../models/profile.model.js";
import { UserModel } from "../../models/user.model.js";

// validacion del id del perfil que llega por parametro, se reutiliza en buscar por id, actualizar y eliminar
export const profileIdValidation = [
    param("id")
        .isMongoId().withMessage("El id debe ser un ObjectId válido")
        .bail()
        // verifica que el perfil exista y que no haya sido eliminado de forma logica
        .custom(async (id) => {
            const profile = await ProfileModel.findOne({ _id: id, isActive: true });
            if (!profile) throw new Error("El perfil no existe");
        }),
];

// validaciones para crear un perfil
export const createProfileValidation = [
    body("bio")
        .trim()
        .notEmpty().withMessage("La bio es obligatoria")
        .bail()
        .isString().withMessage("La bio debe ser un texto")
        .isLength({ min: 5, max: 200 }).withMessage("La bio debe tener entre 5 y 200 caracteres"),
    body("phone")
        .trim()
        .notEmpty().withMessage("El teléfono es obligatorio")
        .bail()
        .isString().withMessage("El teléfono debe ser un texto")
        .isLength({ min: 7, max: 15 }).withMessage("El teléfono debe tener entre 7 y 15 caracteres"),
    // validacion de la referencia que llega en el body, es el id del usuario dueño del perfil
    body("user")
        .notEmpty().withMessage("El usuario es obligatorio")
        .bail()
        .isMongoId().withMessage("El usuario debe ser un ObjectId válido")
        .bail()
        .custom(async (userId) => {
            // verifica que el usuario referenciado exista y este activo, asi no se crea un perfil para un usuario inexistente
            const user = await UserModel.findOne({ _id: userId, isActive: true });
            if (!user) throw new Error("El usuario no existe");
            // garantiza la relacion uno a uno, si el usuario ya tiene un perfil no se puede crear otro
            const profile = await ProfileModel.findOne({ user: userId });
            if (profile) throw new Error("Ese usuario ya tiene un perfil");
        }),
];

// validaciones para actualizar un perfil
// el campo user no se puede cambiar
export const updateProfileValidation = [
    ...profileIdValidation,
    body("bio")
        .optional()
        .trim()
        .isString().withMessage("La bio debe ser un texto")
        .isLength({ min: 5, max: 200 }).withMessage("La bio debe tener entre 5 y 200 caracteres"),
    body("phone")
        .optional()
        .trim()
        .isString().withMessage("El teléfono debe ser un texto")
        .isLength({ min: 7, max: 15 }).withMessage("El teléfono debe tener entre 7 y 15 caracteres"),
];