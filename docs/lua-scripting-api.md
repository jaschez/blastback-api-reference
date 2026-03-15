# Lua Scripting API

Blastback uses [MoonSharp](https://www.moonsharp.org/) (Lua 5.2) as its scripting runtime, running in a **soft sandbox** mode. Lua scripts can define custom components, action resolvers, and state-machine behaviors that integrate with the engine's entity-component system.

## Script Files

Lua scripts live in `Content/Definition/Data/Game/scripts/` and follow a naming convention:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `comp.` | Lua component (has lifecycle hooks) | `comp.combat_momentum.lua` |
| `code.` | Standalone functions (action resolvers, state code) | `code.action_resolvers.lua` |

---

## The `ctx` Object (LuaBridgeContext)

Every Lua function that interacts with the engine receives a `ctx` parameter. This is the bridge between Lua and the entity's command system.

### Command Methods

All command methods resolve a command path on the entity's command tree and execute it. Results are cached after first resolution for performance.

```lua
-- No parameters → returns bool
ctx.command("playerMovement.idle")

-- String parameter → returns bool
ctx.commandS("controlStateMachine.property", "canRefill")

-- Float parameter → returns bool
ctx.commandF("weapon.setAimOffset", 180.0)

-- Two float parameters → returns bool
ctx.commandFF("weapon.attached.shooter.rideable.aimedMomentum", -200.0, angle)

-- Vector2 (x, y) → returns bool
ctx.commandV("weapon.aim", ctx.input.aimX, ctx.input.aimY)

-- Bool parameter → returns bool
ctx.commandB("flip", ctx.input.flipState)
```

### Query Methods

```lua
-- Query a float value from the command tree
local interval = ctx.queryFloat("state.refillInterval")
local angle    = ctx.queryFloat("aimAssist.getCorrectedAngle")
```

### Event Methods

```lua
-- Emit an entity event (triggers the event system)
ctx.emit("onCustomEvent")

-- Notify that Lua property values have changed
-- (fires PropertyReference emitters for any changed values)
ctx.notify()
```

### Input Access

```lua
ctx.input.aimX      -- float: aim direction X
ctx.input.aimY      -- float: aim direction Y
ctx.input.moveX     -- float: movement direction X
ctx.input.moveY     -- float: movement direction Y
ctx.input.flipState -- bool: current facing direction

-- Check a named input action
ctx.input.check("attack")   -- bool
ctx.input.check("interact") -- bool
```

### Config Access

```lua
-- Access JSON config values passed to a lua component
local maxTier = ctx.config.maxTier        -- reads from JSON
local speed   = ctx.config.speedPerTier   -- reads from JSON
```

---

## The `engine` Global

The `engine` global provides factory functions and time utilities.

### `engine.timer(interval, [options])`

Creates a managed timer.

```lua
-- One-shot timer (expires once after 0.5 seconds)
local oneshot = engine.timer(0.5)

-- Repeating timer (expires every 0.4 seconds, auto-resets)
local repeating = engine.timer(0.4, { repeating = true })
```

**Timer methods:**

| Method | Returns | Description |
|--------|---------|-------------|
| `expired()` | `bool` | Returns `true` if the timer has expired. If repeating, auto-resets. |
| `reset()` | `void` | Manually resets the timer to the current time. |

### `engine.buffer()`

Creates an input/action buffer for deferred execution.

```lua
local attackBuffer = engine.buffer()

-- In an input handler:
attackBuffer.set()

-- In update, consume only when a condition is met:
if attackBuffer.consume(function()
    return ctx.command("weapon.canAttack")
end) then
    -- Fire!
end
```

**Buffer methods:**

| Method | Returns | Description |
|--------|---------|-------------|
| `set()` | `void` | Buffer an action. |
| `clear()` | `void` | Clear the buffer. |
| `isSet()` | `bool` | Check if currently buffered. |
| `consume(condition)` | `bool` | If buffered AND `condition()` returns true, clears and returns true. |

### `engine.deltaTime()`

Returns the current frame's delta time in seconds (`float`).

### `engine.totalTime()`

Returns total elapsed time since game start in seconds (`float`).

---

## Lua Component Lifecycle

A Lua component is registered in entity JSON with the `lua:` prefix and defines lifecycle functions in its script file.

### Registration (JSON)

```json
{
  "components": {
    "lua:combat_momentum": {
      "maxTier": 5,
      "speedPerTier": 8,
      "comboTimeout": 1.5,
      "decayInterval": 0.4
    }
  }
}
```

The script ID (`combat_momentum`) maps to `comp.combat_momentum.lua`. The JSON object becomes the `config` table.

### Lifecycle Functions

```lua
-- Called when the component is first loaded.
-- Receives the bridge context and config table.
function init(ctx, config)
    -- Store references, create timers, read config
end

-- Called after init when the entity is fully assembled.
function onAddedToEntity(ctx)
    -- Safe to interact with other components
end

-- Called every frame. dt is delta time in seconds.
function update(ctx, dt)
    -- Per-frame logic
end
```

### Commands

Define commands that other components or the event system can call:

```lua
function commands()
    return {
        onHit = function()
            tier = tier + 1
            ctx.notify()
            return true  -- command succeeded
        end,
        onBreak = function()
            tier = 0
            ctx.notify()
            return true
        end
    }
end
```

Commands are called from the event system or other components via their path:
```json
"onFire": {
  "commands": ["combat_momentum.onHit"]
}
```

### Properties

Define queryable float properties that can drive UI, animations, or other systems:

```lua
function properties()
    return {
        getTier = function()
            return tier
        end,
        getBonus = function()
            return tier * speedPerTier
        end
    }
end
```

Properties are read via `ctx.queryFloat("combat_momentum.getTier")`. Call `ctx.notify()` after changing values to fire emitters to any listeners.

---

## Action Resolvers

Action resolvers are Lua functions used by the `controlHandler` component to process input. Unlike components, they are standalone functions in `code.*.lua` files.

### Registration (JSON)

```json
"controlHandler": {
  "actionMap": {
    "aim":  { "resolver": "lua:action_resolvers.aim" },
    "move": { "resolver": "lua:action_resolvers.move" },
    "idle": { "command": "playerMovement.idle" }
  }
}
```

The format is `lua:scriptID.functionName`. Each function receives only `ctx`:

```lua
-- code.action_resolvers.lua

function aim(ctx)
    ctx.commandV("weapon.aim", ctx.input.aimX, ctx.input.aimY)
end

function flip(ctx)
    ctx.commandB("flip", ctx.input.flipState)
end

function move(ctx)
    ctx.commandV("playerMovement.move", ctx.input.moveX, ctx.input.moveY)
end
```

---

## State Machine Integration

Lua scripts can provide `enter`, `update`, and `exit` functions for control state machine states:

```lua
-- code.player_toss.lua (used as a state script)

local attackBuffer = engine.buffer()

function enter(ctx)
    ctx.commandF("weapon.setAimOffset", ctx.queryFloat("state.tossAimOffset"))
end

function update(ctx)
    if attackBuffer.consume(function()
        return ctx.command("weapon.canAttack")
    end) then
        local momentum = ctx.queryFloat("state.launchMomentum")
        ctx.commandF("weapon.attached.shooter.rideable.momentum", momentum)
    end
end

function exit(ctx)
    ctx.commandF("weapon.setAimOffset", 0)
end
```

---

## Complete Example: Combat Momentum Component

This is the full `comp.combat_momentum.lua` script showing all lifecycle features:

```lua
-- Combat Momentum: rewards consecutive hits with escalating tiers.

local tier = 0
local maxTier = 0
local speedPerTier = 0
local comboWindow = nil
local decayTimer = nil
local ctx = nil

function init(_ctx, config)
    ctx = _ctx
    maxTier = config.maxTier or 5
    speedPerTier = config.speedPerTier or 8
    comboWindow = engine.timer(config.comboTimeout or 1.5)
    decayTimer = engine.timer(config.decayInterval or 0.4, { repeating = true })
end

local function clampTier()
    if tier > maxTier then tier = maxTier end
    if tier < 0 then tier = 0 end
end

function update(_ctx, dt)
    if tier > 0 and comboWindow.expired() then
        if decayTimer.expired() then
            tier = tier - 1
            clampTier()
            ctx.notify()
        end
    end
end

function commands()
    return {
        onHit = function()
            tier = tier + 1
            clampTier()
            comboWindow.reset()
            decayTimer.reset()
            ctx.notify()
            return true
        end,
        onBreak = function()
            local lost = tier
            tier = 0
            if lost > 0 then ctx.notify() end
            return lost > 0
        end
    }
end

function properties()
    return {
        getTier = function() return tier end,
        getBonus = function() return tier * speedPerTier end
    }
end
```

### Entity JSON for this component:

```json
{
  "components": {
    "lua:combat_momentum": {
      "maxTier": 5,
      "speedPerTier": 8,
      "comboTimeout": 1.5,
      "decayInterval": 0.4
    }
  },
  "model": {
    "events": {
      "weapon": {
        "onFire": {
          "commands": ["combat_momentum.onHit"]
        }
      },
      "entity": {
        "onHarmed": {
          "commands": ["combat_momentum.onBreak"]
        }
      }
    }
  }
}
```

---

## Command Path Reference

Commands follow a dot-separated path that maps to the entity's component tree. Here are commonly used paths:

### Player Movement
| Path | Signature | Description |
|------|-----------|-------------|
| `playerMovement.move` | `Vector2 → bool` | Move in direction |
| `playerMovement.idle` | `() → bool` | Stop movement |
| `playerMovement.inertia` | `() → bool` | Continue with inertia |

### Weapon
| Path | Signature | Description |
|------|-----------|-------------|
| `weapon.fire` | `() → bool` | Fire the weapon |
| `weapon.aim` | `Vector2 → bool` | Set aim direction |
| `weapon.canAttack` | `() → bool` | Check if weapon can fire |
| `weapon.setVisible` | `bool → bool` | Show/hide weapon |
| `weapon.setAimOffset` | `float → bool` | Set aim angle offset |
| `weapon.addAmmo` | `float → bool` | Add ammo |

### Shooter
| Path | Signature | Description |
|------|-----------|-------------|
| `weapon.attached.shooter.rideable.momentum` | `float → bool` | Apply launch momentum |
| `weapon.attached.shooter.rideable.aimedMomentum` | `float, float → bool` | Apply aimed momentum |
| `weapon.attached.shooter.rideable.aimToss` | `float → bool` | Aim toss at angle |

### Animator
| Path | Signature | Description |
|------|-----------|-------------|
| `animator.play` | `string → bool` | Play animation |
| `animator.flipX` | `bool → bool` | Set horizontal flip |
| `animator.flinch` | `() → bool` | Play flinch animation |

### Control State Machine
| Path | Signature | Description |
|------|-----------|-------------|
| `controlStateMachine.changeState` | `string → bool` | Change to named state |
| `controlStateMachine.property` | `string → bool` | Query state property |

### Aim Assist
| Path | Signature | Description |
|------|-----------|-------------|
| `aimAssist.hasTarget` | `() → bool` | Check if a target is locked |
| `aimAssist.getCorrectedAngle` | `() → float` | Get corrected aim angle |

### Entity
| Path | Signature | Description |
|------|-----------|-------------|
| `emit` | `string → bool` | Emit an entity event |
| `flip` | `bool → bool` | Set entity facing |
| `fall` | `() → bool` | Trigger fall |
| `destroy` | `() → bool` | Destroy entity |

### Tilemap Detector
| Path | Signature | Description |
|------|-----------|-------------|
| `tilemapDetector.recover` | `() → bool` | Recover to last safe position |
| `tilemapDetector.enable` | `() → bool` | Enable detection |
| `tilemapDetector.disable` | `() → bool` | Disable detection |

### Entity Detector
| Path | Signature | Description |
|------|-----------|-------------|
| `detector.isOnRange` | `string, float, int → bool` | Check if entity is within range |
| `detector.isFurther` | `string, float, int → bool` | Check if entity is beyond distance |
| `detector.isOnRight` | `string → bool` | Check if entity is to the right |

### Particle System
| Path | Signature | Description |
|------|-----------|-------------|
| `particle.play` | `() → bool` | Play particle effect |
| `particle.stop` | `() → bool` | Stop particle effect |
| `particle.attach` | `() → bool` | Attach to entity |
| `particle.detach` | `() → bool` | Detach from entity |

### World Commands
| Path | Signature | Description |
|------|-----------|-------------|
| `world.cam.shake` | `float → bool` | Camera shake |
| `world.cam.hitstop` | `float → bool` | Hitstop effect |
| `world.wait` | `() → bool` | Wait (AI/BT use) |
