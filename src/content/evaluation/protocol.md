# Evaluation Protocol

Every score of the benchmark is produced by one evaluator under one protocol. A policy is
trained on the nominal task, a checkpoint rule fixed before evaluation picks the checkpoint
to freeze, and the frozen checkpoint is scored on a grid of shift conditions.

## Summary

| Aspect | Evaluation protocol |
|---|---|
| Interface | `baselines/evaluate.py --run <run directory> [--eval <grid>]` |
| Checkpoint | A rule fixed before evaluation: the final checkpoint by default, the last *k* checkpoints pooled, or the run's own best checkpoint; never selected on evaluation results |
| Conditions | The `grid` of an eval card; each condition is a list of shifts |
| Episodes | 20 per condition, deterministic actions, the task's time limit |
| Seeds | A fixed evaluation seed, offset by the episode index; conditions are paired |
| Score | The return rescaled so that a random policy scores 0 and the reference policy scores 100; not clipped |

The same evaluator scores every method of `baselines/`, offline and online: it loads the
checkpoint with the class the method's algorithm card names, so it never depends on how the
method was trained. The Isaac Lab and VLA studies have evaluators of their own, described in
`isaac/README.md` and `vla/README.md` of the repository.

## Evaluation grids

| Key | Type | Meaning |
|---|---|---|
| `episodes` | int | Episodes per condition |
| `seed` | int | Evaluation seed; every episode is reset with this seed plus its episode index |
| `grid` | list | The conditions |
| `grid[].name` | str | Name of the condition |
| `grid[].shifts` | list | Shifts in dictionary form, as in [Shift Sources and Modes](../shifts/index.md); an empty list is the nominal condition |
| `grid[].env_kwargs` | dict | Optional; constructor arguments of the condition, for a parameter an environment reads only when it is built |
| `grid[].env_id` | str | Optional; another registered variant of the task, as for the semantic channel |
| `grid[].axis`, `quartile`, `severity`, `channel` | | Optional labels, copied into the result; `axis` names the shift factor, see [Add a new shift factor](../shifts/add-a-shift-factor.md) |

| Card | Conditions | Used for |
|---|---|---|
| `part1_<task>.yaml` | The library-wide grid: three shift factors per task at eight scales, grouped into quartiles | Part 1 |
| `part2_hopper.yaml` | Five cells of each frozen-policy channel | Part 2 |
| `part2_doorcausal.yaml` | The trained and the inverted semantic binding | Part 2, semantic channel |
| `part3_hopper.yaml`, `part3_pusher.yaml` | Each channel of a reference profile, then all of them jointly | Part 3 |
| `nominal.yaml` | The nominal condition | Training-time channels |

The excerpts leave out most conditions.

```yaml title="robustrllib/configs/eval/part1_mujoco.yaml (excerpt)"
episodes: 20
seed: 10000
grid:
- name: nominal
  shifts: []
- name: gravity_0.9
  axis: gravity
  quartile: 1
  severity: 0.9
  shifts:
  - target: dynamics
    mode: scale
    params: {param: gravity, factor: 0.9}
```

```yaml title="robustrllib/configs/eval/part2_hopper.yaml (excerpt)"
- name: act_delay_8ms
  channel: theta_tau
  shifts:
  - target: latency
    mode: fixed
    params: {steps: 1}
- name: gear_ramp_0.8
  channel: theta_p
  shifts:
  - target: dynamics
    mode: scale
    params: {param: actuator_gear, index: all, factor: 1.0}
    schedule: {type: linear, start: 1.0, end: 0.8, t0: 0, t1: 1000}
```

```yaml title="robustrllib/configs/eval/part1_carracing.yaml (excerpt)"
- name: friction_0.6
  axis: friction
  quartile: 4
  severity: 0.6
  env_kwargs: {friction_scale: 0.6}
  shifts: []
```

The three excerpts are a Dynamic shift in the Parametric mode, a Latency shift and a Dynamic shift
in the Non-stationary mode, and a condition CarRacing reads when it builds the track.
`part1_mujoco.yaml` holds the nominal condition and three axes, gravity, limb length and actuator
gear, each at eight factors from 0.6 to 1.4: 25 conditions.

A grid is checked before a long evaluation by building each condition once.

```python
import yaml
from robustrllib import make_env

task = yaml.safe_load(open("robustrllib/configs/task/hopper.yaml"))
grid = yaml.safe_load(open("robustrllib/configs/eval/part1_mujoco.yaml"))["grid"]
for condition in grid:
    env = make_env(task, shifts=condition["shifts"], seed=0)
    env.reset(seed=0)
    env.close()
print(len(grid))
```

```text
25
```

## Run an evaluation

```bash
python baselines/evaluate.py --run runs/rorl_hopper/seed0
```

| Step | What the evaluator does |
|---|---|
| 1 | Reads `config.yaml` of the run and takes the highest-numbered file in `ckpt/` |
| 2 | Loads the policy with the class named in the algorithm card |
| 3 | Builds the task card's environment with the condition's shifts, one fresh environment per condition |
| 4 | Runs the episodes; every reset reseeds the task and every shift wrapper |
| 5 | Prints a report and writes `eval/<grid>.json` into the run directory |

| Argument | Meaning |
|---|---|
| `--run` | The training run directory, with `config.yaml` and `ckpt/` |
| `--eval` | Another grid to evaluate on; the result is named after it |
| `--episodes` | Override the number of episodes of the grid |
| `--checkpoint` | The checkpoint rule for this run: `last`, `last:k` or `best`; overrides the algorithm card |
| `--ckpt` | One explicit checkpoint file, for diagnostics |
| `--device` | Device of the policy |

## Checkpoint selection

The checkpoint is chosen by a rule that is written down before any evaluation, so that the
grid never selects the policy it scores. The rule can be set per method, in the `checkpoint`
key of the algorithm card, and per run on the command line.

| Rule | Checkpoints evaluated | Use |
|---|---|---|
| `last` | The highest-numbered file in `ckpt/` | The default of the benchmark: the final policy, with no selection |
| `last:k` | The *k* highest-numbered files, oldest first | A smoother estimate when the final policies of a method fluctuate; each checkpoint plays the same episode seeds and the episodes are pooled |
| `best` | The file named `best*` in `ckpt/` | Methods whose own paper keeps a selection rule and write that checkpoint during training |
| `--ckpt <file>` | That file | A diagnostic of one checkpoint, not a protocol score |

```bash
python baselines/evaluate.py --run runs/rorl_hopper/seed0 --checkpoint last:3
python baselines/evaluate.py --run runs/rorl_hopper/seed0 --checkpoint best
```

```yaml title="robustrllib/configs/algorithm/<method>.yaml"
checkpoint: last     # last, last:k or best; the default of every run of the method
```

With `last:k` the result file lists the *k* checkpoints, and `returns` of each condition holds
*k* times `episodes` values. The rule in force is recorded next to the numbers, so results from
different rules are never mixed unnoticed.

The Part 2 and Part 3 grids score the Part 1 Hopper runs a second and a third time.

```bash
python baselines/evaluate.py --run runs/rorl_hopper/seed0 --eval robustrllib/configs/eval/part2_hopper.yaml
python baselines/evaluate.py --run runs/rorl_hopper/seed0 --eval robustrllib/configs/eval/part3_hopper.yaml
```

Two kinds of shift need more than a frozen policy and a condition.

| Shift | How it is scored |
|---|---|
| Observation shift in the Adversarial mode | The evaluator binds the policy's own actor, which the loader exposes as `actor`; a recurrent policy has none, and the condition is reported as skipped |
| Reward/cost shift, and Latency shift with the mode name `delay` | A frozen policy does not read the reward: the method trains under the shift (`baselines/train.py --train-shift`) and is evaluated on `nominal.yaml` |

## Result file

`eval/<grid>.json` records the protocol next to the numbers. Values are replaced by their types.

```json
{
  "run": "rorl_hopper",
  "checkpoint_rule": "last",
  "checkpoint": "runs/rorl_hopper/seed0/ckpt/update_3000000.pt",
  "seed": 10000,
  "episodes": 20,
  "conditions": {
    "nominal": {"return_mean": "<float>", "return_std": "<float>", "return_min": "<float>",
                "cvar": "<float>", "n_episodes": 20, "score": "<float>",
                "episode_length_mean": "<float>", "returns": ["<float>", "..."]},
    "gravity_0.9": {"...": "...", "axis": "gravity", "quartile": 1, "severity": 0.9}
  }
}
```

## Metrics

| Field | Scope | Meaning |
|---|---|---|
| `return_mean`, `return_std`, `return_min` | Condition | Raw return over the episodes of the condition |
| `cvar` | Condition | Mean of the worst tenth of the episodes |
| `score` | Condition | The normalized score of `return_mean` |
| `success_rate` | Condition | Share of episodes that report success, on goal-conditioned tasks |
| `episode_length_mean` | Condition | Steps until termination or truncation |
| `returns` | Condition | The return of every episode |

The normalized score uses one fixed pair of reference returns per environment, shared by every
method and condition: the return of a random policy and the return of a reference policy. The
score is the return minus the random reference, divided by the distance between the two
references, times 100.

```python
R_MIN, R_MAX = -20.27, 3234.3          # Hopper-v5


def normalized(ret):
    return 100.0 * (ret - R_MIN) / (R_MAX - R_MIN)


for ret in (R_MIN, R_MAX, 3600.0):
    print(f"{ret:12.3f} -> {normalized(ret):6.1f}")
```

```text
     -20.270 ->    0.0
    3234.300 ->  100.0
    3600.000 ->  111.2
```

**The score is not clipped.** A return above the reference gives a score above 100, and a
return below the random reference gives a negative score.

!!! note
    The pair of each task is the `score` entry of its task card. For `Hopper-v5` it is the D4RL
    reference return of a random and of an expert policy.

## Protocol defaults

| Field | Default | Purpose |
|---|---|---|
| Checkpoint rule | `last`, the highest-numbered file in `ckpt/` | The final checkpoint; `last:k` or `best` when the card or the command line says so |
| Episodes | 20 per condition | The `episodes` key of the grid |
| Evaluation seed | The `seed` key of the grid, 10000 for every grid | The same initial states for every method |
| Episode seed | Evaluation seed plus episode index | Paired conditions |
| Actions | `predict(obs, deterministic=True)` | No sampling noise in the score |
| Horizon | The time limit of the task card's environment | The horizon of the tasks |
| Device | `cpu` | Evaluation of small policies |
| Output | `eval/<grid>.json` | One result per run and grid |
| Training seeds | Five per method and task | The replication unit |

## Combine training runs

A reported number is the mean over the training seeds of the normalized score.

```python
import glob
import json
import numpy as np

paths = sorted(glob.glob("runs/rorl_hopper/seed*/eval/part1_mujoco.json"))
runs = [json.load(open(path)) for path in paths]

for name in runs[0]["conditions"]:
    scores = [run["conditions"][name]["score"] for run in runs]
    print(f"{name:16s}{np.mean(scores):7.1f} +/- {np.std(scores, ddof=1):4.1f}")
```

`ddof=1` gives the sample standard deviation across training seeds.

## Reproducible reporting

- The replication unit is an independently trained policy; the spread of a score is taken
  across training seeds.
- Episodes of one checkpoint are not independent samples, and their spread is not reported as
  the uncertainty of a method.
- The checkpoint rule is fixed before evaluation and recorded with the result; evaluation
  results are never used to select a checkpoint.
- Every method is scored on the same grid, with the same evaluation seed and the same number of
  episodes.
- Scores are normalized with the fixed reference pair of the environment and are not clipped.
- A result from an explicit checkpoint is reported as a diagnostic, not as the protocol score.
