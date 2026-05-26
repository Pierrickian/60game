# Adaptive chip music

8-bit adaptive music system for 60game.

Principles:

- Success adds harmonic light.
- Failure temporarily simplifies the music.
- The soundtrack always returns toward hopeful resolution.
- Combo streaks increase intensity and brightness.
- Recovery after failure is treated as emotional progression.

Main modules:

- `chipSynth.js`: low-level WebAudio chip primitives.
- `adaptiveMusicSystem.js`: emotional orchestration layer.

Suggested runtime integration:

```js
music.start()
music.onSuccess(combo)
music.onFailure(previousCombo)
music.setIntensity(combo)
```
