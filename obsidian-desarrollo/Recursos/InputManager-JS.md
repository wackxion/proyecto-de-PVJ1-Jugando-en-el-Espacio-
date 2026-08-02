# InputManager.js

## Ubicacion

`src/systems/InputManager.js`

## Clase

`GestorEntrada`

## Rol

Unifica teclado, mouse, joystick/gamepad y touch en acciones logicas del juego.

## Acciones logicas

- `avanzar`
- `disparar`
- `ulti`
- `devorar`
- `cohetes`
- `propulsor`
- `pausa`
- `mostrarTop5`

## Caracteristicas actuales

- Lee bindings desde `CONFIG.CONTROLES`.
- Permite reasignar controles.
- Guarda controles en `localStorage` (`controlesJEE`).
- Guarda modo de control en `localStorage` (`modoControlJEE`).
- Soporta modos:
  - `mouseTeclado`
  - `joystick`
  - `touch`
- Mouse:
  - Apuntado al cursor.
  - `MouseLeft` y `MouseRight` como bindings.
- Gamepad:
  - Polling con Gamepad API.
  - Stick izquierdo principal, derecho como alternativa.
- Touch:
  - Acciones recibidas desde [[Controles-y-Teclas]] / `TouchControls.js`.
  - Intensidad analogica para acelerar.

## Metodos importantes

| Metodo | Uso |
|---|---|
| `estaPresionada(accion)` | Consulta accion combinando teclado/mouse/gamepad/touch |
| `debeDisparar(delta)` | Disparo con cooldown |
| `debeAvanzar(delta)` | Avance/aceleracion |
| `intensidadAvance()` | Intensidad 0..1 |
| `debeUsarUlti(delta)` | ULTi |
| `debeUsarDevorar(delta)` | Devorador |
| `debeUsarCohetes(delta)` | Cohetes |
| `debeUsarPropulsor(delta)` | Propulsor |
| `debePausar()` | Pausa/mejoras |
| `debeMostrarTop5()` | Top 5 |
| `actualizarGamepad()` | Lee Gamepad API |
| `reiniciar()` | Limpia acciones y cooldowns |

## Notas relacionadas

- [[Controles-y-Teclas]]
- [[Player-JS]]
- [[Game-JS]]
