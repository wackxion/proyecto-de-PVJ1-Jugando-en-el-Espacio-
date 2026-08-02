# Player.js

## Ubicacion

`src/game/entidades/Player.js`

## Clase

`Jugador extends GameObject`

## Rol

Representa la nave del jugador: movimiento, apuntado, disparo, ULTi, escudos, sobrecalentamiento, propulsor e invulnerabilidad temporal.

## Propiedades importantes

| Propiedad | Uso |
|---|---|
| `x`, `y` | Posicion de mundo |
| `rotacion` | Direccion hacia donde apunta |
| `velocidad` | Velocidad actual con inercia |
| `cargaAceleracion` | Barra de aceleracion |
| `sobrecalentadoAceleracion` | Cooldown por acelerar de mas |
| `escudos`, `escudosMax` | Vida actual y maxima |
| `sobrecalentado` | Estado vulnerable tras llegar a 0 escudos |
| `cargaUlti`, `cargaMaxUlti`, `ultiListo` | ULTi |
| `enPropulsor` | Dash activo |
| `invulnerable` | Proteccion temporal al revivir |

## Movimiento actual

- La nave apunta al mouse, joystick o joystick touch.
- Acelera en la direccion actual.
- Tiene inercia y friccion.
- En touch la intensidad del joystick escala aceleracion y consumo.
- Con mundo toroidal, al salir por un borde entra por el opuesto.

## Escudos

- `recibirDano(dano)` resta escudos.
- Si llega a 0, entra en `sobrecalentado`.
- Si recibe otro golpe estando sobrecalentado, llama a `gameOver()`.
- `agregarEscudos(cantidad)` puede sacar al jugador del sobrecalentamiento.
- Al revivir, `activarInvulnerabilidad(segundos)` evita dano temporalmente.

## Disparo y habilidades

- `_disparar()` llama a `game.crearProyectil()`.
- `_usarUlti()` llama a `game.activarUlti()` y reinicia la carga.
- `activarPropulsor()` inicia dash.

## Conexiones

- [[InputManager-JS]]
- [[Game-JS]]
- [[Projectile-JS]]
- [[HUD-y-Mejoras]]
- [[Configuracion-y-Balance]]
