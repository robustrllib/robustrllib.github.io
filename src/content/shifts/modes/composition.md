# Composition

In the Composition mode several shifts act at once. It is declared by the list of shifts: every
entry becomes one wrapper, and the order of the list is the order in which the wrappers are
stacked.

## Properties

| Aspect | Composition |
|---|---|
| Built by | One wrapper per shift, stacked on the task |
| Declared by | The order of the `shifts` list |
| Order | The first entry sits closest to the task |
| Shifts | Every shift source, in any combination |
| Seeding | Pipeline seed, per-shift seed and reset seed |
| Limit | One physical parameter and index is addressed by one shift only |

## Supported shifts

Every mode name of every shift can be part of a composition.

| Shift | Mode names it accepts in this mode |
|---|---|
| [Dynamic shift](../sources/dynamic.md) | `scale`, `set`, `translate`, `gauss`, `uniform`, `loguniform`, `push`; `gauss` on the target `transition` |
| [Observation shift](../sources/observation.md) | `gauss`, `uniform`, `relative`, `bias`, `shift`, `adversarial` |
| [Action shift](../sources/action.md) | `gauss`, `uniform`, `shift`, `adversarial`, `oppose`, `rotate`, `oppose_goal` |
| [Reward/cost shift](../sources/reward-cost.md) | `gauss`, `uniform`, `shift` |
| [Latency shift](../sources/latency.md) | `fixed`, `buffer`, `substep`, `interp`, `delay` |
| [Semantic shift](../sources/semantic.md) | `hue`, `tint`, `swap`, `scale`, `set`, `translate`, `gauss`, `uniform`, `loguniform` |

## Declare the mode

```python
import numpy as np
from robustrllib import make_robust, ShiftSpec

env = make_robust("Hopper-v5", shifts=[
    ShiftSpec("dynamics", "scale", {"param": "gravity", "factor": 1.2}),
    ShiftSpec("dynamics", "scale", {"param": "actuator_gear", "index": "all", "factor": 0.8}),
    ShiftSpec("latency", "fixed", {"steps": 1}),
    ShiftSpec("observation", "gauss", {"sigma": 0.05}),
], seed=0)
env.reset(seed=0)
print(env)
```

```text
<ObservationShift<LatencyShift<DynamicsShift<DynamicsShift<RobustCoreWrapper<TimeLimit<OrderEnforcing<PassiveEnvChecker<HopperEnv<Hopper-v5>>>>>>>>>>
```

The same composition as a condition of an evaluation grid:

```yaml
- name: gravity_gear_delay_noise
  shifts:
    - {target: dynamics, mode: scale, params: {param: gravity, factor: 1.2}}
    - {target: dynamics, mode: scale, params: {param: actuator_gear, index: all, factor: 0.8}}
    - {target: latency, mode: fixed, params: {steps: 1}}
    - {target: observation, mode: gauss, params: {sigma: 0.05}}
```

A composition of a Semantic shift and a displacement crosses two axes in one condition.

```python
crossed = [
    ShiftSpec("appearance", "hue", {"geom": "torso_geom", "degrees": 120}),
    ShiftSpec("dynamics", "translate", {"param": "body_pos_xyz", "index": "foot",
                                        "offset": [0.06, 0.0, 0.0]}),
]
env = make_robust("Hopper-v5", shifts=crossed, seed=0)
```

Two Dynamic shifts on the same parameter and index do not multiply. **Each sets the parameter
from its nominal value, and the later one wins**; the pipeline emits a `UserWarning`.

```python
env = make_robust("Hopper-v5", shifts=[
    ShiftSpec("dynamics", "scale", {"param": "gravity", "factor": 1.2}),
    ShiftSpec("dynamics", "scale", {"param": "gravity", "factor": 1.5}),
], seed=0)
env.reset(seed=0)
gravity_z = round(float(env.unwrapped.model.opt.gravity[2]), 3)
```

Gravity ends at -14.715, which is 1.5 times its nominal value and not 1.8 times.

## Stacking order

A call to `step` enters at the outermost wrapper and travels inward; the observation travels
back outward.

| Direction | Processed first | Consequence |
|---|---|---|
| The action, inward | The last shift in the list | `[latency, action]` delays the noisy command; `[action, latency]` adds noise to the delayed command |
| The observation, outward | The first shift in the list | A later shift sees the output of the earlier ones |
| `reset` | The Dynamic shift recomputes the first observation | The output of the wrappers inside it is replaced |

```python
gravity = ShiftSpec("dynamics", "scale", {"param": "gravity", "factor": 1.3})
noise = ShiftSpec("observation", "gauss", {"sigma": 0.05})

for label, shifts in [("dynamics, observation", [gravity, noise]),
                      ("observation, dynamics", [noise, gravity])]:
    env = make_robust("Hopper-v5", shifts=shifts, seed=0)
    obs, _ = env.reset(seed=0)
    noisy_reset = not np.allclose(obs, env.unwrapped._get_obs())
    obs, *_ = env.step(np.zeros(3))
    noisy_step = not np.allclose(obs, env.unwrapped._get_obs())
    print(f"{label:24s}reset noisy: {noisy_reset}   step noisy: {noisy_step}")
```

```text
dynamics, observation   reset noisy: True   step noisy: True
observation, dynamics   reset noisy: False   step noisy: True
```

With the Observation shift listed first, **the first observation of every episode reaches the
policy without noise**.

## Seeding and reproducibility

Every shift wrapper owns a random generator.

| Seed | Set by | Takes effect |
|---|---|---|
| Pipeline seed | `make_robust(..., seed=s)` | At construction, for shifts without a seed of their own |
| Per-shift seed | `ShiftSpec(..., seed=s)` | At construction, for that shift |
| Reset seed | `env.reset(seed=s)` | At that reset, for the task and every wrapper; overrides both |

```python
def trace(pipeline_seed, reset_seed, spec_seed=None, steps=5):
    env = make_robust("Hopper-v5", shifts=[
        ShiftSpec("observation", "gauss", {"sigma": 0.05}, seed=spec_seed),
    ], seed=pipeline_seed)
    obs, _ = env.reset(seed=reset_seed)
    out = [obs]
    for _ in range(steps):
        obs, *_ = env.step(np.zeros(3))
        out.append(obs)
    env.close()
    return np.array(out)


print("same seeds              ", np.array_equal(trace(0, 0), trace(0, 0)))
print("pipeline seed differs   ", np.array_equal(trace(0, 7), trace(5, 7)))
print("per-shift seed differs  ", np.array_equal(trace(0, 7, spec_seed=1), trace(0, 7, spec_seed=2)))
print("reset seed differs      ", np.array_equal(trace(0, 7), trace(0, 8)))
```

```text
same seeds               True
pipeline seed differs    True
per-shift seed differs   True
reset seed differs       False
```

Once `reset` receives a seed, that seed alone determines the rollout. An evaluator that resets
an episode with the same seed under every condition obtains paired conditions.

The generator of a wrapper is seeded with the seed and a salt. The salt is a hash of the target,
the mode name and the `param` and `index` entries of the parameters, and it is stable across
processes, so different shifts draw independently from one seed.

!!! tip
    The action space has a generator of its own. A rollout that uses
    `env.action_space.sample()` calls `env.action_space.seed(s)` first.

## Rules

- The list order is the stacking order; the first shift sits closest to the task.
- Dynamic shifts are listed before Observation shifts.
- One physical parameter and index is addressed by one shift only.
- **Two shifts with the same target, mode name, parameter and index share a salt**; listing the
  same noise shift twice adds the same noise twice.
- Every rollout that is compared with another is reset with a seed.
- A per-shift seed separates two shifts only as long as `reset` is called without a seed.
