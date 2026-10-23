import { matchedData } from "express-validator";
import { ProfileModel } from "../models/profile.model.js";

// controlador para crear un perfil
export const createProfile = async (req, res) => {
    try {
        // se obtienen los campos validados bio, phone y user
        // la validacion ya verifico que el usuario exista, este activo y no tenga otro perfil, garantizando la relacion uno a uno
        const data = matchedData(req);

        // se crea el perfil guardando en el campo user la referencia al usuario dueño
        const newProfile = await ProfileModel.create(data);

        return res.status(201).json({
            msg: "Perfil creado correctamente",
            data: newProfile,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Error interno del servidor",
        });
    }
};

// controlador para obtener todos los perfiles activos
export const getAllProfiles = async (req, res) => {
    try {
        // se filtra por isActive en true para excluir los perfiles eliminados de forma logica
        // populate directo, a diferencia del populate virtual de user
        // profile si guarda la referencia en su campo user, por lo que mongoose toma ese id y lo reemplaza por el documento del usuario
        // el segundo argumento indica que solo se traigan los campos username y email del usuario
        const profiles = await ProfileModel.find({ isActive: true }).populate(
            "user",
            "username email",
        );

        return res.status(200).json({
            data: profiles,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Error interno del servidor",
        });
    }
};

// controlador para obtener un perfil por su id
export const getProfileById = async (req, res) => {
    try {
        // el id se obtiene desde matchedData porque fue validado como parametro de ruta
        const { id } = matchedData(req);

        // no es necesario filtrar por isActive porque la validacion del id ya verifico que el perfil exista y este activo
        // se aplica el mismo populate directo para mostrar los datos del usuario dueño del perfil
        const profile = await ProfileModel.findById(id).populate(
            "user",
            "username email",
        );

        return res.status(200).json({
            data: profile,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Error interno del servidor",
        });
    }
};

// controlador para actualizar un perfil
export const updateProfile = async (req, res) => {
    try {
        const { id } = req.params;
        // se obtienen solo los datos validados del cuerpo, sin incluir el id del parametro
        // como user no se valida en la actualizacion, matchedData lo descarta y el dueño del perfil no puede modificarse
        const data = matchedData(req, { locations: ["body"] });

        // se aplican los cambios y returnDocument after devuelve el documento ya actualizado
        const updatedProfile = await ProfileModel.findByIdAndUpdate(id, data, {
            returnDocument: "after",
        });

        return res.status(200).json({
            msg: "Perfil actualizado correctamente",
            data: updatedProfile,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Error interno del servidor",
        });
    }
};

// controlador para eliminar un perfil de forma logica
export const deleteProfile = async (req, res) => {
    try {
        const { id } = matchedData(req);

        // eliminacion logica, el perfil no se borra de la base de datos sino que se marca isActive en false
        // no requiere cascada porque ningun otro documento depende del perfil
        // el usuario no guarda referencia al perfil, y el virtual profile de user ya filtra por isActive, por lo que deja de mostrarlo
        await ProfileModel.findByIdAndUpdate(id, { isActive: false });

        return res.status(200).json({
            msg: "Perfil eliminado correctamente",
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Error interno del servidor",
        });
    }
};