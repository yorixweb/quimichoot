# Quimichoot

Juego web multijugador para una actividad escolar de química. Un profesor crea una sala, los estudiantes entran con PIN desde sus celulares y compiten construyendo estructuras de hidrocarburos.

## Abrir el MVP

1. Inicia un servidor local en esta carpeta.
2. Abre `/host/` para el profesor.
3. Abre `/play/` en dos o más ventanas para simular jugadores.
4. Crea una sala, copia el PIN, une jugadores e inicia la partida.

El juego usa modo local de prueba si `js/config.js` no tiene credenciales de Firebase. Ese modo permite probar varias ventanas del mismo navegador. Para usar Firebase Realtime Database, pega tu configuración en `js/config.js`.

## Controles del editor

- `C+`: agrega un carbono.
- `Mover`: permite arrastrar carbonos para ordenar la estructura y tocar carbonos para seleccionarlos.
- `-`, `=`, `≡`: activa el modo enlace. Arrastra desde un carbono y suelta sobre otro carbono para crear o cambiar el enlace.
- `↻`: cambia el tipo de enlace entre dos carbonos seleccionados.
- `⌫`: elimina el enlace entre dos carbonos seleccionados.
- `C-`: elimina los carbonos seleccionados.

El modo enlace usa eventos táctiles, así que funciona con dedo en celular y con mouse en computador.

## Estructura

- `host/`: pantalla del profesor.
- `play/`: pantalla del jugador.
- `js/rounds.js`: banco editable de hidrocarburos.
- `js/chemistry.js`: validación de valencia e isomorfismo de grafos con orden de enlace.
- `js/editor.js`: editor visual táctil de moléculas.
- `js/store.js`: sincronización con Firebase o modo local.
- `firebase.rules.json`: reglas iniciales para Realtime Database.

## Configurar Firebase

1. Crea un proyecto en Firebase.
2. Activa Realtime Database.
3. Activa Authentication con inicio anónimo.
4. Copia la configuración web del proyecto en `js/config.js`.
5. Publica las reglas de `firebase.rules.json`.

Las reglas incluidas asumen autenticación anónima. El host controla estado, rondas y puntajes; cada jugador solo puede escribir su propio perfil y sus envíos.

## Rondas incluidas

El banco incluye 28 moléculas entre alcanos, alquenos y alquinos, organizadas por dificultad del 1 al 5.

El profesor puede:

- Elegir una dificultad máxima al crear la partida.
- Dejar que el juego avance automáticamente por la lista filtrada.
- Escoger manualmente la molécula de la siguiente ronda desde la pantalla de resultados.
- Cambiar el tiempo de la siguiente ronda.
- Activar puntos dobles para la siguiente ronda.
