# Non-stationary

In the Non-stationary mode the intensity of a shift changes within the episode. It is declared
by the `schedule` field of a shift: the schedule produces a multiplier from the step counter,
and the wrapper applies the multiplier to the intensity of the shift.

## Properties

| Aspect | Non-stationary |
|---|---|
| Built by | A stationary shift and a multiplier that follows a schedule |
| Declared by | The `schedule` field of a `ShiftSpec`, a dictionary |
| Schedule types | `constant`, `linear`, `step`, `sine` |
| Clock | Control steps since the last `reset` |
| Shifts | All six shift sources, for the mode names listed below |
| Without a schedule | The multiplier is 1 at all times |

## Supported shifts

| Shift | Mode names that read the schedule | What the multiplier scales |
|---|---|---|
| [Dynamic shift](../sources/dynamic.md) | `scale`, `translate`, `push`; `gauss` on the target `transition` | The factor, the offset, the force, the noise level |
| [Observation shift](../sources/observation.md) | `gauss`, `uniform`, `shift`, `relative`, `bias`, `adversarial` | The noise level, the offset, the radius |
| [Action shift](../sources/action.md) | `gauss`, `uniform`, `shift`, `oppose`, `rotate`, `oppose_goal`, `adversarial` | The noise level, the offset, the magnitude, the angle |
| [Reward/cost shift](../sources/reward-cost.md) | `gauss`, `uniform`, `shift` | The noise level, the offset |
| [Latency shift](../sources/latency.md) | `substep`, `interp` | The excess of the control period, the delay |
| [Semantic shift](../sources/semantic.md) | `hue`, `tint`, `swap`, `scale`, `translate` | The angle, the blend with the target colour, the factor, the offset |

**`set`, `fixed`, `buffer` and `delay` do not read the schedule.** The mode names `gauss`,
`uniform` and `loguniform` on a Dynamic shift or a Semantic shift read it, but then draw a new
value at every step; they are left out of the table for that reason.

## Supported schedules

| Type | Shape of the multiplier |
|---|---|
| `constant` | Equal to `start` at all times |
| `linear` | Equal to `start` until step `t0`, then a straight ramp that reaches `end` at step `t1`, then equal to `end` |
| `step` | Equal to `start` before step `t1` and to `end` from step `t1` on |
| `sine` | An oscillation between `start` and `end` with a period of `period` steps; it begins at the midpoint and moves towards `end` first |

| Key | Type | Default | Used by |
|---|---|---|---|
| `type` | str | `"constant"` | |
| `start` | float | `0.0` | all types |
| `end` | float | `1.0` | `linear`, `step`, `sine` |
| `t0` | float | `0` | `linear` |
| `t1` | float | `1` | `linear`, `step` |
| `period` | float | `1000` | `sine` |

The multiplier of each type, for the first nine steps:

```python
from robustrllib.schedule import make_schedule

SCHEDULES = {
    "none":     None,
    "constant": {"type": "constant", "start": 0.5},
    "linear":   {"type": "linear", "start": 1.0, "end": 0.8, "t0": 2, "t1": 6},
    "step":     {"type": "step", "start": 1.0, "end": 0.8, "t1": 4},
    "sine":     {"type": "sine", "start": 0.8, "end": 1.2, "period": 8},
}
for name, spec in SCHEDULES.items():
    multiplier = make_schedule(spec)
    print(f"{name:9s}", [round(multiplier(t), 2) for t in range(9)])
```

```text
none      [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
constant  [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
linear    [1.0, 1.0, 1.0, 0.95, 0.9, 0.85, 0.8, 0.8, 0.8]
step      [1.0, 1.0, 1.0, 1.0, 0.8, 0.8, 0.8, 0.8, 0.8]
sine      [1.0, 1.14, 1.2, 1.14, 1.0, 0.86, 0.8, 0.86, 1.0]
```

## Declare the mode

On a Dynamic shift the multiplier acts on the parameter itself: the value is the nominal value
times `factor` times the multiplier. The factor range is written into `start` and `end`, with
`factor: 1.0`.

```python
import numpy as np
from robustrllib import make_robust, ShiftSpec

env = make_robust("Hopper-v5", shifts=[ShiftSpec(
    "dynamics", "scale", {"param": "gravity", "factor": 1.0},
    schedule={"type": "linear", "start": 1.0, "end": 1.2, "t0": 0, "t1": 4},
)], seed=0)

env.reset(seed=0)
factors = []
for t in range(6):
    env.step(np.zeros(3))
    factors.append(round(float(env.unwrapped.model.opt.gravity[2]) / -9.81, 3))
print(factors)

env.reset(seed=1)
env.step(np.zeros(3))
print(round(float(env.unwrapped.model.opt.gravity[2]) / -9.81, 3))
```

```text
[1.0, 1.05, 1.1, 1.15, 1.2, 1.2]
1.0
```

The multiplier is held at `end` once `t1` is passed, and the clock starts again at zero after
the second `reset`.

On an Observation shift the multiplier scales the noise level. The noise below grows from zero
to its full level over the first 500 steps.

```python
ramp = ShiftSpec("observation", "gauss", {"sigma": 0.1},
                 schedule={"type": "linear", "start": 0.0, "end": 1.0, "t0": 0, "t1": 500})
```

On an Action shift, an opposition that switches on in the middle of the episode:

```python
switch = ShiftSpec("action", "oppose", {"eps": 0.2, "clip_first": True},
                   schedule={"type": "step", "start": 0.0, "end": 1.0, "t1": 500})
```

In YAML the schedule is one more key of the shift.

```yaml title="robustrllib/configs/eval/part2_hopper.yaml (excerpt, one line per condition)"
- {name: gear_static_0.8, channel: theta_p, shifts: [{target: dynamics, mode: scale, params: {param: actuator_gear, index: all, factor: 0.8}}]}
- {name: gear_ramp_0.8, channel: theta_p, shifts: [{target: dynamics, mode: scale, params: {param: actuator_gear, index: all, factor: 1.0}, schedule: {type: linear, start: 1.0, end: 0.8, t0: 0, t1: 1000}}]}
- {name: gear_sine_p500, channel: theta_p, shifts: [{target: dynamics, mode: scale, params: {param: actuator_gear, index: all, factor: 1.0}, schedule: {type: sine, start: 0.8, end: 1.2, period: 500}}]}
```

| Condition | Gear factor during the episode |
|---|---|
| `gear_static_0.8` | 0.8 throughout; a Parametric shift for comparison |
| `gear_ramp_0.8` | Falls in a straight line from 1.0 to 0.8 over 1000 steps |
| `gear_sine_p500` | Oscillates between 0.8 and 1.2 with a period of 500 steps |

!!! note
    A curriculum over training is not a schedule, because the clock restarts with every
    episode.

## Rules

- **`start` is always written**; it defaults to 0, so `schedule={}` and
  `schedule={"type": "constant"}` give a multiplier of 0.
- A multiplier of 0 switches an additive shift off and sets a scaled parameter to zero.
- A scheduled `scale` shift uses `factor: 1.0` and carries the factor range in `start` and
  `end`.
- Values of `t1` and `period` stay within the length of an episode, because the clock restarts
  at every `reset`.
- A drawn mode name with `operation: set` needs `nominal`, the value a multiplier of 0 maps to.
- A stochastic Dynamic shift is not given a schedule.
- `interp` reads the multiplier when its delay is drawn, so a delay that changes within the
  episode needs `resample: step`.
