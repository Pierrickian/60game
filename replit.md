# Workspace

## Overview

Monorepo pnpm TypeScript. Chaque package gère ses propres dépendances.

## Instructions agent

For architecture, refactor, engine split, menu split, capability or runtime patch tasks, read and apply `skills/agent-architecture/SKILL.md` before coding.

## Stack

- Monorepo: pnpm workspaces
- Node.js: 24
- TypeScript: 5.9
- React + Vite
- Web game architecture

## Key Commands

- `pnpm run typecheck`
- `pnpm run build`
- `pnpm run dev`

---

## Card Game (`artifacts/card-game`)

Jeu de cartes web orienté gameplay évolutif.

### Architecture

```
src/
  engine/
    types.ts
    Card.ts
    game_engine.ts
    useGameEngine.ts

  scenes/
    GameScene.tsx
    TableView.tsx
    HandView.tsx
    CardView.tsx

  game/
    HUD.tsx
    Menu.tsx
    RuntimePanels.tsx

  App.tsx

public/
  game_config.json
```

### Principes d'architecture

- Graphique et logique découplés.
- Le moteur ne dépend pas de React.
- Les paramètres gameplay viennent de `game_config.json`.
- Les cartes, règles, effets et comportements doivent être configurables.
- Les événements gameplay doivent pouvoir déclencher plusieurs réactions UI.
- Les éléments UI temporaires doivent être traités comme des objets UI autonomes.

### Objets UI autonomes

Les éléments suivants doivent pouvoir apparaître/disparaître indépendamment:

- notifications de manche,
- victoire/défaite,
- révélation de carte,
- récompenses,
- choix d'évolution,
- tutoriels,
- événements spéciaux,
- messages runtime.

Chaque objet UI doit idéalement avoir:

- un type,
- un id,
- un payload,
- une durée de vie,
- un renderer dédié.

### Configuration gameplay

Le fichier `game_config.json` doit centraliser:

- les cartes,
- les familles de cartes,
- les effets,
- les decks,
- les probabilités,
- les niveaux,
- les événements spéciaux,
- les textes UI,
- les règles de score.

### Système de niveaux

Le jeu peut évoluer par:

- manches,
- decks,
- événements,
- difficultés,
- mutations runtime,
- règles temporaires.

Les niveaux doivent être configurables et testables indépendamment.

### Notes de version

Le tableau `release_notes` dans `game_config.json` doit:

- recevoir une nouvelle entrée à chaque commit,
- rester limité à 20 entrées,
- être trié du plus récent au plus ancien.

### Localisation

Tout texte affiché au joueur doit pouvoir être localisé.

### Règles développeur

- Éviter les constantes gameplay en dur.
- Garder les systèmes découplés.
- Favoriser les petits fichiers cohérents.
- Garder `GameEngine` comme API principale.
- Ajouter les nouveaux comportements via handlers ou systèmes dédiés.
