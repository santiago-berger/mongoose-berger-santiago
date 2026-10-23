import { model, Schema, Types } from "mongoose";

const profileSchema = new Schema(
    {
        bio: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        // referenciado porque el perfil depende del usuario
        // relacion uno a uno, un usuario tiene un solo perfil
        user: {
            // guarda el id del usuario al que pertenece el perfil
            type: Types.ObjectId,
            // indica que el id apunta al modelo user, permite hacer populate
            ref: "User",
            // no se puede crear un perfil sin usuario
            required: true,
            // no puede haber dos perfiles con el mismo usuario
            unique: true,
        },
        // eliminacion logica
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

export const ProfileModel = model("Profile", profileSchema);