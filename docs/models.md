# Models Reference

Models define entity-level configuration for weapons, projectiles, visuals, drops, and particles. They are specified in the `model` object of entity JSON files.

## EntityModel (Base)

Every entity has a base model with these fields:

```json
"model": {
  "id": "mob.slime",
  "namespc": "game",
  "animation": { ... },
  "events": { ... }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Entity identifier (auto-derived from filename if not set). |
| `namespc` | `string` | Namespace for the entity. |
| `animation` | `AnimationDefinition` | Default animation configuration. |
| `events` | `Dict<string, Dict<string, EventDefinition>>` | Event definitions organized by source. |

---

## WeaponModel

Configures weapon behavior (cooldown, ammo, visuals).

```json
"model": {
  "cooldown": 0.2,
  "maxAmmo": 4,
  "visual": {
    "aperture": 0.7,
    "duration": 0.4,
    "rotation": 1
  },
  "events": { ... }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `cooldown` | `float` | Time between attacks in seconds. |
| `maxAmmo` | `int` | Maximum ammunition. `-1` or omit for unlimited. |
| `visual` | `VisualModel` | Weapon visual animation config. |
| `components` | `Dict<string, object>` | Inline component overrides. |

### VisualModel

Controls weapon attack animation appearance:

| Field | Type | Description |
|-------|------|-------------|
| `duration` | `float` | Attack animation duration in seconds. |
| `aperture` | `float` | Angular aperture of the weapon swing (radians). |
| `rotation` | `float` | Rotation multiplier for the attack animation. |

### Example (Macana)

```json
"model": {
  "cooldown": 0.2,
  "maxAmmo": 4,
  "visual": {
    "aperture": 0.7,
    "duration": 0.4,
    "rotation": 1
  },
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
```

---

## ProjectileModel

Defines projectile physics, damage, bouncing, and collision.

```json
"model": {
  "velocity": 300,
  "damage": 2,
  "maxHitNumber": 1,
  "maxBounces": 999,
  "velocityDecrease": 250,
  "killingVelocity": 200,
  "rotationVelocity": 80,
  "verticalSize": 20,
  "horizontalSize": 20,
  "bounceOffMobs": true,
  "isEnemyBullet": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| `velocity` | `float` | Movement speed of the projectile. |
| `damage` | `int` | Damage dealt per hit. |
| `hitNumber` | `int` | Current hit count (runtime state, don't set). |
| `maxHitNumber` | `int` | Max hits before destruction. Higher values = piercing. |
| `maxBounces` | `int` | Max bounces off surfaces. |
| `velocityDecrease` | `float` | Speed lost per bounce. |
| `killingVelocity` | `float` | Minimum velocity to deal damage. Below this, projectile is inert. |
| `rotationVelocity` | `float` | Visual rotation speed of the sprite. |
| `verticalSize` | `float` | Vertical hitbox size in pixels. |
| `horizontalSize` | `float` | Horizontal hitbox size in pixels. |
| `triggerStepOffset` | `float` | Trigger offset per physics step for collision. |
| `isEnemyBullet` | `bool` | If true, damages the player. |
| `collectable` | `bool` | If true, can be picked up after landing. |
| `bounceOffMobs` | `bool` | If true, bounces off mobs instead of being destroyed. |
| `ignoreAttackHimself` | `bool` | If true, can't damage the entity that fired it. |
| `special` | `bool` | Flags for unique gameplay mechanics. |
| `overridingCollisionMask` | `int` | Custom collision mask. Overrides default when non-zero. |
| `effects` | `ProjectileEffect[]` | Effects applied on hit, bounce, or destruction. |

### Additional Fields (from bat projectile)

| Field | Type | Description |
|-------|------|-------------|
| `velocityLimit` | `float` | Maximum velocity cap. |
| `torqueDecrease` | `float` | Rotation speed decay rate. |
| `minTorque` | `float` | Minimum rotation speed. |
| `supersonicVelocity` | `float` | Velocity threshold for supersonic events. |

### Example (Bat Projectile)

```json
{
  "name": "BatProjectile",
  "visualsPath": "Weapons/bat.ase",

  "components": {
    "particle": {
      "startColor": "DarkGray",
      "endColor": "DarkGray",
      "destroyOnEnd": false,
      "settings": {
        "SimulateInWorldSpace": true,
        "ParticleLifespan": 0.5,
        "StartParticleSize": 5,
        "FinishParticleSize": 0,
        "MaxParticles": 10,
        "EmissionRate": 80,
        "EmitterType": "Radial"
      }
    }
  },

  "model": {
    "VerticalSize": 20,
    "HorizontalSize": 20,
    "damage": 2,
    "velocity": 300,
    "velocityDecrease": 250,
    "killingVelocity": 200,
    "supersonicVelocity": 300,
    "rotationVelocity": 80,
    "maxBounces": 999,
    "bounceOffMobs": true,
    "IsEnemyBullet": false,
    "events": {
      "entity": {
        "onMobHit": {
          "commands": [
            "world.player.hitstop 0.2",
            "world.player.weapon.addAmmo 1"
          ]
        },
        "onFired": {
          "commands": ["particle.play", "particle.attach"]
        },
        "onBounce": { "sound": "sound/bat/bounce2" },
        "onDestroy": {
          "commands": ["particle.detach"],
          "particle": { "id": "slash" }
        },
        "onSupersonic": {
          "sound": "sound/bat/momentum",
          "particle": { "id": "explosion" }
        }
      }
    }
  }
}
```

---

## DropModel

Configures drop/pickup physics and collection behavior.

```json
"model": {
  "minStartForce": 50.0,
  "maxStartForce": 150.0,
  "minStartTorque": 5.0,
  "maxStartTorque": 15.0,
  "rotationDampen": 0.95,
  "maxAttractionDistance": 80.0,
  "collectDistance": 12.0,
  "effect": "heal"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `minStartForce` | `float` | Minimum initial launch force. |
| `maxStartForce` | `float` | Maximum initial launch force. |
| `minStartTorque` | `float` | Minimum initial rotation force. |
| `maxStartTorque` | `float` | Maximum initial rotation force. |
| `rotationDampen` | `float` | Rotation dampening factor per frame (0-1). |
| `maxAttractionDistance` | `float` | Distance at which the drop starts moving toward the player. |
| `collectDistance` | `float` | Distance at which the drop is collected. |
| `effect` | `string` | Effect ID applied on collection. |

### Drop Entries (in mob model)

Mobs define what they drop on death:

```json
"model": {
  "drops": [
    { "dropID": "drop.token", "min": 3, "max": 5 },
    { "dropID": "drop.health", "min": 0, "max": 1 }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `dropID` | `string` | Drop entity ID. |
| `min` | `int` | Minimum drop count. |
| `max` | `int` | Maximum drop count. |

---

## PersistentWeaponModel

Extends weapon behavior for weapons that persist across rooms.

```json
{
  "Cooldown": 0.5
}
```

| Field | Type | Description |
|-------|------|-------------|
| `Cooldown` | `float` | Attack cooldown in seconds. |

> **Note:** This model uses PascalCase for field names, unlike other models.

---

## ParticleSpawnModel

Defines particle effects spawned by events.

```json
{
  "id": "muzzle",
  "relX": 8,
  "relY": 0,
  "attach": true,
  "delay": 0.0,
  "renderLayer": 2
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Particle definition ID. |
| `relX` | `int` | Relative X offset from entity. |
| `relY` | `int` | Relative Y offset from entity. |
| `attach` | `bool` | If true, particle follows the entity. |
| `delay` | `float` | Spawn delay in seconds. |
| `renderLayer` | `int` | Render layer for the particle. |

This model is used inline in event definitions:

```json
"onFire": {
  "sound": "sound/bat/gun",
  "particle": {
    "id": "muzzle",
    "relX": 8
  }
}
```
