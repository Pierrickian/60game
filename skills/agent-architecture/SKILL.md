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

# Runtime patch

Les modifications runtime:

- ne doivent pas modifier la source persistante,
- doivent permettre un test immédiat,
- doivent rester isolées.

# Validation attendue

Avant de terminer:

- lancer le typecheck ou build,
- vérifier que le comportement existant reste stable,
- signaler les gros fichiers,
- signaler les `any` restants si nécessaire.
