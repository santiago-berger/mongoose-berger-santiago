import { model, Schema } from "mongoose";

const tagSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: { virtuals: true },
    },
);

// populate virtual muchos a muchos, una etiqueta esta en muchos posts
// tag no guarda los posts si no que mongoose busca en post los documentos cuyo array tags contenga el id de esta etiqueta
// se crea un campo virtual llamado posts dentro del esquema de tag
tagSchema.virtual("posts", {
    // en que modelo buscar los documentos relacionados
    ref: "Post",
    // que campo de tag se usa para comparar
    localField: "_id",
    // que campo de post tiene que contener ese id
    foreignField: "tags",
    // filtro que solo trae los posts activos e ignora los eliminados de forma logica
    match: { isActive: true },
});

export const TagModel = model("Tag", tagSchema);