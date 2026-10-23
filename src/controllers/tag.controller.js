import { matchedData } from "express-validator";
import { TagModel } from "../models/tag.model.js";
// postmodel se importa para aplicar la eliminacion en cascada, quitando la etiqueta de los posts que la tengan asignada
import { PostModel } from "../models/post.model.js";

// controlador para crear una etiqueta
export const createTag = async (req, res) => {
    try {
        // se obtiene el campo name validado, la validacion ya verifico que no exista otra etiqueta con el mismo nombre
        const data = matchedData(req);

        const newTag = await TagModel.create(data);

        return res.status(201).json({
            msg: "Etiqueta creada correctamente",
            data: newTag,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Error interno del servidor",
        });
    }
};

// controlador para obtener todas las etiquetas
export const getAllTags = async (req, res) => {
    try {
        // no se filtra por isActive porque tag utiliza eliminacion fisica, todas las etiquetas guardadas existen
        // populate virtual de la relacion muchos a muchos, tag no guarda referencias a los posts
        // mongoose busca en la coleccion posts los documentos cuyo array tags contenga el id de cada etiqueta
        // el virtual tiene un filtro que solo trae los posts activos, y el segundo argumento indica que solo se traiga el campo title
        const tags = await TagModel.find().populate("posts", "title");

        return res.status(200).json({
            data: tags,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Error interno del servidor",
        });
    }
};

// controlador para obtener una etiqueta por su id
export const getTagById = async (req, res) => {
    try {
        // el id se obtiene desde matchedData porque fue validado como parametro de ruta
        const { id } = matchedData(req);

        // se aplica el mismo populate virtual para mostrar los posts que tienen asignada esta etiqueta
        const tag = await TagModel.findById(id).populate("posts", "title");

        return res.status(200).json({
            data: tag,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Error interno del servidor",
        });
    }
};

// controlador para actualizar una etiqueta
export const updateTag = async (req, res) => {
    try {
        const { id } = req.params;
        // se obtienen solo los datos validados del cuerpo, sin incluir el id del parametro
        const data = matchedData(req, { locations: ["body"] });

        // al cambiar el nombre no es necesario modificar los posts
        // los posts solo guardan el id de la etiqueta, por lo que al hacer populate ya muestran el nombre actualizado
        const updatedTag = await TagModel.findByIdAndUpdate(id, data, {
            returnDocument: "after",
        });

        return res.status(200).json({
            msg: "Etiqueta actualizada correctamente",
            data: updatedTag,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Error interno del servidor",
        });
    }
};

// controlador para eliminar una etiqueta de forma fisica y en cascada
export const deleteTag = async (req, res) => {
    try {
        const { id } = matchedData(req);

        // eliminacion en cascada sobre la relacion muchos a muchos
        // updateMany busca todos los posts cuyo array tags contenga el id de la etiqueta
        // el operador pull saca ese id del array tags de cada post encontrado
        // se ejecuta antes de borrar la etiqueta para que no queden posts con referencias a un documento inexistente
        await PostModel.updateMany({ tags: id }, { $pull: { tags: id } });
        // eliminacion fisica, el documento se borra definitivamente de la coleccion tags
        // findByIdAndDelete devuelve el documento eliminado, que se incluye en la respuesta
        const deletedTag = await TagModel.findByIdAndDelete(id);

        return res.status(200).json({
            msg: "Etiqueta eliminada correctamente y quitada de los posts",
            data: deletedTag,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Error interno del servidor",
        });
    }
};