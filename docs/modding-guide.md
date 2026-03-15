# Modding Guide

This guide covers how to create custom content for Blastback using JSON entity definitions and Lua scripts.

## Project Structure

```
Content/Definition/Data/Game/
├── entities/
│   ├── mob/           # Player and enemy entities
│   ├── weapons/       # Weapon entities
│   ├── projectile/    # Projectile entities
│   ├── drop/          # Pickup/drop entities
│   ├── props/         # Environmental objects
│   └── ui/            # UI entities
├── scripts/           # Lua scripts
│   ├── comp.*.lua     # Lua components
│   └── code.*.lua     # Action resolvers / state code
└── spriteAnimations/  # Animation definitions
```

## Creating a Custom Enemy

### 1. Basic Enemy

Create a file like `mob.myenemy.json` in the `entities/mob/` folder:

```json
{
  "name": "MyEnemy",
  "visualsPath": "Mobs/myenemy.ase",
  "physicsLayer": 3,
  "collisionLayerMask": [2, 8],
  "colliderSizeX": 16,
  "colliderSizeY": 16,

  "components": {
    "animator": {}
  },

  "model": {
    "maxHP": 3,
    "cost": 2,
    "drops": [
      { "dropID": "drop.token", "min": 2, "max": 4 }
    ]
  }
}
```

Key points:
- `physicsLayer: 3` = Enemy layer
- `collisionLayerMask: [2, 8]` = Collides with Player (2) and Melee Impacts (8)
- `cost` determines spawn weight in room generation

### 2. Adding AI

Add an `ai` component with a behavior tree:

```json
"components": {
  "animator": {},
  "movement.basic": { "velocity": 40 },
  "detector": {},
  "ai": {
    "template": {
      "type": "selector",
      "children": {
        "sequence.chase": {
          "children": {
            "playerInRange": {},
            "moveToPlayer": {}
          }
        },
        "idle": {}
      }
    },
    "resolution": {
      "playerInRange": {
        "commands": ["detector.isOnRange mob.player 100 2"]
      },
      "moveToPlayer": {
        "commands": ["movement.moveTowards mob.player"]
      },
      "idle": {
        "commands": ["world.wait"]
      }
    }
  }
}
```

### 3. Adding Events

React to game events with sounds, particles, and commands:

```json
"model": {
  "maxHP": 3,
  "events": {
    "entity": {
      "onDeath": {
        "sound": "sound/enemy/death",
        "particle": { "id": "explosion" }
      },
      "onHarmed": {
        "sound": "sound/enemy/hurt",
        "commands": ["animator.flinch"]
      }
    }
  }
}
```

## Creating a Custom Weapon

### Ranged Weapon

```json
{
  "name": "PlasmaGun",
  "visualsPath": "Weapons/plasmagun.ase",

  "components": {
    "shooter": {
      "defaultProjectileID": "projectile.plasma",
      "projectilesPerShot": 1,
      "playerFriendly": true,
      "gunPointX": 10,
      "gunPointY": 0
    }
  },

  "model": {
    "cooldown": 0.15,
    "maxAmmo": 12,
    "visual": {
      "aperture": 0.3,
      "duration": 0.2,
      "rotation": 0
    },
    "events": {
      "shooter": {
        "onFire": {
          "sound": "sound/weapons/plasma",
          "particle": { "id": "muzzle", "relX": 10 }
        }
      }
    }
  }
}
```

### Melee Weapon

```json
{
  "name": "Sword",
  "visualsPath": "Weapons/sword.ase",

  "components": {
    "melee": {
      "hitBoxSize": 32,
      "attackDuration": 0.25,
      "canHit": true,
      "playerFriendly": true,
      "damage": 8
    }
  },

  "model": {
    "cooldown": 0.3,
    "visual": {
      "aperture": 1.2,
      "duration": 0.25,
      "rotation": 1
    }
  }
}
```

### Hybrid Weapon (Melee + Ranged)

The Macana shows how to combine melee and ranged:

```json
"components": {
  "melee": {
    "hitBoxSize": 40,
    "attackDuration": 0.3,
    "canHit": false,
    "playerFriendly": true,
    "deflection": { "momentum": 200, "hitstop": 0.4 }
  },
  "shooter.rideable": {
    "defaultProjectileID": "projectile.bat",
    "projectilesPerShot": 1,
    "playerFriendly": true,
    "commandMap": { "toss": "attack", "aimToss": "aimAttack" }
  },
  "shooter": {
    "defaultProjectileID": "projectile.shell",
    "projectilesPerShot": 1,
    "playerFriendly": true
  }
}
```

## Creating a Custom Projectile

```json
{
  "name": "PlasmaProjectile",
  "visualsPath": "Projectiles/plasma.ase",

  "model": {
    "velocity": 250,
    "damage": 3,
    "maxHitNumber": 1,
    "maxBounces": 0,
    "verticalSize": 6,
    "horizontalSize": 6,
    "isEnemyBullet": false,
    "events": {
      "entity": {
        "onDestroy": {
          "particle": { "id": "plasma_hit" }
        }
      }
    }
  }
}
```

### Bouncing Projectile

```json
"model": {
  "velocity": 300,
  "damage": 2,
  "maxBounces": 999,
  "velocityDecrease": 250,
  "killingVelocity": 200,
  "bounceOffMobs": true,
  "rotationVelocity": 80,
  "events": {
    "entity": {
      "onBounce": { "sound": "sound/projectile/bounce" }
    }
  }
}
```

## Writing Lua Components

### 1. Create the Script File

Create `comp.my_component.lua` in `Content/Definition/Data/Game/scripts/`:

```lua
local ctx = nil
local myValue = 0

function init(_ctx, config)
    ctx = _ctx
    myValue = config.initialValue or 0
end

function update(_ctx, dt)
    -- Per-frame logic
end

function commands()
    return {
        increment = function()
            myValue = myValue + 1
            ctx.notify()
            return true
        end,
        reset = function()
            myValue = 0
            ctx.notify()
            return true
        end
    }
end

function properties()
    return {
        getValue = function()
            return myValue
        end
    }
end
```

### 2. Register in Entity JSON

```json
"components": {
  "lua:my_component": {
    "initialValue": 10
  }
}
```

### 3. Use in Events

```json
"events": {
  "entity": {
    "onHarmed": {
      "commands": ["my_component.reset"]
    }
  },
  "weapon": {
    "onFire": {
      "commands": ["my_component.increment"]
    }
  }
}
```

### 4. Read from Other Lua Scripts

```lua
local value = ctx.queryFloat("my_component.getValue")
```

## Writing Action Resolvers

Create `code.my_resolvers.lua` for custom input handling:

```lua
function customAim(ctx)
    -- Custom aim logic with dead zone
    local x = ctx.input.aimX
    local y = ctx.input.aimY
    local len = math.sqrt(x * x + y * y)

    if len > 0.3 then  -- dead zone
        ctx.commandV("weapon.aim", x, y)
    end
end
```

Register in entity JSON:

```json
"controlHandler": {
  "actionMap": {
    "aim": { "resolver": "lua:my_resolvers.customAim" }
  }
}
```

## Physics Layer Reference

| ID | Layer | Use for |
|----|-------|---------|
| 1 | Tilemap | World geometry |
| 2 | Player | Player entity |
| 3 | Enemy | Enemy mobs |
| 4 | Projectile | Bullets, thrown objects |
| 5 | Weapon | Weapon entities |
| 6 | Props | Destructible objects, furniture |
| 7 | Drop | Pickups, collectibles |
| 8 | Melee Impacts | Melee attack hitboxes |
| 10 | Particle | Particle effects |

## Common Patterns

### Combo System

Use a Lua component with timers:

```lua
local combo = 0
local window = engine.timer(2.0)

function commands()
    return {
        hit = function()
            combo = combo + 1
            window.reset()
            ctx.notify()
            return true
        end
    }
end

function update(ctx, dt)
    if combo > 0 and window.expired() then
        combo = 0
        ctx.notify()
    end
end
```

### Buffered Input

Use `engine.buffer()` for responsive controls:

```lua
local attackBuffer = engine.buffer()

function onAttack(ctx)
    if ctx.command("weapon.canAttack") then
        ctx.command("weapon.fire")
    else
        attackBuffer.set()
    end
end

function update(ctx)
    if attackBuffer.consume(function()
        return ctx.command("weapon.canAttack")
    end) then
        ctx.command("weapon.fire")
    end
end
```

### Property-Driven UI

Connect Lua properties to UI bars:

```json
// Entity with Lua component
"lua:rage_meter": { "maxRage": 100 }

// UI bar entity
"bar": {
  "maxValueRef": "mob.player.rage_meter.getMax",
  "valueRef": "mob.player.rage_meter.getCurrent",
  "width": 64,
  "height": 6
}
```

## Tips

- **File naming**: Entity files use the pattern `{type}.{name}.json` (e.g. `mob.slime.json`, `weapon.macana.json`)
- **Sprites**: Support `.ase` (Aseprite), `.png`, and `.atlas` formats
- **Physics layer -1**: Disables physics collision entirely. Combine with `isTrigger: true` for non-physical entities
- **Command maps**: Use `commandMap` to expose internal commands under different names
- **Events**: Always define events in `model.events`, not in components
- **Lua locals**: Variables declared `local` at script level persist across frames within that component instance
- **Notify**: Always call `ctx.notify()` after changing property values so UI and other listeners update
