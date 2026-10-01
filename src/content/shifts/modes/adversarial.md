# Adversarial

In the Adversarial mode the intervention is computed to counter the policy. It is a function of
the action the policy just chose, or of the observation the policy is about to read, and it
needs no training of an adversary.

## Properties

| Aspect | Adversarial |
|---|---|
| Built by | A computation on the current action or observation |
| Declared by | The mode name `adversarial`, or one of `oppose`, `rotate`, `oppose_goal` |
| On an Action shift | The parameter `kind` chooses one of three members |
| On an Observation shift | A gradient search that needs the actor of the policy |
| Shifts | Observation shift and Action shift |
| Reproducibility | The search starts from a point drawn from the seeded generator of the wrapper |

## Supported shifts

| Shift | Mode names it accepts in this mode |
|---|---|
| [Observation shift](../sources/observation.md) | `adversarial` |
| [Action shift](../sources/action.md) | `adversarial`, `oppose`, `rotate`, `oppose_goal` |
| [Dynamic shift](../sources/dynamic.md) | none |
| [Reward/cost shift](../sources/reward-cost.md) | none |
| [Latency shift](../sources/latency.md) | none |
| [Semantic shift](../sources/semantic.md) | none |

The three members on an Action shift:

| Member | What it does | Defined for |
|---|---|---|
| `oppose` | Subtracts the magnitude `eps` along the direction of the action | Every continuous action space |
| `rotate` | Turns the action by `degrees` and keeps its magnitude | Two-dimensional action spaces |
| `oppose_goal` | Removes the share `eps` of the component that points at the goal | Goal-conditioned maze tasks |

The parameters on an Observation shift:

| Parameter | Type | Default | Meaning |
|---|---|---|---|
| `eps` | float | `0.05` | Radius of the ball around the true observation, in the maximum norm and in raw units |
| `steps` | int | `10` | Iterations of the gradient search; at least 1 |
| `actor` | callable | `None` | The policy, from a float32 tensor of shape `[1, obs_dim]` to the action tensor, with the graph intact |

## Declare the mode

### On an Action shift

```python
from robustrllib import make_robust, ShiftSpec

by_kind = ShiftSpec("action", "adversarial", {"kind": "oppose", "eps": 0.2})
by_name = ShiftSpec("action", "oppose", {"eps": 0.2})
default = ShiftSpec("action", "adversarial", {"eps": 0.2})      # kind defaults to "oppose"
```

The three declarations build the same shift. On a maze task the other two members are
available.

```python
env = make_robust("PointMaze_UMaze-v3", shifts=[
    ShiftSpec("action", "adversarial", {"kind": "oppose_goal", "eps": 1.0}),
], seed=0)
env = make_robust("PointMaze_UMaze-v3", shifts=[
    ShiftSpec("action", "adversarial", {"kind": "rotate", "degrees": 60}),
], seed=0)
```

### On an Observation shift

At every step the wrapper searches the ball of radius `eps` around the true observation for
the point that changes the deterministic action of the policy the most. The search is a
projected gradient ascent of `steps` iterations from a random starting point.

```python
import numpy as np
import torch

torch.manual_seed(0)
weights = torch.randn(3, 11)


def actor(obs):
    return torch.tanh(obs @ weights.T)


EPS = 0.05
attack = ShiftSpec("observation", "adversarial", {"eps": EPS, "steps": 10, "actor": actor})
noise = ShiftSpec("observation", "uniform", {"low": -EPS, "high": EPS})
```

The snippet compares the attack with uniform noise of the same radius, on a fixed action
sequence. It reports whether every observation stayed inside the ball, whether the state of the
simulator equals that of the unshifted run, and how far the action of the actor moved on
average.

```python
def rollout(shifts, steps=5):
    env = make_robust("Hopper-v5", shifts=shifts, seed=0)
    obs, _ = env.reset(seed=0)
    shown, state = [obs], [env.unwrapped._get_obs()]
    for action in np.random.default_rng(0).uniform(-1, 1, size=(steps, 3)):
        obs, *_ = env.step(action)
        shown.append(obs)
        state.append(env.unwrapped._get_obs())
    env.close()
    return np.array(shown), np.array(state)


def moved(shown, state):
    with torch.no_grad():
        a = actor(torch.as_tensor(shown, dtype=torch.float32))
        b = actor(torch.as_tensor(state, dtype=torch.float32))
    return round(float((a - b).norm(dim=1).mean()), 3)


_, nominal_state = rollout([])
for name, spec in [("adversarial", attack), ("uniform", noise)]:
    shown, state = rollout([spec])
    inside = bool(np.all(shown >= state - EPS) and np.all(shown <= state + EPS))
    print(f"{name:12s} inside the ball: {inside}   state unchanged: "
          f"{np.array_equal(state, nominal_state)}   action moved by: {moved(shown, state)}")
```

```text
adversarial  inside the ball: True   state unchanged: True   action moved by: 0.378
uniform      inside the ball: True   state unchanged: True   action moved by: 0.093
```

The actions are fixed in this snippet, so the state is the same in both runs. In closed loop
the policy acts on the perturbed observation, and that is how the shift changes the trajectory.

### Attach the actor afterwards

A specification that comes from a YAML file cannot hold a function. The environment is built
first, and `bind_actor` attaches the actor to every adversarial Observation shift of the stack.

```python
from robustrllib import RobustConfig, bind_actor

config = RobustConfig.from_dict({"env_id": "Hopper-v5", "seed": 0, "shifts": [
    {"target": "observation", "mode": "adversarial", "params": {"eps": 0.05, "steps": 10}},
]})
env = config.make()
print(bind_actor(env, actor))
```

```text
1
```

The return value is the number of wrappers that received the actor. A stack without an
adversarial Observation shift returns 0.

!!! note
    `baselines/evaluate.py` binds the actor of the evaluated policy, which the method's loader
    exposes as `actor`, so the attack cells of `robustrllib/configs/eval/part2_hopper.yaml` run
    on every feed-forward policy with the same search.

## Rules

- **An adversarial Observation shift receives its actor before the first `reset`**; without one
  the `reset` raises `ValueError`.
- The actor keeps the computation graph intact, because the search differentiates through it.
- The observation normalization of the policy belongs inside the actor, so that `eps` is
  measured in raw observation units for every method.
- An adversarial Observation shift is written for array observations; a dictionary observation
  is flattened first.
- A radius of 0 leaves the observation unchanged.
- **`rotate` and `oppose_goal` keep their limits under the mode name `adversarial`**; on a task
  that does not meet them the first `step` raises `ValueError`.
- A value of `kind` other than the three members raises `ValueError` when the environment is
  built.
