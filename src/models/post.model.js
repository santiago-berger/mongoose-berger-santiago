import { model, Schema, Types } from "mongoose";

const postSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        // referenciado porque un usuario puede tener una cantidad ilimitada de posts
        // relacion uno a muchos, un usuario tiene muchos posts y cada post tiene un solo autor
        // la referencia se guarda en post y no en user para que el documento del usuario no crezca sin limite
        author: {
            // guarda el id del usuario que escribio el post
            type: Types.ObjectId,
            // indica que el id apunta al modelo user, permite hacer populate del autor
            ref: "User",
            // no se puede crear un post sin autor
            required: true,
        },
        // referenciado porque una misma etiqueta se comparte entre muchos posts
        // relacion muchos a muchos, un post tiene muchas etiquetas y una etiqueta esta en muchos posts
        // la referencia se guarda solo en post porque un post tiene pocas etiquetas y su array no crece sin limite
        tags: [
            {
                // cada elemento del array guarda el id de una etiqueta
                type: Types.ObjectId,
                // indica que los ids apuntan al modelo tag, permite hacer populate de las etiquetas
                ref: "Tag",
            },
        ],
        // eliminacion logica, al eliminar un post se pone en false en lugar de borrarlo
        // tambien se pone en false en cascada cuando se elimina el usuario autor        
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

export const PostModel = model("Post", postSchema);