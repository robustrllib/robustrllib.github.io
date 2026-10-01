# Add an Algorithm

A new method is a class with four methods. It is registered from a configuration file, without
an edit to the library, and runs through the same train and evaluate pipeline as the built-in
algorithms.

## Summary

| Aspect | Custom algorithm |
|---|---|
| Interface | A subclass of `Algo` with `train`, `predict`, `save` and `load` |
| Registration | The `class` key of an algorithm config, written `module.path:ClassName` |
| Configuration | `hparams` of the algorithm config, passed to the constructor |
| Runner | `examples/run_experiment.py -c <experiment.yaml>` |
| Evaluation | The shift grid of the experiment's `eval` section |
| Limits | The shared evaluator reads checkpoints named `ckpt/ep*.pt` |

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
| Constructor | `__init__(self, **hparams)` | Accepts the `hparams` of the config as keyword arguments | `build_algo` |
| `train` | `train(self, env, total_timesteps, seed=None)` | Fits the policy on `env` | The experiment runner |
| `predict` | `predict(self, obs, deterministic=True)` | Returns the action for one observation | Every evaluator |
| `save` | `save(self, path)` | Writes what `load` needs | The runner, after training |
| `load` | `load(cls, path, **kwargs)`, a class method | Returns an instance ready for `predict` | `load_algo` |

The evaluators call `load` with `env=...`; `baselines/eval_final.py` also passes `device=...`.
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

`load` rebuilds the network from the environment and restores the weights.

```python
    def save(self, path):
        torch.save(self.policy.state_dict(), path + ".pt")

    @classmethod
    def load(cls, path, env=None, **kwargs):
        algo = cls(**kwargs)
        algo._build(env)
        algo.policy.load_state_dict(torch.load(path + ".pt", map_location=algo.device))
        return algo
```

The training loop uses only `reset` and `step`, so it does not need to know which shifts are
stacked on the environment. **`save` and `load` must agree on the file name**; the template
appends `.pt` to the path in both.

## Register a method

Registration is one line in an algorithm config.

```yaml title="robustrllib/configs/algorithm/reinforce.yaml"
# Custom algorithm plugged in by import path -- no framework edit needed.
name: reinforce
class: robustrllib.algos.template_reinforce:Reinforce
hparams:
  lr: 0.0003
  gamma: 0.99
  hidden: [64, 64]
```

| Key | Meaning |
|---|---|
| `name` | A label. Without `class` it selects a built-in: `random`, `ppo`, `sac`, `td3`, `a2c`, `ddpg`. |
| `class` | `module.path:ClassName`, importable from where the launcher runs |
| `hparams` | Keyword arguments of the constructor |

!!! note
    The file spells the module by its implementation path. The public name,
    `robustrllib.algos.template_reinforce:Reinforce`, resolves to the same class.

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
    path = os.path.join(tmp, "checkpoint")
    algo.save(path)
    clone = load_algo("reinforce", path, cls=CLASS, env=env)
    print(os.listdir(tmp), np.allclose(clone.predict(obs), action))
```

```text
Reinforce True (3,)
['checkpoint.pt'] True
```

## Run a method

An experiment file names the algorithm, the task, the budget and the grid. Every section is a
path to a card or an inline dictionary.

```yaml title="hopper_reinforce.yaml"
name: hopper_reinforce
task:
  env_id: Hopper-v5
  make_kwargs: {max_episode_steps: 1000}
  train_shifts: []
algorithm:
  name: reinforce
  class: robustrllib.algos.template_reinforce:Reinforce
  hparams: {lr: 0.0003, gamma: 0.99, hidden: [64, 64]}
train:
  total_timesteps: 20000
  seed: 0
eval:
  episodes: 5
  seeds: [0]
  grid:
    - {name: nominal, shifts: [], severity: 1.0}
    - name: gravity_1.2
      severity: 1.2
      shifts: [{target: dynamics, mode: scale, params: {param: gravity, factor: 1.2}}]
    - name: obs_noise_0.05
      shifts: [{target: observation, mode: gauss, params: {sigma: 0.05}}]
output_dir: results/reinforce
```

```bash
python examples/run_experiment.py -c hopper_reinforce.yaml
```

| Step | Call |
|---|---|
| Build | `make_robust(env_id, shifts=train_shifts, **make_kwargs)` |
| Train | `algo.train(env, total_timesteps, seed)` |
| Save | `algo.save("<run dir>/checkpoint")` |
| Evaluate | Every condition of `grid`, `episodes` episodes per entry of `seeds` |
| Write | The files below, in `<output_dir>/<name>-<hash>/` |

The same run is available from Python.

```python
from robustrllib.run import run_from_file

# result = run_from_file("hopper_reinforce.yaml")
```

!!! tip
    Shifts listed under `task.train_shifts`, in the dictionary form of the grid, are applied to
    the training environment. The shifts and their mode names are listed under
    [Shift Sources and Modes](../shifts/index.md).

## Evaluation and metrics

The runner prints one row per condition and writes four files.

| File | Content |
|---|---|
| `checkpoint.pt` | What `save` wrote |
| `config.json` | The four resolved sections and the hash |
| `summary.json` | Metrics per condition and the summary across conditions |
| `episodes.csv` | One row per evaluation episode |

| Metric | Scope | Meaning |
|---|---|---|
| `return_mean`, `return_std`, `return_min` | Condition | Episodic return over the episodes of the condition |
| `cvar` | Condition | Mean of the worst `cvar_alpha` fraction of the episodes |
| `cost_mean`, `constraint_violation` | Condition | Mean episode cost and share of episodes with a positive cost |
| `success_rate` | Condition | Share of episodes that report success |
| `return_mean_avg`, `worst_case_return` | Summary | Mean and minimum of `return_mean` over the conditions |
| `auc` | Summary | Area under return against `severity`, when the grid has severities |

The shared evaluator applies the [Evaluation Protocol](../evaluation/protocol.md) to any class
that follows the contract, under four assumptions.

| Assumption | Detail |
|---|---|
| Checkpoint location | Files named `ckpt/ep*.pt` in the run directory |
| Path used verbatim | `save(path)` writes exactly `path`, and `load(path)` reads exactly `path` |
| `load` keywords | `load` is called with `env=` and `device=` |
| Config references | The experiment file names its cards as paths relative to the root of the checkout |

**The template appends `.pt` to the path**, so its checkpoints are not found by
`baselines/eval_final.py`. A copy that is meant for the shared evaluator uses the path verbatim.

## Registration rules

- A method subclasses `Algo` and implements all four methods.
- The constructor accepts every key of `hparams` as a keyword argument.
- The module named in `class` is importable from the directory where the launcher runs.
- `predict` returns one action for one observation and honours `deterministic=True`.
- `save` and `load` agree on the file name, and use the path verbatim for the shared evaluator.
- The training loop uses only `reset` and `step`, so that it runs on any shifted environment.
- An optional `set_eval_seed(seed)` method is called by the shared evaluator before every
  episode.
