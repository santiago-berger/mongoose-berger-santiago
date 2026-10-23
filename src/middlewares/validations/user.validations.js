import { body, param } from "express-validator";
import { UserModel } from "../../models/user.model.js";

// cada validacion es una cadena de metodos que se ejecutan en orden sobre un mismo campo
// bail corta la cadena si hubo un error antes, asi no se ejecutan las validaciones siguientes de ese campo
// trim es un sanitizador, no valida si no que quita los espacios del principio y del final del valor
// custom permite crear una validacion propia, si se lanza un error con throw la validacion falla
// los errores los junta validationResult en el middleware validate y responde con 400
// solo los campos validados en estos arrays llegan al controlador a traves de matchedData

// validacion del id que llega por parametro, se reutiliza en buscar por id, actualizar y eliminar
export const userIdValidation = [
    param("id")
        // verifica que el id tenga el formato de un objectid de mongodb
        .isMongoId().withMessage("El id debe ser un ObjectId válido")
        .bail()
        // verifica que el usuario exista y que este activo
        .custom(async (id) => {
            const user = await UserModel.findOne({ _id: id, isActive: true });
            if (!user) throw new Error("El usuario no existe");
        }),
];

// validaciones para crear un usuario, todos los campos son obligatorios
export const createUserValidation = [
    body("username")
        .trim()
        .notEmpty().withMessage("El username es obligatorio")
        .bail()
        .isString().withMessage("El username debe ser un texto")
        .isLength({ min: 3, max: 20 }).withMessage("El username debe tener entre 3 y 20 caracteres")
        .bail()
        // evita duplicados, busca si ya existe un usuario con ese username
        .custom(async (username) => {
            const user = await UserModel.findOne({ username });
            if (user) throw new Error("El username ya está en uso");
        }),
    body("email")
        .trim()
        .notEmpty().withMessage("El email es obligatorio")
        .bail()
        .isEmail().withMessage("El email no es válido")
        .bail()
        // evita duplicados, busca si ya existe un usuario con ese email
        .custom(async (email) => {
            const user = await UserModel.findOne({ email });
            if (user) throw new Error("El email ya está registrado");
        }),
    body("password")
        .notEmpty().withMessage("La contraseña es obligatoria")
        .bail()
        .isString().withMessage("La contraseña debe ser un texto")
        .isLength({ min: 6, max: 50 }).withMessage("La contraseña debe tener entre 6 y 50 caracteres"),

    // validaciones de la propiedad embebida
    // se valida que addresses sea un array con al menos un elemento
    body("addresses")
        .isArray({ min: 1 }).withMessage("addresses debe ser un array con al menos una dirección"),
    // el asterisco recorre cada elemento del array y valida su campo
    body("addresses.*.street")
        .trim()
        .notEmpty().withMessage("La calle es obligatoria")
        .isLength({ max: 100 }).withMessage("La calle no puede superar 100 caracteres"),
    body("addresses.*.city")
        .trim()
        .notEmpty().withMessage("La ciudad es obligatoria")
        .isLength({ max: 50 }).withMessage("La ciudad no puede superar 50 caracteres"),
    body("addresses.*.country")
        .trim()
        .notEmpty().withMessage("El país es obligatorio")
        .isLength({ max: 50 }).withMessage("El país no puede superar 50 caracteres"),
];

// validaciones para actualizar un usuario, todos los campos son opcionales porque se puede actualizar solo uno
export const updateUserValidation = [
    // el spread ... copia las validaciones del id dentro de este array, asi se valida el id y el body en la misma ruta
    ...userIdValidation,
    body("username")
        .optional()
        .trim()
        .notEmpty().withMessage("El username no puede estar vacío")
        .bail()
        .isLength({ min: 3, max: 20 }).withMessage("El username debe tener entre 3 y 20 caracteres")
        .bail()
        // evita duplicados pero excluyendo al propio usuario que se esta actualizando
        // ne significa distinto de, busca otro usuario con ese username cuyo id sea distinto al del parametro
        // sin esto, si el usuario manda su mismo username daria error de duplicado contra si mismo
        .custom(async (username, { req }) => {
            const user = await UserModel.findOne({
                username,
                _id: { $ne: req.params.id },
            });
            if (user) throw new Error("El username ya está en uso");
        }),
    body("email")
        .optional()
        .trim()
        .isEmail().withMessage("El email no es válido")
        .bail()
        // evita duplicados excluyendo al propio usuario
        .custom(async (email, { req }) => {
            const user = await UserModel.findOne({
                email,
                _id: { $ne: req.params.id },
            });
            if (user) throw new Error("El email ya está registrado");
        }),
    body("password")
        .optional()
        .isString()
        .isLength({ min: 6, max: 50 }).withMessage("La contraseña debe tener entre 6 y 50 caracteres"),
    // si se manda addresses debe ser un array con al menos una direccion
    body("addresses")
        .optional()
        .isArray({ min: 1 }).withMessage("addresses debe ser un array con al menos una dirección"),
    // no necesitan optional porque si no se manda addresses el comodin no encuentra elementos y no valida nada
    body("addresses.*.street")
        .trim()
        .notEmpty().withMessage("La calle es obligatoria"),
    body("addresses.*.city")
        .trim()
        .notEmpty().withMessage("La ciudad es obligatoria"),
    body("addresses.*.country")
        .trim()
        .notEmpty().withMessage("El país es obligatorio"),
];