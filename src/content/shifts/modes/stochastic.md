# Stochastic

In the Stochastic mode the intervention is drawn at random. The wrapper of the shift draws it
from a random generator of its own, which is seeded, so that a stochastic shift is reproducible.

## Properties

| Aspect | Stochastic |
|---|---|
| Built by | A draw from the seeded generator of the wrapper |
| Declared by | One of nine mode names |
| Mode names | `gauss`, `uniform`, `loguniform`, `relative`, `bias`, `buffer`, `substep`, `interp`, `push` |
| Drawn | At every step, once per episode, or once per push, depending on the mode name |
| Shifts | All six shift sources |
| Reproducibility | A seed passed to `make_robust` or to `reset` fixes every draw |

## Supported shifts

| Shift | Mode names it accepts in this mode |
|---|---|
| [Dynamic shift](../sources/dynamic.md) | `gauss`, `uniform`, `loguniform`, `push`; `gauss` on the target `transition` |
| [Observation shift](../sources/observation.md) | `gauss`, `uniform`, `relative`, `bias` |
| [Action shift](../sources/action.md) | `gauss`, `uniform` |
| [Reward/cost shift](../sources/reward-cost.md) | `gauss`, `uniform` |
| [Latency shift](../sources/latency.md) | `buffer`, `substep`, `interp` |
| [Semantic shift](../sources/semantic.md) | `gauss`, `uniform`, `loguniform` |

The same mode name means an additive draw on a signal and a multiplicative draw on a physical
parameter.

| Mode name | On observation, action, reward and cost | On physical and appearance parameters |
|---|---|---|
| `gauss` | Noise is added; `sigma` defaults to `0.05` | A factor is drawn around `mu`, which defaults to `1.0` |
| `uniform` | Noise is added; bounds default to plus and minus `0.1` | A factor is drawn between `low` and `high`, which default to `0.8` and `1.2` |
| `loguniform` | Not accepted | A factor is drawn uniformly in log space, so that halving and doubling are equally likely |

When the draw happens:

| Mode names | Shift | Drawn |
|---|---|---|
| `gauss`, `uniform`, `relative` | Observation shift, Action shift, Reward/cost shift | At every step |
| `gauss` on the target `transition` | Dynamic shift | After every step |
| `bias` | Observation shift | Once per episode |
| `gauss`, `uniform`, `loguniform` | Dynamic shift, Semantic shift | Once per episode, at `reset` |
| `push` | Dynamic shift | Direction at every push; phase once per episode |
| `buffer`, `interp` | Latency shift | Once per episode, or at every step with `resample: step` |
| `substep` | Latency shift | Rate once per episode; period at every step |

## Declare the mode

On an Observation shift, per-step noise and a per-episode offset:

```python
from robustrllib import make_robust, ShiftSpec

noise = ShiftSpec("observation", "gauss", {"sigma": 0.05})
offset = ShiftSpec("observation", "bias", {"low": -0.05, "high": 0.05})
```

On a Dynamic shift, a factor that is drawn at every `reset` and held for the episode:

```python
import numpy as np

env = make_robust("Hopper-v5", shifts=[
    ShiftSpec("dynamics", "uniform", {"param": "gravity", "low": 0.8, "high": 1.2}),
], seed=0)

for seed in (0, 1):
    env.reset(seed=seed)
    at_reset = env.unwrapped.model.opt.gravity[2]
    env.step(np.zeros(3))
    after_step = env.unwrapped.model.opt.gravity[2]
    print(seed, round(at_reset / -9.81, 3), at_reset == after_step)
```

```text
0 1.14 True
1 0.916 True
```

On a Latency shift, an action delay of zero to two control steps:

```python
delay = ShiftSpec("latency", "buffer", {"low": 0, "high": 2})
```

The training environment of domain randomization is a list of stochastic Dynamic shifts, one
per randomized parameter.

```yaml title="robustrllib/configs/experiment/dr_sac_hopper.yaml (excerpt)"
hparams:
  randomize:
  - {target: dynamics, mode: uniform, params: {param: gravity, low: 0.9, high: 1.1}}
  - {target: dynamics, mode: uniform, params: {param: body_pos_xyz, index: all, low: 0.9, high: 1.1}}
  - {target: dynamics, mode: uniform, params: {param: actuator_gear, index: all, low: 0.9, high: 1.1}}
```

```python
randomization = [
    ShiftSpec("dynamics", "uniform", {"param": "gravity", "low": 0.9, "high": 1.1}),
    ShiftSpec("dynamics", "uniform", {"param": "body_pos_xyz", "index": "all", "low": 0.9, "high": 1.1}),
    ShiftSpec("dynamics", "uniform", {"param": "actuator_gear", "index": "all", "low": 0.9, "high": 1.1}),
]
env = make_robust("Hopper-v5", shifts=randomization, seed=0)
```

Every shift draws from a stream of its own, so the three factors are independent.

```python
env.reset(seed=0)
model = env.unwrapped.model
print(round(model.opt.gravity[2] / -9.81, 3), round(model.actuator_gear[0, 0] / 200.0, 3))
```

```text
1.07 1.048
```

!!! note
    The random part of three mode names can be removed by their parameters. Equal bounds make
    the delay of `buffer` and `interp` constant, and a fixed `direction` leaves only the phase
    of `push` random.

## Rules

- Every stochastic shift is given a seed, through `make_robust` or through `reset`.
- `sigma` and the bounds of noise on a signal are given in the units of that signal.
- The draws of a Dynamic shift and of a Semantic shift are factors on the nominal value, unless
  `operation: set` is written.
- `loguniform` is written for wide multiplicative ranges and needs positive bounds.
- A stochastic Dynamic shift is not combined with a schedule, because it would then draw at
  every step.
- **Two shifts with the same target, mode name, parameter and index draw the same numbers**;
  listing a noise shift twice adds the same noise twice.
- An evaluation grid prefers a Parametric mode name for the scales of a shift factor, because
  a stochastic one adds variance of its own to every condition.
