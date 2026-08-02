# Projectile.js

## Ubicacion

`src/game/entidades/Projectile.js`

## Clase

`Proyectil extends GameObject`

## Rol

Proyectil principal disparado por la nave del jugador.

## Stats actuales

Desde `CONFIG.PROYECTIL` y clase:

| Campo | Valor |
|---|---:|
| Velocidad base | 800 px/s |
| Dano base | 25 |
| Tiempo de vida | 0.75 s |
| Radio colision | 3 px |
| Escala visual | 0.0875 |

## Creacion

```text
Jugador._disparar()
-> Game.crearProyectil()
-> GameProjectiles.crearProyectil()
-> new Proyectil(...)
```

## Mejoras

`Game.crearProyectil()` aplica bonus de dano segun mejoras de proyectil:

- Nivel 1: +2
- Nivel 2: +3
- Nivel 3: +5
- Nivel 4: +5
- Nivel 5: +10

Tambien existe mejora de velocidad de proyectil en las secciones de mejoras actuales.

## Colisiones

La logica principal esta en `src/game/sistemas/GameProjectiles.js`.

- Asteroides normales.
- SpecialEnemy normal.
- EnemyShip.
- Proyectiles enemigos.
- Mini SpecialEnemy en orbita: los proyectiles aliados lo traspasan.

## Conexiones

- [[Player-JS]]
- [[Game-JS]]
- [[Enemy-JS]]
- [[EnemyShip-JS]]
- [[EnemyProjectile-JS]]
