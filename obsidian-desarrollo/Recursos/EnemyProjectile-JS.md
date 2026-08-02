# EnemyProjectile.js

## Ubicacion

`src/game/entidades/EnemyProjectile.js`

## Rol

Proyectil de las naves enemigas. Persigue al jugador y puede esquivar asteroides.

## Stats

Valores principales desde `CONFIG.PROYECTIL_ENEMIGO`:

| Campo | Valor |
|---|---:|
| Velocidad | 400 px/s |
| Dano | 25 |
| Tiempo de vida | 3 s |

## Comportamiento

- Se orienta hacia el jugador.
- Puede mezclar persecucion con evasion de asteroides.
- Se destruye por tiempo de vida o colision.

## Colisiones relevantes

- Jugador: resta escudos.
- Proyectil aliado: ambos se destruyen.
- Mini SpecialEnemy en orbita: le suma dano/colision.
- Asteroides: puede destruirse segun logica de `GameProjectiles.js`.

## Conexiones

- [[EnemyShip-JS]]
- [[Player-JS]]
- [[Projectile-JS]]
- [[Game-JS]]
