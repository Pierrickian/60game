# 60game Architecture Rules (Mandatory)

## Core philosophy

- Gameplay content must be data-driven.
- `GameEngine` must remain generic and stable.
- Gameplay variation belongs in:
  - level configs,
  - rules,
  - handlers.
- Never encode gameplay variants in `GameEngine` conditionals.

## Level system

Each level must live in its own folder:

- `src/content/levels/<level_id>/`

Each folder contains:

- `config.json`
- `rules.json`

Adding a level should mostly require:

- adding a level folder,
- optionally adding handlers,
- optionally updating progression registry.

Rules:

- Do not hardcode levels in `GameEngine`.
- Use automatic level discovery only.
- Preferred mechanism: `import.meta.glob(...)`.
- `GameEngine` must not require edits for new levels, decks, rules, or gameplay variants.

## Handler system

Handlers must be isolated and auto-discovered.

Rules:

- Avoid centralized giant registries requiring frequent edits.
- Preferred mechanism: `import.meta.glob('./*.ts', { eager: true })`.
- Resolve handlers dynamically by id.
- Avoid `switch/case` and giant `if/else` gameplay routing.

Goal:

- adding behavior should mostly mean adding a new handler file.

## PR / merge-conflict strategy

The architecture is designed for:

- parallel AI-agent PRs,
- stacked PR workflows,
- independent gameplay experimentation.

Preferred ownership boundaries:

- one level = one folder,
- one handler = one file.

Avoid shared hotspots and unnecessary centralization.

Reference:

- <https://github.github.com/gh-stack/introduction/overview/>

## Content loading rules

When using `import.meta.glob` with JSON, do not assume direct JSON value.

Always unwrap safely:

```ts
const data =
  module && typeof module === 'object' && 'default' in module
    ? module.default
    : module
```

## Path handling rules

Avoid fragile regex parsing for content paths.

Preferred approach:

- `split('/')`,
- find segment indexes,
- retrieve target parts directly.

## Runtime state rules

Avoid repeated full-deck scans.

Prefer runtime counters such as:

- `remainingCounts[label]`.

Update counts incrementally during gameplay.

## UI rules

UI must consume runtime data dynamically.

Avoid hardcoded card types or level definitions in UI.

UI should derive data from runtime/content systems:

- available cards,
- level metadata,
- rules,
- counts.

## Long-term goal

- content = gameplay,
- handlers = behavior plugins,
- engine = generic runtime.

Engine stability should increase over time while gameplay expands through isolated content additions.

## Implementation style

Prefer:

- small isolated files,
- plugin-style additions,
- data-driven design,
- additive architecture,
- extensibility,
- readability.

Avoid:

- monolithic gameplay files,
- engine rewrites for gameplay additions,
- centralized mutable configs,
- cross-level coupling,
- hidden gameplay rules.
