# Parametric

In the Parametric mode the intervention is fixed by its parameters. Nothing is drawn and nothing
depends on the policy, so the same declaration gives the same shifted task in every episode.

## Properties

| Aspect | Parametric |
|---|---|
| Built by | The values written in `params` |
| Declared by | One of nine mode names |
| Mode names | `shift`, `scale`, `set`, `translate`, `fixed`, `delay`, `hue`, `tint`, `swap` |
| Variance | None of its own; every episode sees the same intervention |
| Shifts | All six shift sources |
| Typical use | The severity axis of an evaluation grid |

## Supported shifts

| Shift | Mode names it accepts in this mode |
|---|---|
| [Dynamic shift](../sources/dynamic.md) | `scale`, `set`, `translate` |
| [Observation shift](../sources/observation.md) | `shift` |
| [Action shift](../sources/action.md) | `shift` |
| [Reward/cost shift](../sources/reward-cost.md) | `shift` |
| [Latency shift](../sources/latency.md) | `fixed`, `delay` |
| [Semantic shift](../sources/semantic.md) | `hue`, `tint`, `swap`, `scale`, `set`, `translate` |

| Mode name | What the parameters fix |
|---|---|
| `shift` | A constant added to every component of an observation or action, or to the reward |
| `scale` | A factor on the nominal value of a physical or appearance parameter |
| `set` | An absolute value of a physical or appearance parameter |
| `translate` | An offset in metres on a position |
| `fixed` | A number of control steps by which every action is delayed |
| `delay` | A number of control steps by which the reward is paid late |
| `hue` | An angle by which a colour is rotated in hue |
| `tint` | A saturated colour that replaces the colour of a geom |
| `swap` | Two geoms that exchange their colours |

## Declare the mode

On a Dynamic shift, a factor on the nominal value:

```python
from robustrllib import make_robust, ShiftSpec

env = make_robust("Hopper-v5", shifts=[
    ShiftSpec("dynamics", "scale", {"param": "gravity", "factor": 1.3}),
], seed=0)

for seed in (0, 1):
    env.reset(seed=seed)
    print(seed, round(env.unwrapped.model.opt.gravity[2], 3))
```

```text
0 -12.753
1 -12.753
```

The factor is relative to the nominal value of -9.81, and it is applied again at every `reset`
without compounding.

On a Dynamic shift, an absolute value for a parameter whose nominal value is zero:

```python
friction = ShiftSpec("dynamics", "set", {"param": "dof_frictionloss", "index": "all", "value": 0.5})
```

On an Observation shift and an Action shift, a constant offset:

```python
sensor_offset = ShiftSpec("observation", "shift", {"shift": 0.01})
trim = ShiftSpec("action", "shift", {"shift": 0.05, "clip_first": True})
```

On a Latency shift, a constant action delay:

```python
delay = ShiftSpec("latency", "fixed", {"steps": 1})
```

On a Semantic shift, a colour rotation and a displacement:

```python
colour = ShiftSpec("appearance", "hue", {"geom": "torso_geom", "degrees": 60})
offset = ShiftSpec("dynamics", "translate", {"param": "body_pos_xyz", "index": "foot",
                                             "offset": [0.06, 0.0, 0.0]})
```

A severity axis is a ladder of parametric shifts that differ in one number.

```yaml title="robustrllib/configs/eval/t0_mujoco.yaml (excerpt)"
grid:
  - {name: nominal, shifts: [], severity: 1.0}
  - {name: gravity_0.8, severity: 0.8, shifts: [{target: dynamics, mode: scale, params: {param: gravity, factor: 0.8}}]}
  - {name: gravity_0.9, severity: 0.9, shifts: [{target: dynamics, mode: scale, params: {param: gravity, factor: 0.9}}]}
  - {name: gravity_1.1, severity: 1.1, shifts: [{target: dynamics, mode: scale, params: {param: gravity, factor: 1.1}}]}
  - {name: gravity_1.2, severity: 1.2, shifts: [{target: dynamics, mode: scale, params: {param: gravity, factor: 1.2}}]}
```

The same ladder in Python:

```python
ladder = {
    f"gravity_{factor}": [ShiftSpec("dynamics", "scale", {"param": "gravity", "factor": factor})]
    for factor in (0.8, 0.9, 1.1, 1.2)
}
for name, shifts in ladder.items():
    env = make_robust("Hopper-v5", shifts=shifts, seed=0)
    env.reset(seed=0)
    print(name, round(env.unwrapped.model.opt.gravity[2], 3))
```

```text
gravity_0.8 -7.848
gravity_0.9 -8.829
gravity_1.1 -10.791
gravity_1.2 -11.772
```

!!! tip
    A parametric shift becomes a Non-stationary one by adding a `schedule`. For `scale` the
    factor range is then written into the schedule, with `factor: 1.0`.

## Rules

- A parametric shift carries every number it needs in `params`; a required one that is missing
  raises `KeyError`.
- `scale` is relative to the nominal value; `set` is absolute.
- `set` is written when the nominal value is zero, because a factor cannot move it.
- `translate` is written for a displacement, because a factor moves an entity by an amount that
  depends on its distance from the origin of the parent frame.
- One parameter and index is addressed by one shift only; of two shifts on the same parameter
  the later one wins.
- `fixed` and `delay` count control steps, not seconds.
- `delay`, and `shift` on a Reward/cost shift, are applied during training; the other
  parametric shifts act on a frozen policy.
