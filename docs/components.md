# Components Reference

Components are the building blocks of entity behavior. They are defined in the `components` object of an entity JSON file.

## Common Components

These components can be used on any entity type.

### animator

Handles sprite animation playback and triggers.

```json
"animator": {
  "triggers": {
    "walk": { "step": 4 }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `triggers` | `Dict<string, Dict<string, int>>` | Animation triggers. Each trigger maps frame indices to event names. |

**Commands:**

| Command | Signature | Description |
|---------|-----------|-------------|
| `animator.play` | `string, int → void` | Play animation with mode (0=once, 1=loop, 2=pingpong). |
| `animator.forcePlay` | `string, int → void` | Force restart animation. |
| `animator.playLoop` | `string → void` | Play animation looping. |
| `animator.flipX` | `bool → void` | Set horizontal flip. |
| `animator.isRunning` | `() → bool` | Check if animation is playing. |
| `animator.flinch` | `() → void` | Play flinch animation. |
| `animator.fall` | `() → void` | Play fall animation. |
| `animator.squash` | `float, float → void` | Squash/stretch (scaleX, scaleY). |

**Events:** `{triggerName}.{frameName}` — fires when an animation trigger frame is reached.

---

### animatorTrigger

Defines animation trigger mappings for the animator.

```json
"animatorTrigger": {
  "triggers": {
    "attack": { "hit": 3, "end": 6 }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `triggers` | `Dict<string, Dict<string, int>>` | Maps animation names to frame-event pairs. |

---

### spawner

Spawns entities on demand.

```json
"spawner": {
  "id": "projectile.shell"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Default entity ID to spawn. |

**Commands:**

| Command | Description |
|---------|-------------|
| `spawner.spawn` | Spawn the configured entity. |
| `spawner.preload` | Preload the entity for instant spawning. |
| `spawner.setID` | Change the entity ID to spawn. |

---

### trigger

Listens for trigger/collision events.

```json
"trigger": {
  "enabled": true,
  "whitelist": ["mob.player"]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `enabled` | `bool` | Whether the trigger listener is active. |
| `whitelist` | `string[]` | Entity IDs allowed to activate this trigger. Empty = all. |

---

### lua:{scriptID}

Lua-scripted component. See [lua-scripting-api.md](lua-scripting-api.md) for full documentation.

```json
"lua:combat_momentum": {
  "maxTier": 5,
  "speedPerTier": 8
}
```

The JSON object is passed as `config` to the Lua script's `init` function.

---

## Mob Components

Components specific to mob entities (player, enemies, NPCs).

### mobComponent

Core mob behavior. Configured through the entity model, not directly in components.

```json
"mobComponent": {
  "commandMap": { "customCmd": "internalCmd" }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `commandMap` | `Dict<string, string>` | Command aliases for this mob. |

Model-level fields (in `model`):

| Field | Type | Description |
|-------|------|-------------|
| `maxHP` | `int` | Maximum health points. |
| `cost` | `int` | Spawn cost for room generation. |
| `customDeath` | `bool` | Use custom death handling. |

---

### controlHandler

Maps input actions to commands or Lua resolvers.

```json
"controlHandler": {
  "actionMap": {
    "aim":    { "resolver": "lua:action_resolvers.aim" },
    "move":   { "resolver": "lua:action_resolvers.move" },
    "idle":   { "command": "playerMovement.idle" },
    "attack": { "command": "weapon.fire" }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `actionMap` | `Dict<string, ActionDef>` | Maps action names to either `command` paths or `resolver` references. |

Each action is either:
- `{ "command": "path.to.command" }` — calls a command directly
- `{ "resolver": "lua:scriptID.funcName" }` — calls a Lua function with `ctx`

**Commands:**

| Command | Description |
|---------|-------------|
| `controlHandler.registerAction` | `string, string → void` — Register a new action at runtime. |
| `controlHandler.enableControl` | `() → void` — Enable input processing. |

---

### input

Provides input state to the entity.

```json
"input": {
  "profile": "input.player",
  "handlers": { "command": "command" }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `profile` | `string` | Input profile ID to use. |
| `handlers` | `Dict<string, string>` | Input handler mappings. |

---

### interactionHandler

Handles entity interactions (e.g. talking to NPCs, opening chests).

```json
"interactor": {
  "radius": 20.0
}
```

| Field | Type | Description |
|-------|------|-------------|
| `radius` | `float` | Interaction detection radius. |

**Commands:** `interactor.interact` — Trigger interaction.

---

### playerMovement

Player-specific movement with velocity and behavior states.

```json
"playerMovement": {
  "velocity": 120,
  "behaviors": {
    "dash": { "distance": 50, "duration": 0.2 }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `velocity` | `float` | Base movement speed. |
| `behaviors` | `Dict<string, Dict<string, float>>` | Movement behavior configurations. |

**Commands:**

| Command | Description |
|---------|-------------|
| `playerMovement.move` | `Vector2 → void` — Move in direction. |
| `playerMovement.idle` | `() → void` — Stop movement. |
| `playerMovement.inertia` | `() → void` — Continue with inertia. |
| `playerMovement.startDash` | `float, float → void` — Start dash (distance, duration). |
| `playerMovement.isDashComplete` | `() → bool` — Check if dash finished. |

---

### movement.basic

Simple movement for non-player mobs.

```json
"movement.basic": {
  "velocity": 60
}
```

| Field | Type | Description |
|-------|------|-------------|
| `velocity` | `float` | Movement speed. |

---

### steeringMovement

Steering-behavior-based movement for AI entities.

```json
"steeringMovement": {
  "behaviors": {
    "seek": { "weight": 1.0 },
    "flee": { "weight": 0.5 }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `behaviors` | `Dict<string, Dict<string, float>>` | Steering behavior configurations with parameters. |

---

### levitation

Floating/hovering behavior for flying enemies.

```json
"levitation": {
  "ampX": 2.0,
  "ampY": 3.0,
  "offX": 0.0,
  "offY": -7.0,
  "speed": 1.0
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ampX` | `float` | Horizontal oscillation amplitude. |
| `ampY` | `float` | Vertical oscillation amplitude. |
| `offX` | `float` | Horizontal position offset. |
| `offY` | `float` | Vertical position offset. |
| `speed` | `float` | Oscillation speed. |

**Commands:** `levitation.start`, `levitation.stop`

**Example** (from `mob.yaka.json`):
```json
"levitation": {
  "ampY": 3,
  "ampX": 2,
  "offY": -7
}
```

---

### ai

Attaches a behavior tree to the entity for AI decision-making. See [behavior-trees.md](behavior-trees.md) for full documentation.

```json
"ai": {
  "templateID": "patrol_chase",
  "resolution": { ... }
}
```

Or with an inline template:

```json
"ai": {
  "template": {
    "type": "sequence",
    "children": { ... }
  },
  "resolution": { ... }
}
```

**Commands:** `ai.log` — Debug log message.

**Events:** `{nodeID}.onStart`, `{nodeID}.onEnd` — Fired when BT nodes start/end.

---

### controlStateMachine

Finite state machine for entity control states.

```json
"controlStateMachine": {
  "templateID": "player"
}
```

**Commands:**

| Command | Description |
|---------|-------------|
| `controlStateMachine.changeState` | `string → void` — Transition to named state. |
| `controlStateMachine.property` | `string → bool` — Query a state property. |
| `controlStateMachine.currentState` | `() → string` — Get current state name. |

---

### weapon (handler)

Attaches a weapon to the entity.

```json
"weapon": {
  "id": "weapon.macana",
  "isPersistent": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Weapon entity ID to attach. |
| `isPersistent` | `bool` | If true, weapon persists between rooms. |

**Commands:**

| Command | Description |
|---------|-------------|
| `weapon.fire` | Fire the weapon. |
| `weapon.aim` | `Vector2 → void` — Set aim direction. |
| `weapon.canAttack` | `() → bool` — Check if ready to fire. |
| `weapon.setVisible` | `bool → void` — Show/hide weapon. |
| `weapon.setAimOffset` | `float → void` — Set aim angle offset. |
| `weapon.addAmmo` | `float → void` — Add ammo. |

**Events:** `onFire`, `attachWeapon`

---

### aimAssist

Provides aim assist targeting.

```json
"aimAssist": {
  "radius": 120,
  "targetClearingTimeout": 0.6
}
```

**Commands:**

| Command | Description |
|---------|-------------|
| `aimAssist.hasTarget` | `() → bool` — Check if a target is locked. |
| `aimAssist.getCorrectedAngle` | `() → float` — Get corrected aim angle. |

---

### stamina

Stamina/energy system.

```json
"stamina": {
  "initialContainers": 4,
  "maxContainers": 3,
  "recoveryMultiplier": 10,
  "containerThreshold": 100
}
```

**Commands:** `stamina.getContainers` — `() → int`

---

### tilemapDetector

Detects when entities walk over pits/holes in the tilemap.

```json
"tilemapDetector": {}
```

**Commands:**

| Command | Description |
|---------|-------------|
| `tilemapDetector.recover` | Recover to last safe position. |
| `tilemapDetector.enable` | Enable detection. |
| `tilemapDetector.disable` | Disable detection. |

**Events:** `onFall`

---

### detector (Entity Detector)

Detects other entities by distance and angle.

```json
"detector": {}
```

**Commands:**

| Command | Signature | Description |
|---------|-----------|-------------|
| `detector.isOnRange` | `string, float, int → bool` | Entity within range on layer. |
| `detector.isFurther` | `string, float, int → bool` | Entity beyond distance on layer. |
| `detector.isBetween` | `string, float, float → bool` | Entity between min/max distance. |
| `detector.isOnSight` | `string, float, int → bool` | Entity visible at angle on layer. |
| `detector.isOnRight` | `string → bool` | Entity is to the right. |
| `detector.isOnLeft` | `string → bool` | Entity is to the left. |

---

### tweener

Provides tweening animations for position and rotation.

```json
"tweener": {}
```

**Commands:**

| Command | Description |
|---------|-------------|
| `tweener.position` | `float, float, float, string → void` — Tween to (x, y) over duration with easing. |
| `tweener.positionVector` | `Vector2, float, string → void` — Tween to vector. |
| `tweener.rotate` | `float, float, string → void` — Rotate to angle. |
| `tweener.lockRotToMove` | `float → void` — Lock rotation to movement direction. |

---

## Weapon Components

These components are used on weapon entities.

### melee

Melee weapon behavior with hitbox and deflection.

```json
"melee": {
  "hitBoxSize": 40.0,
  "attackDuration": 0.3,
  "canHit": false,
  "playerFriendly": true,
  "damage": 10,
  "deflection": {
    "momentum": 200,
    "hitstop": 0.4,
    "camShake": 1
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `hitBoxSize` | `float` | Melee attack hitbox size in pixels. |
| `attackDuration` | `float` | Duration of the attack in seconds. |
| `canHit` | `bool` | Whether melee can deal direct damage. |
| `playerFriendly` | `bool` | If true, won't damage the player. |
| `damage` | `int` | Base damage per hit. |
| `deflection` | `DeflectionModel` | Projectile deflection configuration. |

**Deflection fields:**

| Field | Type | Description |
|-------|------|-------------|
| `momentum` | `float` | Deflection launch momentum. |
| `hitstop` | `float` | Hitstop duration on deflect. |
| `camShake` | `float` | Camera shake intensity on deflect. |

**Events:** `onDeflect`

---

### shooter

Ranged weapon that fires projectiles.

```json
"shooter": {
  "defaultProjectileID": "projectile.shell",
  "projectilesPerShot": 1,
  "playerFriendly": true,
  "projectileVelocity": 200.0,
  "addedDamage": 5.0,
  "gunPointX": 8.0,
  "gunPointY": -2.0
}
```

| Field | Type | Description |
|-------|------|-------------|
| `projectileVelocity` | `float` | Override velocity for spawned projectiles. |
| `projectileIDs` | `string[]` | Available projectile entity IDs. |
| `defaultProjectileID` | `string` | Default projectile entity ID. |
| `projectilesPerShot` | `int` | Number of projectiles per shot (e.g. shotgun). |
| `playerFriendly` | `bool` | If true, projectiles won't damage the player. |
| `addedDamage` | `float` | Bonus damage on top of projectile base damage. |
| `gunPointX` | `float` | X offset of projectile spawn point. |
| `gunPointY` | `float` | Y offset of projectile spawn point. |

**Events:** `shooter.onFire`

---

### shooter.rideable

Extended shooter that the player "rides" (thrown weapon mechanic).

```json
"shooter.rideable": {
  "defaultProjectileID": "projectile.bat",
  "addedCooldown": 0.3,
  "projectilesPerShot": 1,
  "playerFriendly": true,
  "commandMap": {
    "toss": "attack",
    "aimToss": "aimAttack"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `avoidDamage` | `bool` | If true, player avoids damage while riding. |
| *(inherits shooter fields)* | | |

**Commands:**

| Command | Description |
|---------|-------------|
| `weapon.attached.shooter.rideable.momentum` | `float → void` — Apply launch momentum. |
| `weapon.attached.shooter.rideable.aimedMomentum` | `float, float → void` — Apply aimed momentum. |
| `weapon.attached.shooter.rideable.canRecover` | `() → bool` — Check if can recover. |
| `weapon.attached.shooter.rideable.recover` | `() → void` — Recover weapon. |

**Events:** `shooter.rideable.onFire`, `shooter.rideable.onRecover`

---

### weaponComponent

Base weapon configuration (model-level).

```json
"model": {
  "cooldown": 0.2,
  "maxAmmo": 4,
  "visual": { ... }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `cooldown` | `float` | Time between attacks in seconds. |
| `maxAmmo` | `int` | Maximum ammo capacity. |
| `visual` | `VisualModel` | Weapon visual animation config. |

---

## UI Components

Components for building UI entities.

### uiEntity

Base UI entity component.

```json
"uiEntity": {
  "renderLayer": 1,
  "offsetX": 10,
  "offsetY": 5,
  "color": "#ffffff",
  "value": ""
}
```

| Field | Type | Description |
|-------|------|-------------|
| `renderLayer` | `int` | UI render layer. |
| `offsetX` | `int` | Horizontal offset. |
| `offsetY` | `int` | Vertical offset. |
| `color` | `string` | Color value (hex or named). |
| `value` | `string` | Text or display value. |

---

### bar

UI bar element (health bars, progress bars).

```json
"bar": {
  "maxValueRef": "mob.player.stamina.getContainers",
  "valueRef": "mob.player.combat_momentum.getTier",
  "backgroundColor": "#333333",
  "width": 64,
  "height": 8
}
```

| Field | Type | Description |
|-------|------|-------------|
| `maxValueRef` | `string` | Property reference path for the max value. |
| `valueRef` | `string` | Property reference path for the current value. |
| `backgroundColor` | `string` | Background color of the bar. |
| `width` | `int` | Bar width in pixels. |
| `height` | `int` | Bar height in pixels. |

Property references use command paths to query float values from any entity's properties.

---

### barGroup

Groups multiple bar elements (e.g. stamina containers).

```json
"barGroup": {
  "barAmountRef": "mob.player.stamina.getContainers",
  "currentBarIndexRef": "...",
  "currentBarPercRef": "...",
  "barID": "ui.staminaBar",
  "spacing": 4
}
```

| Field | Type | Description |
|-------|------|-------------|
| `barAmountRef` | `string` | Property reference for total bar count. |
| `currentBarIndexRef` | `string` | Property reference for active bar index. |
| `currentBarPercRef` | `string` | Property reference for active bar fill percentage. |
| `barID` | `string` | Entity ID of the bar template. |
| `spacing` | `int` | Pixel spacing between bars. |

---

### button

Clickable UI button.

```json
"button": {
  "width": 100,
  "height": 32
}
```

| Field | Type | Description |
|-------|------|-------------|
| `width` | `int` | Button width in pixels. |
| `height` | `int` | Button height in pixels. |

---

### text

UI text display.

```json
"text": {
  "hAlign": "Center",
  "vAlign": "Center"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `hAlign` | `HorizontalAlign` | Horizontal alignment (Left, Center, Right). |
| `vAlign` | `VerticalAlign` | Vertical alignment (Top, Center, Bottom). |

---

### image

UI image display.

```json
"image": {
  "visuals": "UI/icon.ase"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `visuals` | `string` | Path to the image asset. |

---

### comic

Displays comic/cutscene panels.

```json
"comic": {
  "data": "comic_intro"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `data` | `string` | Comic data ID to display. |

---

### selectionGroup

Groups selectable UI elements.

```json
"selectionGroup": {
  "upgradeAmt": 3
}
```

| Field | Type | Description |
|-------|------|-------------|
| `upgradeAmt` | `int` | Number of upgrade options to display. |

---

### upgradeGroup

Groups upgrade UI elements.

```json
"upgradeGroup": {
  "upgradeAmt": 3
}
```

| Field | Type | Description |
|-------|------|-------------|
| `upgradeAmt` | `int` | Number of upgrade slots. |

---

### inputTrigger

Triggers animations/effects on input.

```json
"inputTrigger": {
  "amplitude": 2.0,
  "frecuency": 1.0,
  "offset": 0.0
}
```

| Field | Type | Description |
|-------|------|-------------|
| `amplitude` | `float` | Effect amplitude. |
| `frecuency` | `float` | Effect frequency. |
| `offset` | `float` | Phase offset. |

---

### wander

Makes UI elements wander/float randomly.

```json
"wander": {
  "amplitude": 3.0
}
```

| Field | Type | Description |
|-------|------|-------------|
| `amplitude` | `float` | Wander movement amplitude. |

---

### waver

Oscillating wave effect for UI elements.

```json
"waver": {
  "amplitude": 2.0,
  "frecuency": 1.0,
  "offset": 0.0
}
```

| Field | Type | Description |
|-------|------|-------------|
| `amplitude` | `float` | Wave amplitude. |
| `frecuency` | `float` | Wave frequency. |
| `offset` | `float` | Phase offset. |
