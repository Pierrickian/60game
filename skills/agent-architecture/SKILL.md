---
name: agent-architecture
description: Guider les agents lors des refactors et évolutions pour préserver une architecture lisible, typée et compatible avec un workflow IA-first.
---

# Objectif

Garder le dépôt facile à comprendre, inspecter et modifier par des agents IA.

Les changements doivent rester locaux, typés et organisés par responsabilité.

# Règles de découpage

- Préférer plusieurs petits fichiers cohérents plutôt qu'un très gros fichier.
- Viser des fichiers sous 300 à 400 lignes quand c'est raisonnable.
- Garder les fichiers orchestrateurs légers.
- Ne pas transformer un orchestrateur en fichier fourre-tout.
- Extraire progressivement les blocs cohérents.
- Ne pas mélanger plusieurs refactors sans lien dans le même commit.

# Modules recommandés

Pour le moteur:

- deckSystem.ts
- drawSystem.ts
- scoreSystem.ts
- turnSystem.ts
- ruleHandlers.ts
- eventSystem.ts
- runtimeMutationSystem.ts

Pour l'interface:

- sous-composants par écran,
- helpers purs pour labels et états,
- styles partagés isolés,
- entités UI autonomes,
- hooks dédiés pour traduire les événements gameplay en affichages UI.

# Event / callback et objets UI autonomes

Quand une action gameplay peut déclencher plusieurs réactions indépendantes, privilégier un mécanisme event / callback.

Exemples typiques:

- début ou fin de manche,
- pioche spéciale,
- combo,
- évolution,
- événement rare,
- changement de phase runtime,
- ouverture d'un panneau de résultats.

L'émetteur annonce ce qui arrive.
Les systèmes abonnés décident quoi faire.

# Typage TypeScript

- Éviter `any`.
- Préférer des interfaces étroites.
- Passer uniquement les dépendances nécessaires.
- Garder des contextes minimaux.

# Règles moteur

- Le moteur ne doit pas importer React.
- Les paramètres gameplay viennent de `game_config.json`.
- Garder `GameEngine` comme API publique principale.
- Les systèmes doivent rester découplés.

# Design system avant effets

Avant d'ajouter des effets visuels lourds, stabiliser d'abord le design system:

- layout portrait mobile clair,
- zones fixes: HUD, scène, boutons,
- grille qui tient dans un écran sans scroll,
- tailles relatives testées sur Android,
- hiérarchie visuelle lisible,
- couleurs de rareté cohérentes,
- composants UI nommés et réutilisables.

Ne pas compenser un mauvais layout avec des animations ou des particules.

# Performance mobile Android

Le mobile Android est la référence de performance.

Règles:

- éviter les animations infinies sur beaucoup d'éléments,
- éviter les canvas permanents non indispensables,
- éviter les particules permanentes sans budget clair,
- éviter les gros blur/backdrop-filter sur trop d'éléments,
- éviter les re-renders globaux à chaque micro-effet,
- préférer des animations courtes déclenchées par action joueur,
- désactiver ou simplifier les effets en cas de lag,
- tester d'abord la fluidité avant d'ajouter du polish.

Budget recommandé:

- une animation principale par action,
- une animation secondaire légère maximum,
- pas d'effet permanent coûteux sans option de fallback.

# React + Framer Motion

React et Framer Motion doivent servir la clarté, pas ajouter du désordre.

Bonnes pratiques:

- composants purs et petits,
- state gameplay minimal,
- state visuel séparé quand possible,
- `AnimatePresence` seulement pour les éléments transitoires,
- `layout` Framer avec prudence sur mobile,
- éviter les animations infinies Framer sauf sur un seul élément léger,
- éviter de mélanger rendu impératif DOM et rendu React,
- ne pas garder un ancien système `innerHTML` si React devient l'entrée principale.

# Canvas FX / Three.js

Canvas FX ou Three.js ne doivent pas être ajoutés par réflexe.

Utiliser Canvas FX uniquement pour:

- particules contrôlées,
- trails,
- fonds animés simples,
- effets avec budget FPS mesuré.

Utiliser Three.js uniquement si:

- les cartes ont réellement besoin de 3D,
- le rendu CSS ne suffit plus,
- l'app reste fluide sur Android.

Toujours prévoir un fallback CSS léger.

# Déploiement Vercel + GitHub Pages

Pour Vite:

- Vercel sert généralement depuis `/`.
- GitHub Pages sert le repo depuis `/<repo>/`.
- Configurer `base` dans `vite.config.js` pour Pages.
- Le workflow Pages doit builder Vite puis publier `dist`, jamais la racine du repo.
- `pages-build-deployment` est un workflow système GitHub normal, différent du workflow custom.

# Runtime patch

Les modifications runtime:

- ne doivent pas modifier la source persistante,
- doivent permettre un test immédiat,
- doivent rester isolées.

# Validation attendue

Avant de terminer:

- lancer le typecheck ou build,
- vérifier que le comportement existant reste stable,
- vérifier Vercel si disponible,
- vérifier GitHub Pages si concerné,
- tester mentalement le rendu mobile portrait,
- signaler les gros fichiers,
- signaler les `any` restants si nécessaire.
