# Controles y Teclas

## Fuente de verdad

Los controles por defecto estan en `src/config.js`, seccion `CONFIG.CONTROLES`.

El gestor vive en `src/systems/InputManager.js` y permite reasignar controles desde Opciones. Los cambios se guardan en `localStorage` con la clave `controlesJEE`.

## Modos de control

| Modo | Apuntado | Uso |
|---|---|---|
| Mouse y teclado | Mouse | PC |
| Joystick | Stick izquierdo o derecho | Gamepad |
| Touch | Joystick virtual flotante | Celular |

El modo se guarda en `localStorage` con la clave `modoControlJEE`.

## Controles por defecto

| Accion | Mouse/teclado | Gamepad | Touch |
|---|---|---|---|
| Apuntar | Mouse | Stick izquierdo o derecho | Joystick virtual |
| Acelerar | Click derecho, W, Flecha Arriba | RT o A | Intensidad del joystick |
| Disparar | Click izquierdo, Espacio | LT o X | Boton FUEGO |
| ULTi | S, Flecha Abajo | B | Boton ULTi |
| Devorador | E | LB | Boton Devorador |
| Cohetes | Q | RB | Boton Cohetes |
| Propulsor | R | Y | Boton Propulsor |
| Pausa / Mejoras | P | - | Icono de mejora / P si hay teclado |
| Top 5 | T | - | Desde UI/contexto |
| Volver al menu | ESC | - | Boton atras Android / modal |

## Flujo de input

```text
InputManager
|-- teclado y mouse -> this.teclas
|-- gamepad -> this.gamepadAcciones + gamepadAngulo
|-- touch -> this.tactilAcciones + tactilAngulo + tactilIntensidad
`-- estaPresionada(accion) combina las 3 fuentes
```

## Detalles importantes

- El apuntado con mouse es fijo y no se reasigna.
- Los botones del mouse si son bindings reasignables (`MouseLeft`, `MouseRight`).
- En touch, empujar poco el joystick apunta sin acelerar fuerte; empujar mas aumenta aceleracion y consumo de carga.
- En modo touch no existe boton separado de acelerar.
- `P` alterna pausa/mejoras; durante pausa el game loop corta despues de actualizar despliegue del HUD.
- `ESC` abre confirmacion para volver al menu solo si hay partida activa y no esta pausada ni en Game Over.

## Notas relacionadas

- [[InputManager-JS]]
- [[Player-JS]]
- [[HUD-y-Mejoras]]
- [[Game-JS]]
