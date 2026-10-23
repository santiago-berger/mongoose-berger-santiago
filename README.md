### Materia: Taller de Programación II

### Profesores: Centurión Agustín, Britos Diego, Franco Marcos

### Alumno: Berger Santiago Christian

# Práctica de MongoDB y Mongoose

API REST desarrollada con Express, Mongoose y express-validator.

## Colecciones

Tiene cuatro colecciones: users, profiles, posts y tags.

- User: username, email, password, addresses e isActive.
- Profile: bio, phone, user e isActive.
- Post: title, content, author, tags e isActive.
- Tag: name.

## Relaciones

### Propiedad embebida: addresses en User

Las direcciones se guardan dentro del documento del usuario como un array de subdocumentos.

Se eligió embebido porque las direcciones solo tienen sentido dentro del usuario, no se consultan por separado, no se comparten con otros usuarios y son pocas. Al estar embebidas se obtienen en la misma consulta del usuario, sin necesidad de populate.

### Relación 1:1: User y Profile

Un usuario tiene un solo perfil. La referencia se guarda en el campo user de Profile, con unique: true.

Se eligió referenciado porque el perfil se crea, edita y elimina por separado del usuario. La referencia se guarda en Profile porque el perfil depende del usuario y no al revés: un usuario puede existir sin perfil, pero un perfil no tiene sentido sin usuario. El unique: true garantiza que un usuario no pueda tener dos perfiles.

### Relación 1:N: User y Post

Un usuario puede tener muchos posts y cada post tiene un solo autor. La referencia se guarda en el campo author de Post.

Se eligió referenciado porque un usuario puede escribir una cantidad ilimitada de posts. Si se embebieran en el usuario, el documento crecería sin límite (el máximo de un documento es 16MB) y los posts no podrían consultarse por separado.

### Relación N:M: Post y Tag

Un post puede tener muchas etiquetas y una etiqueta puede estar en muchos posts. La referencia se guarda en el array tags de Post.

Se eligió referenciado porque una misma etiqueta se comparte entre muchos posts. Si se embebiera, al cambiar el nombre de una etiqueta habría que modificar todos los posts que la tienen. Con referencias, la etiqueta existe una sola vez. La referencia se guarda en Post porque un post tiene pocas etiquetas, mientras que una etiqueta puede estar en una cantidad ilimitada de posts.

## Endpoints

### Users

- POST /api/users: crear un usuario.
- GET /api/users: listar los usuarios activos con sus posts y su perfil.
- GET /api/users/:id: obtener un usuario por id.
- PUT /api/users/:id: actualizar un usuario.
- DELETE /api/users/:id: eliminar un usuario de forma lógica y en cascada.

### Profiles

- POST /api/profiles: crear un perfil.
- GET /api/profiles: listar los perfiles activos con su usuario.
- GET /api/profiles/:id: obtener un perfil por id.
- PUT /api/profiles/:id: actualizar un perfil.
- DELETE /api/profiles/:id: eliminar un perfil de forma lógica.

### Posts

- POST /api/posts: crear un post.
- GET /api/posts: listar los posts activos con su autor y sus etiquetas.
- GET /api/posts/:id: obtener un post por id.
- PUT /api/posts/:id: actualizar un post.
- DELETE /api/posts/:id`: eliminar un post de forma lógica.
- POST /api/posts/:postId/tags/:tagId: agregar una etiqueta a un post (relación N:M).

### Tags

- POST /api/tags: crear una etiqueta.
- GET /api/tags: listar las etiquetas con sus posts.
- GET /api/tags/:id: obtener una etiqueta por id.
- PUT /api/tags/:id: actualizar una etiqueta.
- DELETE /api/tags/:id: eliminar una etiqueta de forma física y en cascada.

## Investigación

### 1. ¿Cómo se utiliza el populate desde las colecciones que no tienen referencias?

User no guarda referencias a sus posts ni a su perfil, y Tag no guarda referencias a sus posts. Las referencias están guardadas en Post y en Profile.

Para poder hacer populate desde la colección que no tiene la referencia se usa un populate virtual. Un virtual es un campo que no se guarda en la base de datos, Mongoose lo arma en el momento de la consulta, buscando en la otra colección los documentos que contienen el id del documento actual.

```js
userSchema.virtual("posts", {
  ref: "Post",
  localField: "_id",
  foreignField: "author",
  match: { isActive: true },
});
```

- ref indica en qué modelo buscar.
- localField indica qué campo del documento actual se usa para comparar.
- foreignField indica qué campo del otro modelo debe coincidir.
- match aplica un filtro extra, en este caso solo trae los posts activos.
- En la relación 1:1 se agrega justOne: true para que devuelva un objeto en lugar de un array.

Para que el virtual aparezca en la respuesta, el esquema necesita la opción toJSON: { virtuals: true }. Después se usa igual que un populate normal:

```js
UserModel.find().populate("posts", "title");
```

En Tag funciona aunque tags sea un array, Mongoose busca los posts cuyo array contenga el id de la etiqueta.

### 2. ¿Cómo se realizan las eliminaciones lógicas y en cascada?

**Eliminación lógica**: el documento no se borra de la base de datos, sino que se marca con `isActive: false`. Todas las consultas filtran por `isActive: true`, por lo que el documento deja de aparecer en la API, pero sus datos se conservan y pueden recuperarse. Se usa en users, profiles y posts.

**Eliminación en cascada**: al eliminar un documento también se actualizan los documentos que dependen de él, para que no queden datos huérfanos ni referencias a documentos inexistentes.

- Al eliminar un usuario se desactiva el usuario y, en cascada, se desactivan sus posts con `updateMany` y su perfil con `updateOne`.
- Al eliminar una etiqueta se borra de forma física y, en cascada, se quita su id del array `tags` de todos los posts con el operador `$pull`.

```js
await PostModel.updateMany({ tags: id }, { $pull: { tags: id } });
await TagModel.findByIdAndDelete(id);
```

### 3. Cómo crear un endpoint que permita agregar un nuevo vínculo en una relación muchos a muchos.

El endpoint POST /api/posts/:postId/tags/:tagId agrega una etiqueta a un post existente. Usa el operador `$addToSet`, que agrega el id al array solo si todavía no está:

```js
PostModel.findByIdAndUpdate(
  postId,
  { $addToSet: { tags: tagId } },
  { returnDocument: "after" },
);
```

A diferencia de `$push`, que lo agregaría aunque ya exista, `$addToSet` evita duplicados. Además, antes de llegar al controlador, la validación verifica con `custom()` que el post y la etiqueta existan y que el vínculo no esté duplicado. Si alguna condición falla, responde con código 400.

## Validaciones

- Se usa express-validator en todas las rutas de creación y actualización.
- Se validan los campos obligatorios, los tipos de datos y las longitudes.
- Se validan los campos de la propiedad embebida con `addresses.*.street`, `addresses.*.city` y `addresses.*.country`.
- Se validan con `isMongoId()` los ids recibidos por parámetro y las referencias recibidas en el body (`author`, `user` y cada elemento de `tags`).
- Se usa `validationResult()` en el middleware reutilizable `src/middlewares/validate.js`, que responde con código 400 si hay errores.
- Se usa `matchedData()` en los controladores para trabajar solo con los datos validados.
- Se usa `custom()` para verificar que existan los documentos relacionados y para evitar duplicados: username, email, nombre de etiqueta, un perfil por usuario y el vínculo entre post y etiqueta.

## Códigos de respuesta

- 201: creación exitosa.
- 200: consultas, actualizaciones y eliminaciones exitosas.
- 400: errores de validación.
- 500: errores inesperados del servidor.
