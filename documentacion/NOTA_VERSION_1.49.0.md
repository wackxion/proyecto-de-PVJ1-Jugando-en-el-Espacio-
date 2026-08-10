# Nota de versión v1.49.0

**Fecha:** 05/08/2026  
**Android:** versionCode 8 / versionName 1.49.0

## Texto breve para Google Play

Mejoramos el tutorial para que se vea correctamente en celulares y muestre los controles elegidos. Agregamos avisos de puntos y partículas recolectadas debajo de la nave. Optimizamos el comportamiento de las partículas BOIDS y la limpieza de enemigos para lograr partidas más fluidas. También corregimos sonidos y animaciones de destrucción.

## Cambios incluidos

- El tutorial de cinco páginas ahora se adapta a celulares en posición horizontal.
- La página de controles muestra el modo seleccionado: mouse y teclado, joystick o controles táctiles.
- La página de mejoras utiliza el icono real del botón de mejoras.
- Los puntos y las partículas recolectadas aparecen temporalmente debajo de la nave.
- Los avisos se apilan verticalmente para que no se superpongan.
- Las partículas recolectadas utilizan el nuevo icono `pboids_Icon.png`.
- Se redujeron cálculos y objetos temporales en el sistema de partículas BOIDS.
- Se eliminó una limpieza duplicada de enemigos y referencias destruidas.
- Las naves enemigas destruidas al chocar con asteroides reproducen su sonido.
- Los asteroides muestran una sola animación de destrucción; el efecto antiguo queda como respaldo si no carga la textura PNG.
- La versión visible del menú y de los créditos quedó unificada en v1.49.0.

## Verificación

- Recursos web sincronizados con Capacitor y Android.
- Compilación Android de depuración completada correctamente.
- Proyecto preparado para generar un nuevo Android App Bundle firmado desde Android Studio.
