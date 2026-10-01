# Run a Method

A method is launched from an experiment file. The file names an algorithm card, a task card and
an evaluation grid, and carries the training budget. Every bundled method keeps its own training
recipe behind this one entry.

## Summary

| Aspect | Run a method |
|---|---|
| Interface | A launcher that takes an experiment YAML with `-c` |
| Method selection | The `algorithm` card named in the experiment file |
| Configuration | Algorithm, task, eval and experiment cards under `robustrllib/configs/` |
| Output | A run directory with `ckpt/epNNNN.pt` and `learning_curve.json` |
| Evaluation | `baselines/eval_final.py` on the last checkpoint |
| Limits | `baselines/run_baseline.py` applies only to algorithm cards with an `entry` key |

## Configuration files

| Kind | Directory | Holds |
|---|---|---|
| Algorithm | `algorithm/` | Method name, implementing class, default hyperparameters |
| Task | `task/` | Environment id and, for offline methods, the dataset |
| Eval | `eval/` | The perturbation grid a frozen policy is scored on |
| Experiment | `experiment/` | The three references, the budget and hyperparameter overrides |

The experiment file ties the cards together. One method, [DR](robust-online/dr.md), reads a
file of its own on top of these: the randomization ranges it trains under, kept in `dr/` and
described with the method [below](#online-methods).

```yaml title="robustrllib/configs/experiment/rorl_hopper.yaml"
# Official Hopper-medium RORL hyperparameters on benchmark Minari data.
algorithm: robustrllib/configs/algorithm/rorl.yaml
task: robustrllib/configs/task/hopper_minari_medium.yaml
eval: robustrllib/configs/eval/t0_mujoco.yaml
hparams:
  num_samples: 20
  policy_smooth_eps: 0.005
  policy_smooth_reg: 0.1
  q_smooth_eps: 0.005
  q_ood_eps: 0.01
  q_ood_reg: 0.5
  q_ood_uncertainty_reg: 2.0
  q_ood_uncertainty_reg_min: 0.1
  q_ood_uncertainty_decay: 0.000001
train:
  seed: 0
  epochs: 3000
  updates_per_epoch: 1000
  batch_size: 256
  eval_every: 1
  eval_steps_per_epoch: 1000
  eval_seed: 3
  max_path_length: 1000
  save_every: 500
  resume_every: 50
  torch_threads: 4
  out_dir: runs/rorl/hopper_medium_seed0
```

!!! note
    The files spell the config directory by its other name. `robustrllib/configs` is a link to
    that directory, so both spellings name the same files.

The task card names the environment and the dataset.

```yaml title="robustrllib/configs/task/hopper_minari_medium.yaml"
# Minari medium dataset. The dataset was recorded on the -v5 env, so env_id must
# match it: training and evaluation have to share the dataset's MDP.
name: hopper_minari_medium
env_id: Hopper-v5
datasets:
  mujoco/hopper/medium-v0: 1.0
body_dynamics: {torso: [0.8, 0.9, 1.1, 1.2], foot: [0.8, 0.9, 1.1, 1.2]}
mopo_domain: hopper
```

The merged configuration can be inspected without starting a run.

```python
from robustrllib.training.config import TrainingConfigBundle

bundle = TrainingConfigBundle.load("robustrllib/configs/experiment/rorl_hopper.yaml")
print(bundle.algorithm["name"], bundle.task["env_id"])
print(len(bundle.hparams), bundle.hparams["hidden_size"], bundle.hparams["q_smooth_eps"])
```

```text
rorl Hopper-v5
31 256 0.005
```

`hparams` of the experiment file are merged over `hparams` of the algorithm card, and **the
experiment wins**. The 31 entries are the 22 defaults of the card plus the 9 keys above.

## Launch a method

```bash
python baselines/rorl/train_rorl.py \
    -c robustrllib/configs/experiment/rorl_hopper.yaml --seed 0
```

| Launcher | Applies to |
|---|---|
| The train script of the method, here `baselines/rorl/train_rorl.py` | The method the script belongs to |
| `scripts/robustgym.py train --config <experiment.yaml>` | The registered methods listed below |
| `baselines/run_baseline.py -c <experiment.yaml>` | Algorithm cards with an `entry` key that names a train script |

The unified launcher resolves the method from the algorithm card and rejects overrides that the
method does not support.

```bash
python scripts/robustgym.py list
python scripts/robustgym.py train \
    --config robustrllib/configs/experiment/rorl_hopper.yaml --seed 0
```

| Registered name | Regime |
|---|---|
| `iql`, `rfqi`, `rorl` | Offline, model-free |
| `mopo`, `rambo` | Offline, model-based |
| `synther-iql` | Offline, generative |
| `atla`, `causaldro-online`, `dr-sac` | Online, model-free |

Arguments after `--` are passed on to the train script.

```bash
python baselines/run_baseline.py \
    -c robustrllib/configs/experiment/td3bc_hopper.yaml -- --seed 0
```

**`baselines/run_baseline.py` needs an `entry` key.** The card
`robustrllib/configs/algorithm/rorl.yaml` has none, so for RORL the launcher stops with
`ValueError: algorithm config has no 'entry' train script: rorl`.

Method pages such as [RORL](../algorithms/robust-offline/rorl.md) give the command of each
method. The methods are listed under [Algorithms](../algorithms/index.md), in four groups:
[standard](../algorithms/standard/index.md),
[robust online](../algorithms/robust-online/index.md),
[robust offline](../algorithms/robust-offline/index.md) and
[robust safe](../algorithms/robust-safe/index.md).

## Override settings

| Level | How | Use |
|---|---|---|
| Algorithm card | Edit `hparams` of the card | Defaults that hold for every task |
| Experiment file | Add keys under `hparams` or `train` in a copy of the file | A setting of one task or one study |
| Command line | Flags of the train script | Seed, device, a short test run |

The flags of `baselines/rorl/train_rorl.py`:

| Flag | Overrides |
|---|---|
| `--seed` | `train.seed`, and a trailing `seed<N>` of the output directory |
| `--device` | The device. The default is CUDA when available. |
| `--epochs`, `--updates-per-epoch`, `--batch-size` | The keys of the same name under `train` |
| `--eval-steps` | `train.eval_steps_per_epoch` |
| `--torch-threads`, `--out-dir` | The keys of the same name under `train` |
| `--resume {auto,never}` | Whether the run continues from `ckpt/resume.pt` |
| `--smoke` | One epoch of one update, written to `<out_dir>_smoke` |

Each training seed is one run with its own run directory.

```bash
python baselines/rorl/train_rorl.py \
    -c robustrllib/configs/experiment/rorl_hopper.yaml --seed 0
python baselines/rorl/train_rorl.py \
    -c robustrllib/configs/experiment/rorl_hopper.yaml --seed 1
```

!!! tip
    Hyperparameters of the method, such as `q_smooth_eps`, have no flag. A change in the
    experiment file is recorded with the run.

## Run directory

A finished RORL run writes to `runs/rorl/hopper_medium_seed0/`.

| File | Content |
|---|---|
| `ckpt/epNNNN.pt` | The policy after `NNNN` epochs, saved every `save_every` epochs and at the end |
| `resolved_config.json` | Both cards, the merged hyperparameters, the resolved training settings, a dataset summary |
| `run_manifest.json` | Method, seed, run directory, formal-result flag |
| `learning_curve.json` | One row per epoch: nominal return during training and the losses |
| `checkpoint_index.json` | The saved checkpoints with epoch and update count |
| `training_complete.json` | Written last; marks the run as finished |
| `unified_adapter.json` | Written only by `scripts/robustgym.py` |

The checkpoint with the highest number is the last checkpoint, and **it is the one the
benchmark evaluates**. A run directory that contains `training_complete.json` is not
overwritten: the trainer refuses to start.

| Event | Behaviour |
|---|---|
| Every `resume_every` epochs | The full training state is written to `ckpt/resume.pt` |
| The same command is run again | Training continues from `ckpt/resume.pt` |
| `SIGTERM` or `SIGUSR1` | The state is saved at the next epoch boundary; exit code 75 |
| Completion | `ckpt/resume.pt` is removed |

## Online methods

An online method has no dataset and measures its budget in environment steps.

```yaml title="robustrllib/configs/experiment/dr_hopper_axis_narrow.yaml (comments omitted)"
algorithm: robustrllib/configs/algorithm/sac_dr.yaml
task: robustrllib/configs/task/hopper_online.yaml
dr: robustrllib/configs/dr/mujoco_axis_narrow.yaml
eval: robustrllib/configs/eval/t0_mujoco.yaml
train:
  seed: 0
  eval_seed: 3
  total_steps: 1000000
  stage_steps: 100000
  eval_every_stages: 1
  eval_episodes: 5
  out_dir: runs/dr/hopper_axis_narrow_seed0
```

```bash
python scripts/robustgym.py train \
    --config robustrllib/configs/experiment/dr_hopper_axis_narrow.yaml --seed 0
```

| | Offline (RORL) | Online (domain randomization with SAC) |
|---|---|---|
| Task card | `hopper_minari_medium.yaml`, with `datasets` | `hopper_online.yaml`, without a dataset |
| Budget | `epochs` times `updates_per_epoch` updates | `total_steps` environment steps in stages of `stage_steps` |
| Training environment | None | Built with `make_robust` |
| Extra card | None | `dr` |
| Last checkpoint | `ckpt/ep3000.pt`, named after the epoch | `ckpt/ep1000.pt`, named after the steps in thousands |
| Extra output | None | `dr_provenance.json` |

The `dr` card is where shifts enter training.

```yaml title="robustrllib/configs/dr/mujoco_axis_narrow.yaml (comments omitted)"
randomization:
  - {param: gravity,                    distribution: uniform, low: 0.90, high: 1.10}
  - {param: body_pos_xyz, index: all,   distribution: uniform, low: 0.90, high: 1.10}
  - {param: actuator_gear, index: all,  distribution: uniform, low: 0.90, high: 1.10}
curriculum: {type: constant, end: 1.0}
```

Each entry becomes one [Dynamic shift](../shifts/sources/dynamic.md) in the
[Stochastic](../shifts/modes/stochastic.md) mode, on the target `dynamics`, drawn anew at every
`reset`.

```python
from robustrllib import ShiftSpec

ShiftSpec("dynamics", "uniform", {"param": "gravity", "low": 0.9, "high": 1.1})
```

With `robustrllib/configs/dr/nodr.yaml`, whose list is empty, the same trainer runs plain SAC on
the nominal task.

Experiments written for the `Algo` interface train, evaluate and save in one process. See
[Add an Algorithm](add-an-algorithm.md).

```bash
python examples/run_experiment.py \
    -c robustrllib/configs/experiment/sac_hopper.yaml
```

## Launch rules

- Commands are run from the root of the checkout, and config references are relative to it.
- The task card is nominal; no condition of the evaluation grid is applied during training.
- Whatever a method adds to its training environment, such as randomization ranges, is part of
  the method.
- Each training seed is a separate run with its own run directory.
- Method hyperparameters are changed in the experiment file, not on the command line.
- The return in `learning_curve.json` is a training diagnostic; reported scores come from the
  [Evaluation Protocol](../evaluation/protocol.md).
- A finished run directory is never reused; a new seed or `--out-dir` starts a new one.
