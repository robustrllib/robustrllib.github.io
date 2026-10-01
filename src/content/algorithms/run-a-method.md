# Run a Method

Every method of the benchmark is trained and evaluated through the same two commands. An
experiment card names one cell of the benchmark, a method on a task; the launcher resolves it,
runs the method's own training script, and the evaluator scores the final checkpoint.

## Summary

| Aspect | Run a method |
|---|---|
| Training | `python baselines/train.py -c <experiment card> --seed N` |
| Evaluation | `python baselines/evaluate.py --run <run directory>` |
| Method selection | The `algorithm` card named in the experiment card |
| Configuration | Algorithm, task, eval and experiment cards under `robustrllib/configs/` |
| Output | `<run>/config.yaml`, `<run>/ckpt/`, `<run>/progress.csv`, `<run>/eval/<grid>.json` |
| Limits | The robust safe methods run on Isaac Lab and have their own commands; see [RAMU](robust-safe/ramu.md) and [SPiDR](robust-safe/spidr.md) |

## Configuration files

| Kind | Directory | Holds |
|---|---|---|
| Algorithm | `algorithm/` | The training script (`entry`), the class that loads a checkpoint (`class`), default hyperparameters |
| Task | `task/` | Environment id, constructor arguments, observation adapter and, for offline methods, the dataset |
| Eval | `eval/` | The conditions a frozen policy is scored on |
| Experiment | `experiment/` | The three references, the training budget and the task's hyperparameters |

There is one experiment card per cell of the benchmark, named `<method>_<task>.yaml`.

```yaml title="robustrllib/configs/experiment/rorl_hopper.yaml"
# RORL on Hopper-v5 (Minari medium).
name: rorl_hopper
algorithm: robustrllib/configs/algorithm/rorl.yaml
task: robustrllib/configs/task/hopper_medium.yaml
eval: robustrllib/configs/eval/part1_mujoco.yaml
hparams:
  num_samples: 20
  policy_smooth_eps: 0.005
  policy_smooth_reg: 0.1
  q_smooth_eps: 0.005
  q_ood_eps: 0.01
  q_ood_reg: 0.5
  q_ood_uncertainty_reg: 2.0
  q_ood_uncertainty_reg_min: 0.1
  q_ood_uncertainty_decay: 1.0e-06
train: {updates: 3000000}
```

The task card names the environment and the dataset.

```yaml title="robustrllib/configs/task/hopper_medium.yaml"
# MuJoCo locomotion, offline methods: Hopper-v5 with the Minari medium dataset.
name: hopper_medium
env_id: Hopper-v5
dataset: mujoco/hopper/medium-v0
score: {min: -20.27, max: 3234.3}   # normalization anchors: D4RL v2 random / expert
```

The launcher resolves the card into one self-contained configuration; the same function shows
it without starting a run.

```python
from baselines.common import resolve

cfg = resolve("robustrllib/configs/experiment/rorl_hopper.yaml", seed=0)
print(cfg["algorithm"]["name"], cfg["task"]["env_id"], cfg["task"]["dataset"])
print(len(cfg["algorithm"]["hparams"]), cfg["algorithm"]["hparams"]["q_ood_uncertainty_reg"])
print(cfg["train"])
```

```text
rorl Hopper-v5 mujoco/hopper/medium-v0
30 2.0
{'updates': 3000000, 'seed': 0, 'out_dir': 'runs/rorl_hopper/seed0', 'shifts': []}
```

`hparams` of the experiment card are merged over `hparams` of the algorithm card, and **the
experiment card wins**: `q_ood_uncertainty_reg` is 0.0 in the algorithm card and 2.0 for Hopper.

## Launch a method

```bash
python baselines/train.py -c robustrllib/configs/experiment/rorl_hopper.yaml --seed 0
python baselines/evaluate.py --run runs/rorl_hopper/seed0
```

| Step | What happens |
|---|---|
| Resolve | The card, its three references and the seed become `runs/rorl_hopper/seed0/config.yaml` |
| Train | The script the algorithm card names under `entry`, here `baselines/rorl/train.py`, runs on that file |
| Evaluate | The class the algorithm card names under `class` loads the final checkpoint and acts on every condition of the card's grid |

Commands run from the root of the checkout. Each training seed is one run with its own run
directory, `runs/<card>/seed<k>` unless `--out` names another.

```bash
python baselines/train.py -c robustrllib/configs/experiment/rorl_hopper.yaml --seed 1
```

The method pages, listed under [Algorithms](index.md), give the card of each method; the
methods are in four groups: [standard](standard/index.md), [robust online](robust-online/index.md),
[robust offline](robust-offline/index.md) and [robust safe](robust-safe/index.md).

## Override settings

| Level | How | Use |
|---|---|---|
| Algorithm card | Edit `hparams` of the card | Defaults that hold for every task |
| Experiment card | Edit `hparams` or `train` of the card, or of a copy | A setting of one task or one study |
| Command line | `--set key=value`, a dotted key of the resolved configuration | A short test run, a one-off change |

```bash
python baselines/train.py -c robustrllib/configs/experiment/rorl_hopper.yaml --seed 0 \
    --set train.updates=100000 algorithm.hparams.q_smooth_eps=0.01
```

The value is read as YAML, so `0.01`, `true` and `[256, 256]` keep their types. The
resolved configuration, overrides included, is written to `<run>/config.yaml` with the run.

## Run directory

| File | Content |
|---|---|
| `config.yaml` | The resolved configuration the training script ran on |
| `ckpt/` | Checkpoints named by their step or update count; the highest-numbered one is the final checkpoint |
| `progress.csv` | One row per log interval: the step or update count, the training return and the losses |
| `eval/<grid>.json` | Written by the evaluator: per condition the returns, their mean, spread and lower tail, the normalized score |

**The final checkpoint is the one the benchmark evaluates.** One method keeps the selection rule
of its own paper: [RFQI](robust-offline/rfqi.md) also writes `ckpt/best.pt` and its algorithm
card sets `checkpoint: best`.

## Online methods

An online method has no dataset and measures its budget in environment steps. Its training
environment is the task card's environment, built by the same function the evaluator uses, so a
policy always meets the observation it was trained on.

```yaml title="robustrllib/configs/experiment/dr_sac_hopper.yaml"
# DR-SAC on Hopper-v5 (Part 1): gravity, morphology and gear each drawn from U(0.9, 1.1) per episode.
name: dr_sac_hopper
algorithm: robustrllib/configs/algorithm/dr_sac.yaml
task: robustrllib/configs/task/hopper.yaml
eval: robustrllib/configs/eval/part1_mujoco.yaml
hparams:
  randomize:
  - {target: dynamics, mode: uniform, params: {param: gravity, low: 0.9, high: 1.1}}
  - {target: dynamics, mode: uniform, params: {param: body_pos_xyz, index: all, low: 0.9, high: 1.1}}
  - {target: dynamics, mode: uniform, params: {param: actuator_gear, index: all, low: 0.9, high: 1.1}}
train: {steps: 1000000}
```

| | Offline (RORL) | Online (DR-SAC) |
|---|---|---|
| Task card | `hopper_medium.yaml`, with a `dataset` | `hopper.yaml`, without a dataset |
| Budget | `train.updates` gradient updates | `train.steps` environment steps |
| Training environment | None | The task card's environment |
| Final checkpoint | `ckpt/update_3000000.pt` | `ckpt/step_1000000.zip` |

Each entry of `randomize` is one [Dynamic shift](../shifts/sources/dynamic.md) in the
[Stochastic](../shifts/modes/stochastic.md) mode, drawn anew at every `reset` of the training
environment. Without them the same trainer is plain SAC.

## Training-time shifts

A reward corruption or a delayed reward changes what a method learns from, not what a frozen
policy does, so these shifts act during training. `robustrllib/configs/train_shifts.yaml` defines
the arms the paper uses, and `--train-shift` selects one.

```bash
python baselines/train.py -c robustrllib/configs/experiment/rorl_hopper.yaml --seed 0 \
    --train-shift reward_delay_16
python baselines/evaluate.py --run runs/rorl_hopper_reward_delay_16/seed0 \
    --eval robustrllib/configs/eval/nominal.yaml
```

| Arm | Shift |
|---|---|
| `reward_gauss`, `reward_uniform`, `reward_shift` | Reward corruption matched at standard deviation 0.5 |
| `reward_delay_4`, `_16`, `_32`, `_64` | The reward released every 4, 16, 32 or 64 steps |

An online method trains on its environment with the arm's shifts stacked on it; an offline method
applies them to the rewards of its dataset, along each recorded episode. The run takes the arm's
name, `runs/<card>_<arm>/seed<k>`.

## Launch rules

- Commands are run from the root of the checkout, and card references are relative to it.
- The task card is nominal; no condition of the evaluation grid is applied during training.
- Whatever a method adds to its training environment, such as randomization ranges or an
  adversary, is part of the method and lives in its cards.
- Each training seed is a separate run with its own run directory.
- Method hyperparameters are changed in the cards, or with `--set` for a one-off run; the
  resolved configuration is saved with the run.
- The return in `progress.csv` is a training diagnostic; reported scores come from the
  [Evaluation Protocol](../evaluation/protocol.md).
