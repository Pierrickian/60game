# UI Architecture

## Vision

L'interface doit fonctionner comme un ensemble d'entités UI autonomes capables de réagir aux événements du moteur.

Le moteur ne connaît pas React.
L'UI observe les événements gameplay.

---

## Objectifs

- Interface lisible sur mobile.
- Réactivité forte.
- Effets temporaires découplés.
- Runtime panels indépendants.
- Overlay gameplay dynamique.
- Navigation minimale.

---

## Entités UI recommandées

Chaque élément temporaire doit pouvoir exister indépendamment.

Exemples:

- notification,
- popup,
- panneau de récompense,
- reveal de carte,
- tutoriel,
- événement rare,
- animation de combo,
- résultat de manche.

Structure recommandée:

```ts
{
  id,
  type,
  payload,
  createdAt,
  duration,
  priority
}
```

---

## Flux recommandé

Gameplay event -> UI event mapper -> UI entity list -> Renderer

Le moteur annonce.
L'UI interprète.

---

## Menus

Préférer:

- carrousels,
- panneaux runtime,
- overlays simples,
- transitions courtes,
- feedback immédiat.

Éviter:

- navigation profonde,
- fenêtres lourdes,
- états UI dispersés.

---

## Runtime evolution

Le jeu doit pouvoir:

- ajouter des règles runtime,
- modifier des cartes,
- injecter des événements,
- faire évoluer les decks,
- proposer des choix temporaires,
- tester rapidement de nouveaux comportements.

---

## Localisation

Tout texte UI doit pouvoir changer de langue sans reload.
