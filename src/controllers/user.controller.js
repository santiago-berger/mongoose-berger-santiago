import { matchedData } from "express-validator";
import { UserModel } from "../models/user.model.js";
import { PostModel } from "../models/post.model.js";
import { ProfileModel } from "../models/profile.model.js";

// controlador para crear un usuario
export const createUser = async (req, res) => {
    try {
        // se obtienen solo los campos validados del cuerpo de la peticion
        // cualquier campo extra que envie el cliente no llega a la base de datos
        const data = matchedData(req);

        // create inserta un nuevo documento en la coleccion users, incluyendo el array embebido addresses
        const newUser = await UserModel.create(data);

        // create no permite usar select, por eso se convierte el documento a objeto y se separa la contraseña del resto de los datos
        // password queda en una variable aparte que no se usa, y user contiene todos los campos excepto la contraseña
        const { password, ...user } = newUser.toJSON();

        return res.status(201).json({
            msg: "Usuario creado correctamente",
            data: user,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Error interno del servidor",
        });
    }
};

// controlador para obtener todos los usuarios activos
export const getAllUsers = async (req, res) => {
    try {
        // se filtra por isActive en true para excluir los usuarios eliminados de forma logica
        const users = await UserModel.find({ isActive: true })
            // el signo menos excluye el campo password de la respuesta para no exponer la contraseña
            .select("-password")
            // populate virtual de la relacion uno a muchos, user no guarda sus posts
            // mongoose busca en la coleccion posts los documentos cuyo autor coincide con el id de cada usuario
            // el segundo argumento indica que solo se traiga el campo title de cada post
            .populate("posts", "title")
            // populate virtual de la relacion uno a uno, trae el perfil cuyo campo user coincide con el id del usuario
            // solo se traen los campos bio y phone
            .populate("profile", "bio phone");

        // se responde con codigo 200 porque la consulta fue exitosa
        return res.status(200).json({
            data: users,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Error interno del servidor",
        });
    }
};

// controlador para obtener un usuario por su id
export const getUserById = async (req, res) => {
    try {
        // se obtiene el id desde matchedData porque fue validado como parametro de ruta
        const { id } = matchedData(req);

        // no es necesario filtrar por isActive porque la validacion del id ya verifico que el usuario exista y este activo
        const user = await UserModel.findById(id)
            .select("-password")
            .populate("posts", "title")
            .populate("profile", "bio phone");

        return res.status(200).json({
            data: user,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Error interno del servidor",
        });
    }
};

// controlador para actualizar un usuario
export const updateUser = async (req, res) => {
    try {
        // el id se toma de los parametros de la ruta
        const { id } = req.params;
        // se indica locations body para obtener solo los datos validados del cuerpo
        // sin esta opcion matchedData tambien incluiria el id del parametro dentro de los datos a actualizar
        // como los campos del update son opcionales, solo se actualizan los que el cliente envio
        const data = matchedData(req, { locations: ["body"] });

        // findByIdAndUpdate busca el documento por id y aplica los cambios
        // returnDocument after hace que se devuelva el documento ya actualizado y no la version anterior
        const updatedUser = await UserModel.findByIdAndUpdate(id, data, {
            returnDocument: "after",
        }).select("-password");

        return res.status(200).json({
            msg: "Usuario actualizado correctamente",
            data: updatedUser,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Error interno del servidor",
        });
    }
};

// controlador para eliminar un usuario de forma logica y en cascada
export const deleteUser = async (req, res) => {
    try {
        const { id } = matchedData(req);

        // eliminacion logica, el documento no se borra de la base de datos sino que se marca isActive en false
        // de esta forma los datos se conservan y pueden recuperarse si fuera necesario
        await UserModel.findByIdAndUpdate(id, { isActive: false });

        // eliminacion en cascada sobre la relacion uno a muchos
        // updateMany desactiva todos los posts cuyo author sea el usuario eliminado
        await PostModel.updateMany({ author: id }, { isActive: false });

        // eliminacion en cascada sobre la relacion uno a uno
        // updateOne desactiva el perfil cuyo campo user sea el usuario eliminado
        await ProfileModel.updateOne({ user: id }, { isActive: false });
        // la cascada evita que queden posts y perfiles activos asociados a un usuario que ya no existe para la api

        return res.status(200).json({
            msg: "Usuario eliminado correctamente junto con sus posts y su perfil",
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Error interno del servidor",
        });
    }
};