# Add an Algorithm

A new method is a class with four methods. It is registered from a configuration file, without
an edit to the library, and runs through the same two commands as the built-in methods.

## Summary

| Aspect | Custom algorithm |
|---|---|
| Interface | A subclass of `Algo` with `train`, `predict`, `save` and `load` |
| Registration | The `class` key of an algorithm config, written `module.path:ClassName` |
| Configuration | `hparams` of the algorithm config, passed to the constructor |
| Training | `baselines/train.py -c <experiment.yaml>`, through the generic trainer `baselines/train_algo.py` |
| Evaluation | `baselines/evaluate.py --run <run directory>`, on the experiment card's grid |
| Limits | The generic trainer calls `train` once with the whole budget |

## The interface

`Algo` is defined in the module `robustrllib.algos.base`.

```python
from robustrllib.algos import Algo

print(sorted(Algo.__abstractmethods__))
```

```text
['load', 'predict', 'save', 'train']
```

| Member | Signature | Contract | Called by |
|---|---|---|---|
| Constructor | `__init__(self, **hparams)` | Accepts the `hparams` of the card as keyword arguments | `build_algo` |
| `train` | `train(self, env, total_timesteps, seed=None)` | Fits the policy on `env` | `baselines/train_algo.py` |
| `predict` | `predict(self, obs, deterministic=True)` | Returns the action for one observation | `baselines/evaluate.py` |
| `save` | `save(self, path)` | Writes what `load` needs to `path` | `baselines/train_algo.py`, after training |
| `load` | `load(cls, path, **kwargs)`, a class method | Returns an instance ready for `predict` | `load_algo` |

The evaluator calls `load` with `env=`, `device=` and `config=`, the resolved configuration of
the run, from which the template reads its `hparams`.
**A subclass that leaves out one of the four methods cannot be instantiated**: Python raises
`TypeError: Can't instantiate abstract class`.

## Implement a method

The module `robustrllib.algos.template_reinforce` is a minimal REINFORCE written to be copied.
The command prints the location of the file.

```bash
python -c "import robustrllib.algos.template_reinforce as m; print(m.__file__)"
```

The constructor takes hyperparameters as keyword arguments. The trailing `**_` swallows keys the
class does not know.

```python
class Reinforce(Algo):  # <-- your algorithm body
    def __init__(self, lr=3e-4, gamma=0.99, hidden=(64, 64), device="cpu", **_):
        super().__init__()
        self.lr, self.gamma, self.hidden, self.device = lr, gamma, tuple(hidden), device
        self.policy = None
```

`train` reads the dimensions from the spaces of the environment and owns the training loop.

```python
    def _build(self, env):
        obs_dim = int(np.prod(env.observation_space.shape))
        act_dim = int(np.prod(env.action_space.shape))
        self.policy = _Policy(obs_dim, act_dim, self.hidden).to(self.device)
        self.opt = torch.optim.Adam(self.policy.parameters(), lr=self.lr)

    def train(self, env, total_timesteps, seed=None):
        self._build(env)
        env.action_space.seed(seed)
        steps = 0
        while steps < total_timesteps:
            obs, _ = env.reset(seed=seed)
            ...
```

`predict` maps one observation to one action, as a NumPy array.

```python
    def predict(self, obs, deterministic=True):
        t = torch.as_tensor(np.asarray(obs), dtype=torch.float32, device=self.device)
        with torch.no_grad():
            dist = self.policy.dist(t)
            a = dist.mean if deterministic else dist.sample()
        return a.cpu().numpy()
```

`load` rebuilds the network from the environment and the run's hyperparameters, and restores
the weights.

```python
    def save(self, path):
        torch.save(self.policy.state_dict(), path)

    @classmethod
    def load(cls, path, env=None, device="cpu", config=None, **kwargs):
        hparams = dict((config or {}).get("algorithm", {}).get("hparams") or {})
        algo = cls(device=device, **hparams)
        algo._build(env)
        algo.policy.load_state_dict(torch.load(path, map_location=algo.device))
        return algo
```

The training loop uses only `reset` and `step`, so it does not need to know which shifts are
stacked on the environment. **`save` and `load` use the path as given**; the trainer names the
file and the evaluator finds it.

## Register a method

Registration is one line in an algorithm config.

```yaml title="robustrllib/configs/algorithm/reinforce.yaml"
# A custom algorithm plugged in by import path: the REINFORCE template of
# robustrllib.algos, trained by the generic Algo trainer. No edit to the library is needed.
name: reinforce
entry: baselines/train_algo.py
class: robustrllib.algos.template_reinforce:Reinforce
checkpoint: last
hparams:
  lr: 0.0003
  gamma: 0.99
  hidden: [64, 64]
```

| Key | Meaning |
|---|---|
| `name` | A label |
| `entry` | The training script; `baselines/train_algo.py` trains any `Algo` class |
| `class` | `module.path:ClassName`, importable from the root of the checkout |
| `checkpoint` | Which checkpoint the evaluator loads: `last` |
| `hparams` | Keyword arguments of the constructor |

The contract can be checked before any training. A budget of zero timesteps builds the network
without running an episode.

```python
import os
import tempfile

import numpy as np
from robustrllib import make_robust
from robustrllib.algos import Algo, build_algo, load_algo

CLASS = "robustrllib.algos.template_reinforce:Reinforce"

env = make_robust("Hopper-v5", seed=0)
algo = build_algo("reinforce", cls=CLASS, lr=0.0003, gamma=0.99, hidden=[64, 64])
algo.train(env, total_timesteps=0, seed=0)

obs, _ = env.reset(seed=0)
action = algo.predict(obs, deterministic=True)
print(type(algo).__name__, isinstance(algo, Algo), action.shape)

with tempfile.TemporaryDirectory() as tmp:
    path = os.path.join(tmp, "step_0.pt")
    algo.save(path)
    clone = load_algo("reinforce", path, cls=CLASS, env=env)
    print(os.listdir(tmp), np.allclose(clone.predict(obs), action))
```

```text
Reinforce True (3,)
['step_0.pt'] True
```

## Run a method

An experiment card names the algorithm, the task, the grid and the budget. Every section is a
path to a card or an inline mapping.

```yaml title="examples/reinforce_hopper.yaml"
name: reinforce_hopper
algorithm: robustrllib/configs/algorithm/reinforce.yaml
task: robustrllib/configs/task/hopper.yaml
eval: robustrllib/configs/eval/part1_mujoco.yaml
train: {steps: 20000}
```

```bash
python baselines/train.py -c examples/reinforce_hopper.yaml --seed 0
python baselines/evaluate.py --run runs/reinforce_hopper/seed0
```

| Step | Call |
|---|---|
| Build | `make_env(task, shifts=train.shifts, seed)`, the task card's environment |
| Train | `algo.train(env, total_timesteps=train.steps, seed=seed)` |
| Save | `algo.save("<run>/ckpt/step_<steps>.pt")` |
| Evaluate | `Reinforce.load(...)`, then every condition of the grid, 20 episodes each |

!!! tip
    `--train-shift <arm>` trains under a shift of `robustrllib/configs/train_shifts.yaml`, and an
    experiment card may list its own under `train.shifts`, in the dictionary form of the grid.
    The shifts and their mode names are listed under
    [Shift Sources and Modes](../shifts/index.md).

## Evaluation and metrics

The evaluator prints one row per condition and writes `<run>/eval/<grid>.json`.

| Metric | Scope | Meaning |
|---|---|---|
| `return_mean`, `return_std`, `return_min` | Condition | Episodic return over the episodes of the condition |
| `cvar` | Condition | Mean of the worst 10% of the episodes |
| `score` | Condition | `100 (R - R_min) / (R_max - R_min)` with the task card's anchors |
| `success_rate` | Condition | Share of episodes that report success, where the task does |
| `returns` | Condition | The return of every episode |

The evaluator applies the [Evaluation Protocol](../evaluation/protocol.md) to any class that
follows the contract.

| Assumption | Detail |
|---|---|
| Checkpoint location | The highest-numbered file in `<run>/ckpt/` |
| Path used verbatim | `save(path)` writes exactly `path`, and `load(path)` reads exactly `path` |
| `load` keywords | `load` is called with `env=`, `device=` and `config=` |
| Card references | Paths relative to the root of the checkout |

## Registration rules

- A method subclasses `Algo` and implements all four methods.
- The constructor accepts every key of `hparams` as a keyword argument.
- The module named in `class` is importable from the directory where the launcher runs.
- `predict` returns one action for one observation and honours `deterministic=True`.
- `save` and `load` agree on the file name, and use the path verbatim for the shared evaluator.
- The training loop uses only `reset` and `step`, so that it runs on any shifted environment.
- An optional `reset()` method is called by the evaluator before every episode, for policies
  with a recurrent state; an optional `actor` attribute, a differentiable map from observation to
  action, lets the evaluator run the adversarial observation conditions.
