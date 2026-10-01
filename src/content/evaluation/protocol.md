# Evaluation Protocol

Every score of the benchmark is produced by one evaluator under one protocol. A policy is
trained on the nominal task, its last checkpoint is frozen, and the checkpoint is scored on a
grid of shift conditions.

## Summary

| Aspect | Evaluation protocol |
|---|---|
| Interface | `baselines/eval_final.py -c <experiment.yaml> --run-dir <dir>` |
| Checkpoint | The exact last checkpoint of the run; never selected on evaluation results |
| Conditions | The `grid` of an eval file; each condition is a list of shifts |
| Episodes | 20 per condition, deterministic actions, at most 1000 steps |
| Seeds | A fixed evaluation seed, offset by the episode index; conditions are paired |
| Score | The return rescaled so that a random policy scores 0 and the reference policy scores 100; not clipped |

## Which evaluator

`baselines/eval_final.py` reads a checkpoint of the form `ckpt/ep*.pt` and covers the
offline methods and DR. The online methods keep the evaluators of their own training
stacks, on the same grids:

| Methods | Evaluator |
|---|---|
| IQL, TD3+BC, MOPO, SynthER, RFQI, RORL, ATLA-IQL, RSC-IQL, RAMBO, ROMB, FWM, PLR-PVL, DR | `baselines/eval_final.py -c <experiment.yaml> --run-dir <dir>` |
| ATLA, ATLA-SA | `baselines/atla/eval_atla_ood.py -c <experiment.yaml> --run-dir <dir>` |
| RSC (online) | `baselines/causaldro_online/scripts/eval_ood.py` |
| PPO, SAC, RARL, DR-SAC (the Stable-Baselines3 runs) | `experiments/sb3_default_runs/evaluate_grid.py`, `experiments/<method>/test_grid.py` |
| Observation attack (adversarial mode) | `scripts/spec_obs_attack_eval.py` |

## Evaluation grids

| Key | Type | Meaning |
|---|---|---|
| `episodes` | int | Episodes per condition |
| `seed` | int | Evaluation seed; every episode is reset with this seed plus its episode index |
| `grid` | list | The conditions |
| `grid[].name` | str | Name of the condition; the part before the first digit is its axis |
| `grid[].shifts` | list | Shifts in dictionary form, as in [Shift Sources and Modes](../shifts/index.md); an empty list is the nominal condition |
| `grid[].severity` | float | Optional; orders the conditions of one axis |

The excerpts leave out the `seed` line and most conditions.

```yaml title="robustrllib/configs/eval/t0_mujoco.yaml (excerpt)"
episodes: 20
grid:
  - {name: nominal, shifts: [], severity: 1.0}
  - {name: gravity_0.8, severity: 0.8, shifts: [{target: dynamics, mode: scale, params: {param: gravity, factor: 0.8}}]}
  - {name: morph_0.8, severity: 0.8, shifts: [{target: dynamics, mode: scale, params: {param: body_pos_xyz, index: all, factor: 0.8}}]}
  - {name: gear_0.8, severity: 0.8, shifts: [{target: dynamics, mode: scale, params: {param: actuator_gear, index: all, factor: 0.8}}]}
```

```yaml title="robustrllib/configs/eval/spec_timing_hopper.yaml (excerpt)"
episodes: 20
grid:
  - {name: nominal, severity: 0, shifts: []}
  - {name: act_delay_8ms, severity: 2, shifts: [{target: latency, mode: fixed, params: {steps: 1}}]}
  - {name: obs_delay_8ms, severity: 1.8, shifts: [{target: latency, mode: interp, params: {low: 0.004, high: 0.008}}]}
```

```yaml title="robustrllib/configs/eval/spec_timevar_hopper.yaml (excerpt)"
episodes: 20
grid:
  - {name: gear_static_0.8, severity: 1, shifts: [{target: dynamics, mode: scale, params: {param: actuator_gear, index: all, factor: 0.8}}]}
  - {name: gear_step_0.8, severity: 1.1, shifts: [{target: dynamics, mode: scale, params: {param: actuator_gear, index: all, factor: 1.0}, schedule: {type: step, start: 1.0, end: 0.8, t1: 500}}]}
```

The three excerpts are a Dynamic shift in the Parametric mode, a Latency shift, and a Dynamic
shift in the Non-stationary mode. `t0_mujoco.yaml` holds the nominal condition and three axes,
gravity, limb length and actuator gear, each at the factors 0.8, 0.9, 1.1 and 1.2: 13
conditions.

!!! tip
    Conditions of one axis share a name prefix followed by a number, as in `gravity_0.8`. The
    report groups conditions by that prefix.

A condition is checked before a long evaluation by building it once.

```python
import yaml
from robustrllib import make_robust, ShiftSpec

grid = yaml.safe_load(open("robustrllib/configs/eval/t0_mujoco.yaml"))["grid"]
for condition in grid:
    shifts = [ShiftSpec(**shift) for shift in condition["shifts"]]
    env = make_robust("Hopper-v5", shifts=shifts)
    env.reset(seed=0)
    env.close()
print(len(grid))
```

```text
13
```

## Run a final evaluation

```bash
python baselines/eval_final.py \
    -c robustrllib/configs/experiment/rorl_hopper.yaml \
    --run-dir runs/rorl/hopper_medium_seed0
```

| Step | What the evaluator does |
|---|---|
| 1 | Lists `ckpt/ep*.pt` in the run directory and takes the last one |
| 2 | Builds `make_robust(env_id, shifts=...)` for each condition |
| 3 | Loads the policy with the class named in the algorithm card |
| 4 | Runs the episodes; every reset reseeds the task and every shift wrapper |
| 5 | Prints a report and writes `final_eval.json` into the run directory |

| Argument | Meaning |
|---|---|
| `-c`, `--config` | The experiment file; its cards are paths relative to the root of the checkout |
| `--run-dir` | The training run directory, which contains `ckpt/` |
| `--eval-config` | Another grid to evaluate on |
| `--output` | File name of the result inside the run directory |
| `--episodes`, `--seed` | Override the values of the grid |
| `--device`, `--torch-threads` | Device of the policy; limit on CPU threads |
| `--ckpt` | An explicit checkpoint; the result goes to `eval_<checkpoint name>.json` |
| `--ckpt-select` | `last` is the protocol; `best`, `last10` and `curve` are diagnostics |

A second grid is scored with a named output.

```bash
python baselines/eval_final.py \
    -c robustrllib/configs/experiment/rorl_hopper.yaml \
    --run-dir runs/rorl/hopper_medium_seed0 \
    --eval-config robustrllib/configs/eval/spec_timing_hopper.yaml \
    --output spec_timing_eval.json
```

**Without `--output` the result goes to `final_eval.json`** whatever the grid is, and replaces
the file that is already there.

Two kinds of shift are not scored by this evaluator.

| Shift | Reason | Where it is studied |
|---|---|---|
| Observation shift in the Adversarial mode | It needs the actor of the policy, which this evaluator does not attach | `scripts/spec_obs_attack_eval.py`, which applies the same attack to every method |
| Reward/cost shift, and Latency shift with the mode name `delay` | A frozen policy does not read the reward | Training under the shift, evaluation on the nominal task |

## Result file

`final_eval.json` records the protocol next to the numbers. Values are replaced by their types.

```json
{
  "env_id": "Hopper-v5",
  "ckpt": "runs/rorl/hopper_medium_seed0/ckpt/ep3000.pt",
  "ckpt_select": "last",
  "seed": "<int>",
  "episode_seed_rule": "base_seed + episode_index",
  "episode_seeds": ["<int>", "..."],
  "episodes": 20,
  "evaluation_protocol": {"metric_family": "episodic_return", "primary_metric": "return"},
  "per_condition": {
    "nominal": {"return_mean": "<float>", "return_std": "<float>", "return_min": "<float>",
                "cvar": "<float>", "episode_length_mean": "<float>",
                "episode_length_std": "<float>", "n_episodes": 20},
    "gravity_0.8": {"...": "..."}
  },
  "summary": {"nominal_mean": "<float>", "gravity_mean": "<float>", "morph_mean": "<float>",
              "gear_mean": "<float>", "all_mean": "<float>", "ood_mean": "<float>"}
}
```

## Metrics and summary schema

| Field | Scope | Meaning |
|---|---|---|
| `return_mean`, `return_std`, `return_min` | Condition | Raw return over the episodes of the condition |
| `cvar` | Condition | Mean of the worst tenth of the episodes |
| `episode_length_mean`, `episode_length_std` | Condition | Steps until termination or truncation |
| `<axis>_mean` | Summary | Mean of `return_mean` over the conditions of the axis |
| `all_mean` | Summary | Mean over all conditions |
| `ood_mean` | Summary | Mean over all conditions except `nominal` |

The file holds raw returns. The normalized score uses one fixed pair of reference returns per
environment, shared by every method and condition: the return of a random policy and the return
of a reference policy. The score is the return minus the random reference, divided by the
distance between the two references, times 100.

```python
R_MIN, R_MAX = -20.272305, 3234.3          # Hopper-v5


def normalized(ret):
    return 100.0 * (ret - R_MIN) / (R_MAX - R_MIN)


for ret in (R_MIN, R_MAX, 3600.0):
    print(f"{ret:12.3f} -> {normalized(ret):6.1f}")
```

```text
     -20.272 ->    0.0
    3234.300 ->  100.0
    3600.000 ->  111.2
```

```python
import json

result = json.load(open("runs/rorl/hopper_medium_seed0/final_eval.json"))
for name, metrics in result["per_condition"].items():
    print(f"{name:14s}{metrics['return_mean']:10.1f}{normalized(metrics['return_mean']):8.1f}")
```

**The score is not clipped.** A return above the reference gives a score above 100, and a
return below the random reference gives a negative score.

!!! note
    The pair for `Hopper-v5` is the D4RL reference return of a random and of an expert policy.
    The pairs of all tasks are defined in `scripts/summary_norm_table.py`.

## Protocol defaults

| Field | Default | Purpose |
|---|---|---|
| Checkpoint | `--ckpt-select last` | The exact last checkpoint; no selection on results |
| Episodes | 20 per condition | The `episodes` key of the grid |
| Evaluation seed | The `seed` key of the grid, one fixed value for all grids | The same initial states for every method |
| Episode seed | Evaluation seed plus episode index | Paired conditions |
| Actions | `predict(obs, deterministic=True)` | No sampling noise in the score |
| Horizon | At most 1000 steps per episode | The horizon of the tasks |
| Device | `cpu` | Evaluation of small policies |
| Output | `final_eval.json` | One protocol result per run directory |
| Training seeds | Five per method and task | The replication unit |

## Combine training runs

A reported number is the mean over the training seeds. Each seed is normalized first.

```python
import glob
import json
import numpy as np

paths = sorted(glob.glob("runs/rorl/hopper_medium_seed*/final_eval.json"))
runs = [json.load(open(path)) for path in paths]

for name in runs[0]["per_condition"]:
    scores = [normalized(run["per_condition"][name]["return_mean"]) for run in runs]
    print(f"{name:14s}{np.mean(scores):7.1f} +/- {np.std(scores, ddof=1):4.1f}")
```

`ddof=1` gives the sample standard deviation, which the table script
`scripts/summary_norm_table.py` uses.

Experiments that name their cards relative to the experiment file, or inline, are evaluated by
the launcher that trained them; see [Add an Algorithm](../algorithms/add-an-algorithm.md).

## Reproducible reporting

- The replication unit is an independently trained policy; the spread of a score is taken
  across training seeds.
- Episodes of one checkpoint are not independent samples, and their spread is not reported as
  the uncertainty of a method.
- The evaluated checkpoint is the exact last one; evaluation results are never used to select a
  checkpoint.
- Every method is scored on the same grid, with the same evaluation seed and the same number of
  episodes.
- Scores are normalized with the fixed reference pair of the environment and are not clipped.
- A result on a second grid is written to a named output file.
- A result from an explicit or a selected checkpoint is reported as a diagnostic, not as the
  protocol score.
