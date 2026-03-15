# Entity System

Blastback uses a JSON-driven entity-component system. Every game object (player, enemies, weapons, projectiles, UI elements) is defined as a JSON entity file.

## File Locations

```
Content/Definition/Data/Game/entities/
├── mob/              # Characters (player, enemies)
├── weapons/          # Weapon definitions
├── projectile/       # Projectile definitions
├── drop/             # Pickup/drop definitions
├── props/            # Environmental props
├── ui/               # UI entity definitions
└── raw/              # Raw/utility entities
```

## Entity JSON Schema

```json
{
  "name": "EntityName",
  "visualsPath": "Mobs/sprite.ase",
  "colliderSizeX": 12,
  "colliderSizeY": 14,
  "physicsLayer": 2,
  "collisionLayerMask": [6],
  "isTrigger": false,
  "builtin": false,
  "renderLayer": 0,

  "components": {
    ...
  },

  "model": {
    ...
  }
}
```

### Top-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name of the entity. |
| `visualsPath` | string | Path to the sprite asset (`.ase`, `.png`, or `.atlas`). |
| `colliderSizeX` | float | Horizontal collider size in pixels. |
| `colliderSizeY` | float | Vertical collider size in pixels. |
| `physicsLayer` | int | Physics layer this entity occupies. Use `-1` to disable physics. |
| `collisionLayerMask` | int[] | Array of physics layers this entity collides with. |
| `isTrigger` | bool | If true, collisions generate trigger events but no physical response. |
| `builtin` | bool | If true, the entity uses a built-in C# controller instead of the generic one. |
| `renderLayer` | int | Rendering order layer. |

## Physics Layers

| ID | Layer | Description |
|----|-------|-------------|
| 1 | Tilemap | World tiles and terrain |
| 2 | Player | Player entity |
| 3 | Enemy | Enemy mobs |
| 4 | Projectile | Bullets and thrown objects |
| 5 | Weapon | Weapon entities |
| 6 | Props | Environmental objects |
| 7 | Drop | Pickups and drops |
| 8 | Melee Impacts | Melee attack hitboxes |
| 10 | Particle | Particle effects |

Set `physicsLayer: -1` and `isTrigger: true` for entities that don't need physical collision (e.g. floating enemies, guardians).

## Components

Components are defined in the `components` object. Each key is a component ID:

```json
"components": {
  "animator": {},
  "movement.basic": { "velocity": 60 },
  "weapon": { "id": "weapon.macana", "isPersistent": true },
  "lua:combat_momentum": { "maxTier": 5 }
}
```

- Standard components use their registered name (e.g. `animator`, `weapon`, `playerMovement`)
- Lua components use the `lua:` prefix followed by the script ID
- Component-specific config is passed as the JSON object value

### Command Maps

Any component can define a `commandMap` to alias commands:

```json
"melee": {
  "hitBoxSize": 40,
  "commandMap": {
    "deflect": "attack"
  }
}
```

This maps the external command `deflect` to the internal `attack` command on the melee component.

## Model

The `model` object contains entity-level configuration that isn't component-specific:

```json
"model": {
  "maxHP": 1,
  "customDeath": true,
  "cost": 1,
  "drops": [
    { "dropID": "drop.token", "min": 3, "max": 5 }
  ],
  "events": { ... }
}
```

### Model Fields (Mob)

| Field | Type | Description |
|-------|------|-------------|
| `maxHP` | int | Maximum health points. |
| `customDeath` | bool | If true, uses custom death logic instead of default. |
| `cost` | int | Spawn cost for room generation. |
| `drops` | DropEntry[] | Items dropped on death. |

See [models.md](models.md) for weapon, projectile, and visual model fields.

## Event System

Events are defined inside `model.events` and organized by source component:

```json
"model": {
  "events": {
    "entity": {
      "onDeath": {
        "sound": "sound/player/hurt",
        "particle": { "id": "explosion" },
        "commands": [
          "controlStateMachine.changeState death",
          "world.cam.hitstop 0.5,0.3"
        ]
      },
      "onHarmed": {
        "commands": ["combat_momentum.onBreak"]
      }
    },
    "weapon": {
      "onFire": {
        "commands": ["combat_momentum.onHit"]
      }
    },
    "animator": {
      "walk.step": {
        "sound": "sound/player/steps",
        "particle": { "id": "step", "renderLayer": 2 }
      }
    }
  }
}
```

### Event Sources

| Source | Events | Description |
|--------|--------|-------------|
| `entity` | `onDeath`, `onHarmed`, `onFallEnd`, `onMobHit`, `onFired`, `onBounce`, `onDestroy`, `onSupersonic` | Core entity lifecycle events |
| `weapon` | `onFire`, `attachWeapon` | Weapon-related events |
| `weapon.shooter` | `onFire` | Shooter-specific events |
| `weapon.shooter.rideable` | `onFire`, `onRecover` | Rideable shooter events |
| `weapon.melee` | `onDeflect` | Melee deflection events |
| `tilemapDetector` | `onFall` | Tilemap detection events |
| `animator` | `{trigger}.{frame}` | Animator trigger frame events |
| `ai` | `{nodeID}.onStart`, `{nodeID}.onEnd` | AI behavior tree node events |

### Event Actions

Each event can trigger any combination of:

| Key | Type | Description |
|-----|------|-------------|
| `sound` | string | Sound effect path to play. |
| `particle` | object | Particle effect to spawn (`id`, `renderLayer`, `relX`, `relY`). |
| `commands` | string[] | Array of command paths to execute. |

### Command String Format

Commands in event arrays use space-separated arguments:

```json
"commands": [
  "controlStateMachine.changeState death",
  "world.cam.hitstop 0.5,0.3",
  "world.cam.shake 15",
  "weapon.setVisible true",
  "world.player.weapon.addAmmo 1",
  "controlHandler.registerAction toss lua:action_resolvers.toss"
]
```

## Complete Examples

### Simple Enemy (Slime)

```json
{
  "name": "Slime",
  "visualsPath": "Mobs/slime.ase",
  "physicsLayer": 3,
  "collisionLayerMask": [2, 8],
  "colliderSizeX": 20,
  "colliderSizeY": 15,

  "components": {
    "animator": {}
  },

  "model": {
    "maxHP": 1,
    "cost": 1,
    "drops": [
      { "dropID": "drop.token", "min": 3, "max": 5 }
    ]
  }
}
```

### Player Entity

```json
{
  "name": "Player",
  "visualsPath": "Mobs/MainCharacter.ase",
  "colliderSizeX": 12,
  "colliderSizeY": 14,
  "physicsLayer": 2,
  "collisionLayerMask": [6],

  "components": {
    "weapon": { "id": "weapon.macana", "isPersistent": true },
    "input": { "profile": "input.player", "handlers": { "command": "command" } },
    "controlHandler": {
      "actionMap": {
        "aim":      { "resolver": "lua:action_resolvers.aim" },
        "flip":     { "resolver": "lua:action_resolvers.flip" },
        "move":     { "resolver": "lua:action_resolvers.move" },
        "idle":     { "command": "playerMovement.idle" },
        "attack":   { "command": "weapon.fire" },
        "interact": { "command": "interactor.interact" }
      }
    },
    "playerMovement": { "velocity": 120 },
    "animator": { "triggers": { "walk": { "step": 4 } } },
    "aimAssist": { "radius": 120, "targetClearingTimeout": 0.6 },
    "controlStateMachine": { "templateID": "player" },
    "tilemapDetector": {},
    "stamina": {
      "initialContainers": 4,
      "maxContainers": 3,
      "recoveryMultiplier": 10,
      "containerThreshold": 100
    },
    "lua:combat_momentum": {
      "maxTier": 5,
      "speedPerTier": 8,
      "comboTimeout": 1.5,
      "decayInterval": 0.4
    }
  },

  "model": {
    "customDeath": true,
    "events": {
      "entity": {
        "onDeath": {
          "commands": [
            "controlStateMachine.changeState death",
            "world.cam.hitstop 0.5,0.3",
            "world.cine.play death"
          ]
        },
        "onHarmed": {
          "sound": "sound/player/hurt",
          "commands": [
            "world.cam.shake 15",
            "world.cam.hitstop 0.07",
            "combat_momentum.onBreak"
          ]
        }
      },
      "weapon": {
        "onFire": {
          "commands": ["world.cam.shake 4,0.9", "combat_momentum.onHit"]
        }
      }
    }
  }
}
```

### Weapon (Macana)

```json
{
  "name": "Macana",
  "visualsPath": "Weapons/bat.ase",

  "components": {
    "melee": {
      "canHit": false,
      "attackDuration": 0.3,
      "hitBoxSize": 40,
      "playerFriendly": true,
      "commandMap": { "deflect": "attack" },
      "deflection": {
        "momentum": 200,
        "hitstop": 0.4,
        "camShake": 1
      }
    },
    "shooter.rideable": {
      "defaultProjectileID": "projectile.bat",
      "addedCooldown": 0.3,
      "commandMap": { "toss": "attack", "aimToss": "aimAttack" },
      "projectilesPerShot": 1,
      "playerFriendly": true
    },
    "shooter": {
      "defaultProjectileID": "projectile.shell",
      "projectilesPerShot": 1,
      "playerFriendly": true
    }
  },

  "model": {
    "cooldown": 0.2,
    "maxAmmo": 4,
    "visual": { "aperture": 0.7, "duration": 0.4, "rotation": 1 },
    "events": {
      "shooter": {
        "onFire": {
          "sound": "sound/bat/gun",
          "particle": { "id": "muzzle", "relX": 8 }
        }
      },
      "melee": {
        "onDeflect": { "sound": "sound/bat/return" }
      }
    }
  }
}
```
