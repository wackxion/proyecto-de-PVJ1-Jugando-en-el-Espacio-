# SpecialEnemy.js

## Ubicacion

`src/game/entidades/SpecialEnemy.js`

## Clase

`SpecialEnemy extends GameObject`

## Rol

Asteroide especial con comportamiento propio. Puede viajar hacia la posicion del jugador y convertirse en mini asteroide orbitante.

## Stats actuales de la clase

| Campo | Valor |
|---|---:|
| Salud | 100 |
| Puntos | 100 |
| Carga ULTi | 0 |
| Radio normal | 40 |
| Radio mini | 20 |
| Velocidad normal | 80 |
| Radio orbita mini | 130 |
| Velocidad orbita | 1.5 rad/s base |
| Max colisiones mini | 6 |

## Comportamiento normal

- Guarda la direccion hacia el jugador al crearse.
- Avanza en esa direccion y sigue de largo.
- Si sale mucho de la pantalla, se recicla desde un borde.
- Al reciclar, apunta hacia el centro.

## Modo mini / orbita

- `convertirEnOrbita()` lo vuelve mini.
- Orbita alrededor del jugador.
- Reduce radio y escala visual.
- Tiene contador de colisiones.
- `registrarColision()` lo destruye al llegar al maximo.

## Importante

Hay diferencias historicas entre notas viejas y codigo actual:

- La nota vieja decia 200 HP; la clase actual usa 100 HP.
- La nota vieja decia power-up directo al destruir; el flujo actual usa mini/orbita y particulas/mejoras como economia principal.
- La documentacion actual debe priorizar `SpecialEnemy.js`, `GameProjectiles.js`, `GameEnemies.js` y `GameSkills.js`.

## Conexiones

- [[Game-JS]]
- [[Player-JS]]
- [[Enemy-JS]]
- [[EnemyShip-JS]]
- [[Projectile-JS]]
