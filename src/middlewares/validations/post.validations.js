import { body, param } from "express-validator";
import { PostModel } from "../../models/post.model.js";
import { UserModel } from "../../models/user.model.js";
import { TagModel } from "../../models/tag.model.js";

// validacion del identificador del post recibido como parametro de ruta
// se reutiliza en las rutas de busqueda por id, actualizacion y eliminacion
export const postIdValidation = [
    param("id")
        .isMongoId().withMessage("El id debe ser un ObjectId válido")
        .bail()
        // se verifica que el post exista y que no haya sido eliminado de forma logica
        // un post con isActive en false se considera inexistente para la api
        .custom(async (id) => {
            const post = await PostModel.findOne({ _id: id, isActive: true });
            if (!post) throw new Error("El post no existe");
        }),
];

// validaciones para la creacion de un post
export const createPostValidation = [
    body("title")
        .trim()
        .notEmpty().withMessage("El título es obligatorio")
        .bail()
        .isString().withMessage("El título debe ser un texto")
        .isLength({ min: 3, max: 100 }).withMessage("El título debe tener entre 3 y 100 caracteres"),
    body("content")
        .trim()
        .notEmpty().withMessage("El contenido es obligatorio")
        .bail()
        .isString().withMessage("El contenido debe ser un texto")
        .isLength({ min: 10, max: 2000 }).withMessage("El contenido debe tener entre 10 y 2000 caracteres"),
    body("author")
        .notEmpty().withMessage("El autor es obligatorio")
        .bail()
        .isMongoId().withMessage("El autor debe ser un ObjectId válido")
        .bail()
        // se verifica que el usuario referenciado exista y se encuentre activo
        // impide que un post quede asociado a un usuario inexistente o eliminado de forma logica
        .custom(async (author) => {
            const user = await UserModel.findOne({ _id: author, isActive: true });
            if (!user) throw new Error("El autor no existe");
        }),
    body("tags")
        .optional()
        .isArray().withMessage("tags debe ser un array"),
    body("tags.*")
        .isMongoId().withMessage("Cada etiqueta debe ser un ObjectId válido")
        .bail()
        .custom(async (tagId) => {
            const tag = await TagModel.findById(tagId);
            if (!tag) throw new Error(`La etiqueta ${tagId} no existe`);
        }),
];

// validaciones para la actualizacion de un post
// se incorpora la validacion del id mediante el operador spread y todos los campos del cuerpo son opcionales
// como el controlador utiliza matchedData, solo recibe los campos validados, por lo que author y tags se ignoran aunque se envien
// el autor de un post no puede modificarse y las etiquetas se gestionan exclusivamente desde el endpoint de vinculo muchos a muchos
export const updatePostValidation = [
    ...postIdValidation,
    body("title")
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 }).withMessage("El título debe tener entre 3 y 100 caracteres"),
    body("content")
        .optional()
        .trim()
        .isLength({ min: 10, max: 2000 }).withMessage("El contenido debe tener entre 10 y 2000 caracteres"),
];

// validaciones del endpoint que agrega un nuevo vinculo en la relacion muchos a muchos entre post y tag
// ambos identificadores se reciben como parametros de ruta
export const addTagToPostValidation = [
    param("postId")
        .isMongoId().withMessage("El id del post debe ser un ObjectId válido")
        .bail()
        .custom(async (postId) => {
            // se verifica que el post exista y se encuentre activo
            const post = await PostModel.findOne({ _id: postId, isActive: true });
            if (!post) throw new Error("El post no existe");
        }),
    param("tagId")
        .isMongoId().withMessage("El id de la etiqueta debe ser un ObjectId válido")
        .bail()
        // el segundo parametro de custom da acceso a req, lo que permite leer el postId de la misma ruta
        .custom(async (tagId, { req }) => {
            // se verifica que la etiqueta exista
            const tag = await TagModel.findById(tagId);
            if (!tag) throw new Error("La etiqueta no existe");
            // se verifica que el vinculo no exista previamente
            // al consultar tags con un unico id, mongodb busca si ese id se encuentra entre los elementos del array
            // si se encuentra un post con ese id y esa etiqueta, el vinculo ya existe y se rechaza la peticion con codigo 400
            const post = await PostModel.findOne({
                _id: req.params.postId,
                tags: tagId,
            });
            if (post) throw new Error("El post ya tiene esa etiqueta");
        }),
];