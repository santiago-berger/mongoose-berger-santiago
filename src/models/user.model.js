import { model, Schema } from "mongoose";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        // propiedad embebida
        addresses: [
            {
                _id: false,
                street: {
                    type: String,
                    required: true,
                },
                city: {
                    type: String,
                    required: true,
                },
                country: {
                    type: String,
                    required: true,
                },
            },
        ],
        // eliminacion logica
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        // quita el campo __v que mongoose usa para el control de versiones
        versionKey: false,
        // hace que los virtuals posts y profile aparezcan en la respuesta, porque res.json convierte el documento con toJSON y por defecto solo incluye los campos guardados en la base de datos
        toJSON: { virtuals: true },
    },
);

// populate() permite hacer referencia a documentos en otras colecciones
// la poblacion es el proceso de reemplazar automaticamente las rutas especificadas en un documento con documentos de otras colecciones

// en populate (referencia directa) el documento de origen contiene el identificador (ObjectId) del documento destino
// al ejecutar populate mongoose realiza una segunda consulta para sustituir ese id con el documento completo
// la direccion de la consulta es desde el documento que tiene la clave foranea hacia el documento al que apunta esa clave

// un populate inverso o virtual populate (referencia virtual) se ejecuta desde el documento que no posee ninguna referencia guardada
// mongoose busca en la otra coleccion que documentos contienen el id del documento actual

// user no guarda sus posts ni su perfil, son post y profile los que guardan el id del usuario

// virtual es un campo que no se guarda en la base de datos, mongoose lo arma al momento de la consulta

// populate virtual uno a muchos, un usuario tiene muchos posts
// se crea un campo virtual llamado posts dentro del esquema de user
userSchema.virtual("posts", { 
    // en que modelo buscar los documentos relacionados
    ref: "Post",
    // que campo de user se usa para comparar
    localField: "_id",
    // que campo de post tiene que coincidir con ese id, referencia que post guarda hacia user
    foreignField: "author",
    // filtro que solo trae los posts activos e ignora los eliminados de forma logica
    match: { isActive: true },
});

// populate virtual uno a uno, un usuario tiene un solo perfil
// se crea un campo virtual llamado profile dentro del esquema de user
userSchema.virtual("profile", {
    ref: "Profile",
    localField: "_id",
    // referencia que profile guarda hacia user
    foreignField: "user",
    // define que forma tiene el resultado del populate virtual, que puede ser como array o objeto
    // hace que se devuelva como objeto
    // si el usuario no tiene perfil devuelve null
    justOne: true,
    match: { isActive: true },
});

export const UserModel = model("User", userSchema);