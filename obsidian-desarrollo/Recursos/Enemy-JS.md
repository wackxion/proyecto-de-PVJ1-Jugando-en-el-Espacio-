# Enemy.js

## Ubicacion

`src/game/entidades/Enemy.js`

## Clase

`Enemigo extends GameObject`

## Rol

Representa asteroides normales y rezagados. Los especiales actuales tienen clase propia: [[SpecialEnemy-JS]].

## Tipos

Definidos en `TamanioAsteroide`:

- `small`
- `medium`
- `large`
- `special`
- `large_rezagado`
- `medium_rezagado`
- `small_rezagado`

Los stats viven en `CONFIG.ASTEROIDES`.

## Stats actuales desde config

| Tipo | Radio | Velocidad | Salud | Puntos | Dano | Carga ULTi |
|---|---:|---:|---:|---:|---:|---:|
| small | 16 | 150 | 25 | 30 | 10 | 15 |
| medium | 32 | 100 | 50 | 20 | 25 | 15 |
| large | 64 | 50 | 75 | 10 | 50 | 15 |
| special | 48 | 120 | 200 | 100 | 0 | 0 |
| large_rezagado | 64 | 60 | 75 | 10 | 50 | 15 |
| medium_rezagado | 32 | 80 | 50 | 20 | 25 | 15 |
| small_rezagado | 16 | 120 | 25 | 30 | 10 | 15 |

## Comportamiento

- `large` orbita al jugador.
- `small` y `medium` van hacia el jugador, salvo que hereden orbita.
- Los rezagados cruzan la pantalla en linea recta.
- Si reciben dano y sobreviven, se ralentizan durante 1 segundo.
- Si estan cerca de la nave, el campo gravitatorio los atrae.

## Fragmentacion

```text
large -> 2 medium
medium -> 2 small
large_rezagado -> 2 medium_rezagado
medium_rezagado -> 2 small_rezagado
```

## Conexiones

- [[Game-JS]]
- [[Player-JS]]
- [[GameProjectiles]] en codigo
- [[GameEnemies]] en codigo
