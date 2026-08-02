# Top5.js

## Ubicacion

`src/game/mecanicas/Top5.js`

## Clase

`Top5`

## Rol

Sistema de puntuaciones. Guarda y recupera las mejores 5 entradas.

## Backend

- Principal: Firebase Firestore.
- Coleccion: `top5`.
- Documento: `puntuaciones`.
- Respaldo: `localStorage`.
- Respaldo final: memoria.

## Datos

Cada entrada tiene:

```js
{
  nombre: "BRAIAN",
  puntuacion: 1234,
  oleada: 7
}
```

## Validacion

- Nombre en mayusculas.
- Maximo 8 caracteres.
- Solo letras y numeros.
- Puntuacion 0 o menor no califica.
- Evita duplicados exactos: mismo nombre, puntuacion y oleada.

## Metodos importantes

| Metodo | Uso |
|---|---|
| `obtenerLista()` | Lee Firebase/localStorage/memoria |
| `obtenerListaSync()` | Devuelve memoria sin await |
| `guardarLista(lista)` | Guarda en Firebase y localStorage |
| `califica(puntuacion)` | Determina si entra al Top 5 |
| `validarNombre(nombre)` | Limpia y valida nombre |
| `agregarEntrada(nombre, puntuacion, oleada)` | Inserta, ordena y recorta a 5 |
| `limpiar()` | Borra lista |

## Conexiones

- [[Main-JS]] precarga Top 5 para el menu.
- [[Game-JS]] consulta y guarda puntuaciones en Game Over.
- `UIManager.js` muestra Top 5 del menu.
