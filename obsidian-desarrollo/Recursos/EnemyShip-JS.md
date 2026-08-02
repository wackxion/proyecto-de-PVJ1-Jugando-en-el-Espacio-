# EnemyShip.js

## Ubicacion

`src/game/entidades/EnemyShip.js`

## Clase

`EnemyShip extends GameObject`

## Rol

Nave enemiga con IA. Orbita al jugador, esquiva asteroides y dispara proyectiles teledirigidos.

## Stats actuales

Valores base desde `CONFIG.NAVE_ENEMIGA`:

| Campo | Valor |
|---|---:|
| Salud | 25 |
| Dano | 25 |
| Carga ULTi al destruir | 30 |
| Velocidad | 225 |
| Radio colision | 15 |
| Intervalo disparo | 3 s |

## Comportamiento

- Busca una orbita alrededor del jugador.
- Usa inercia para suavizar movimiento.
- Calcula la posicion mas cercana del jugador en modo toroidal.
- Esquiva asteroides cercanos con fuerza de repulsion.
- Dispara cada 3 segundos cuando corresponde.
- Tiene variantes visuales elegidas al generarse.

## Colisiones

- Proyectil aliado: recibe dano.
- ULTi: se destruye.
- Mini SpecialEnemy en orbita: colisiona y puede destruirse.
- Jugador: hace dano al jugador.

## Conexiones

- [[Game-JS]]
- [[EnemyProjectile-JS]]
- [[Player-JS]]
- [[Enemy-JS]]
- [[SpecialEnemy-JS]]
