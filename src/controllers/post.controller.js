import { matchedData } from "express-validator";
import { PostModel } from "../models/post.model.js";

// controlador para crear un post
export const createPost = async (req, res) => {
    try {
        // se obtienen los campos validados title, content, author y opcionalmente tags
        // la validacion ya verifico que el autor exista y este activo, y que cada etiqueta enviada exista
        const data = matchedData(req);

        // se crea el post guardando en author la referencia al usuario y en tags el array de referencias a las etiquetas
        const newPost = await PostModel.create(data);

        return res.status(201).json({
            msg: "Post creado correctamente",
            data: newPost,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Error interno del servidor",
        });
    }
};

// controlador para obtener todos los posts activos
export const getAllPosts = async (req, res) => {
    try {
        // se filtra por isActive en true para excluir los posts eliminados de forma logica
        // esto incluye los posts desactivados en cascada al eliminar a su autor
        const posts = await PostModel.find({ isActive: true })
            // populate directo de la relacion uno a muchos
            // post guarda el id del usuario en author, mongoose lo reemplaza por el documento del usuario
            // se traen solo username y email, y el signo menos delante de id indica que ese campo se excluye
            .populate("author", "username email -_id")
            // populate directo de la relacion muchos a muchos
            // tags es un array de ids, mongoose reemplaza cada id por el documento de la etiqueta y solo trae el campo name
            .populate("tags", "name");

        return res.status(200).json({
            data: posts,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Error interno del servidor",
        });
    }
};

// controlador para obtener un post por su id
export const getPostById = async (req, res) => {
    try {
        // el id se obtiene desde matchedData porque fue validado como parametro de ruta
        const { id } = matchedData(req);

        // no es necesario filtrar por isActive porque la validacion del id ya verifico que el post exista y este activo
        // se aplican los mismos populate para mostrar el autor y las etiquetas del post
        const post = await PostModel.findById(id)
            .populate("author", "username email -_id")
            .populate("tags", "name");

        return res.status(200).json({
            data: post,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Error interno del servidor",
        });
    }
};

// controlador para actualizar un post
export const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        // se obtienen solo los datos validados del cuerpo, sin incluir el id del parametro
        // solo se validan title y content, por lo que author y tags se descartan aunque se envien
        // el autor no puede modificarse y las etiquetas se agregan unicamente desde el endpoint de vinculo
        const data = matchedData(req, { locations: ["body"] });

        // se aplican los cambios y returnDocument after devuelve el documento ya actualizado
        const updatedPost = await PostModel.findByIdAndUpdate(id, data, {
            returnDocument: "after",
        });

        return res.status(200).json({
            msg: "Post actualizado correctamente",
            data: updatedPost,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Error interno del servidor",
        });
    }
};

// controlador para eliminar un post de forma logica
export const deletePost = async (req, res) => {
    try {
        const { id } = matchedData(req);

        // eliminacion logica, el post no se borra de la base de datos sino que se marca isActive en false
        // no requiere cascada porque ningun otro documento guarda referencias al post
        // los virtuals posts de user y de tag filtran por isActive, por lo que el post deja de aparecer en ambos
        await PostModel.findByIdAndUpdate(id, { isActive: false });

        return res.status(200).json({
            msg: "Post eliminado correctamente",
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Error interno del servidor",
        });
    }
};

// controlador del endpoint que agrega un nuevo vinculo en la relacion muchos a muchos entre post y tag
export const addTagToPost = async (req, res) => {
    try {
        // ambos ids se obtienen desde matchedData porque fueron validados como parametros de ruta
        // la validacion ya verifico que el post y la etiqueta existan y que el vinculo no este duplicado
        const { postId, tagId } = matchedData(req);

        // el operador addToSet agrega el id de la etiqueta al array tags solo si todavia no esta en el array
        // a diferencia de push, que lo agregaria aunque ya exista, addToSet funciona como una segunda proteccion contra duplicados
        // returnDocument after devuelve el post ya actualizado y populate reemplaza los ids de tags por el nombre de cada etiqueta
        const updatedPost = await PostModel.findByIdAndUpdate(
            postId,
            { $addToSet: { tags: tagId } },
            { returnDocument: "after" },
        ).populate("tags", "name");

        return res.status(200).json({
            msg: "Etiqueta agregada al post correctamente",
            data: updatedPost,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Error interno del servidor",
        });
    }
};