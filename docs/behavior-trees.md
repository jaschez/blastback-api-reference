# Behavior Trees (AI System)

Blastback uses behavior trees (BTs) for AI decision-making. BTs are defined inline in entity JSON or as separate template files.

## Overview

A behavior tree is a hierarchical structure of nodes that are evaluated each tick. Each node returns **success**, **failure**, or **running**. The tree traverses nodes based on their type until a decision is reached.

## BT Node Structure

```json
{
  "type": "sequence",
  "children": {
    "nodeID": {
      "type": "selector",
      "children": { ... }
    },
    "anotherNode": {}
  }
}
```

Each node is identified by its key name (the `nodeID`). The `type` field determines behavior. If no `type` is given, the node type is inferred from the key name.

## Node Types

### Composite Nodes

| Type | Description |
|------|-------------|
| `sequence` | Runs children left-to-right. Fails if any child fails. Succeeds if all succeed. |
| `selector` | Runs children left-to-right. Succeeds if any child succeeds. Fails if all fail. |
| `parallel` | Runs all children simultaneously. |

### Leaf Nodes

Leaf nodes have no `children`. They execute commands defined in the `resolution` section:

```json
"isNear": {}
```

The node `isNear` is resolved via the `resolution` map to determine what commands to execute.

### Decorator Nodes

| Type | Description |
|------|-------------|
| `inverter` | Inverts the child's result (success↔failure). |
| `repeater` | Repeats the child N times. |
| `cooldown` | Adds a cooldown between executions. |
| `timeout` | Fails if the child doesn't complete in time. |

## Resolution System

The `resolution` object maps leaf node IDs to their actual behavior:

```json
"ai": {
  "template": {
    "type": "sequence",
    "children": {
      "parallel": {
        "children": {
          "lookAtPlayer": {},
          "select": {
            "children": {
              "sequence.stand": {
                "children": {
                  "isNear": {},
                  "stand": {}
                }
              },
              "sequence.levitate": {
                "children": {
                  "isFar": {},
                  "levitate": {}
                }
              }
            }
          }
        }
      }
    }
  },
  "resolution": {
    "lookAtPlayer": {
      "commands": ["animator.flipX {detector.isOnRight mob.player}"]
    },
    "isNear": {
      "commands": ["detector.isOnRange mob.player 40 2"]
    },
    "isFar": {
      "commands": ["detector.isFurther mob.player 100 2"]
    },
    "stand": {
      "commands": ["world.wait"]
    },
    "levitate": {
      "commands": ["world.wait"]
    }
  }
}
```

### Resolution Commands

Each resolution entry has a `commands` array. Commands use the same path format as event commands:

```json
"resolution": {
  "checkRange": {
    "commands": ["detector.isOnRange mob.player 60 2"]
  },
  "attack": {
    "commands": ["weapon.fire"]
  }
}
```

### Command Argument Interpolation

Commands can interpolate values from other commands using `{command args}` syntax:

```json
"commands": ["animator.flipX {detector.isOnRight mob.player}"]
```

This calls `detector.isOnRight` with `mob.player`, then passes the result to `animator.flipX`.

## Templates

### Inline Templates

Define the tree directly in the entity's `ai` component:

```json
"ai": {
  "template": {
    "type": "sequence",
    "children": { ... }
  },
  "resolution": { ... }
}
```

### Referenced Templates

Reference a shared BT template file by ID:

```json
"ai": {
  "templateID": "patrol_chase"
}
```

Template files are stored as `bt.{templateID}.json`.

## AI Events

Behavior tree nodes emit events when they start and end. These events are defined in the entity model under `events.ai`:

```json
"model": {
  "events": {
    "ai": {
      "stand.onStart": {
        "commands": [
          "animator.play transform 2",
          "levitation.stop"
        ]
      },
      "levitate.onStart": {
        "commands": [
          "animator.play back 2",
          "levitation.start"
        ]
      }
    }
  }
}
```

| Event | Description |
|-------|-------------|
| `{nodeID}.onStart` | Fired when a leaf node starts executing. |
| `{nodeID}.onEnd` | Fired when a leaf node finishes. |

## Complete Example: Yaka (Flying Enemy)

```json
{
  "name": "Yaka",
  "visualsPath": "Mobs/yaka.ase",
  "physicsLayer": -1,
  "isTrigger": true,

  "components": {
    "levitation": { "ampY": 3, "ampX": 2, "offY": -7 },
    "detector": {},
    "animator": {},
    "ai": {
      "template": {
        "type": "sequence",
        "children": {
          "parallel": {
            "children": {
              "lookAtPlayer": {},
              "select": {
                "children": {
                  "sequence.stand": {
                    "children": {
                      "isNear": {},
                      "stand": {}
                    }
                  },
                  "sequence.levitate": {
                    "children": {
                      "isFar": {},
                      "levitate": {}
                    }
                  }
                }
              }
            }
          }
        }
      },
      "resolution": {
        "lookAtPlayer": {
          "commands": ["animator.flipX {detector.isOnRight mob.player}"]
        },
        "isNear": {
          "commands": ["detector.isOnRange mob.player 40 2"]
        },
        "isFar": {
          "commands": ["detector.isFurther mob.player 100 2"]
        },
        "stand": { "commands": ["world.wait"] },
        "levitate": { "commands": ["world.wait"] }
      }
    }
  },

  "model": {
    "maxHP": 100000,
    "events": {
      "ai": {
        "stand.onStart": {
          "commands": ["animator.play transform 2", "levitation.stop"]
        },
        "levitate.onStart": {
          "commands": ["animator.play back 2", "levitation.start"]
        }
      }
    }
  }
}
```

**How it works:**
1. The `parallel` node runs `lookAtPlayer` and a `selector` simultaneously
2. `lookAtPlayer` continuously flips the sprite to face the player
3. The selector tries `sequence.stand` first: if the player is near (`isNear`), it stands and transforms
4. If not near, it tries `sequence.levitate`: if the player is far (`isFar`), it levitates
5. AI events trigger animations when nodes start: `stand.onStart` plays the transform animation and stops levitation
