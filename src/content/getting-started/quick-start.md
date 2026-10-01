# Quick Start

RobustRLlib is installed from a source checkout. The steps below build one shifted task, train
one method on the nominal task and score it under shift. All commands are run from the root of
the checkout; the [Overview](../getting-started/overview.md) describes what the library covers.

## Create environment

The library requires Python 3.8 or newer. The examples in this documentation were run with
Python 3.11.

```bash
conda create -n robustrllib python=3.11
conda activate robustrllib
```

## Install RobustRLlib

```bash
pip install -e ".[mujoco]"
pip install -r requirements.txt
pip install pyyaml torch minari
```

The first command installs the library with the MuJoCo bindings. The second installs the
packages that the bundled task families import. The third adds what configuration files,
training and offline datasets need. The library is then imported under the name `robustrllib`.

!!! note
    `full_requirements.txt` holds the pinned package list of one working environment. If the
    import stops with `ModuleNotFoundError`, install the package it names. The online
    references PPO and SAC also need `stable-baselines3`.

## Verify the installation

```bash
python -c "from robustrllib import make_robust; \
env = make_robust('Hopper-v5'); print(env.reset(seed=0)[0].shape)"
```

```text
(11,)
```

The feature tour builds several shifted environments, edits a physical parameter in memory,
runs a scheduled shift and compares two seeded rollouts. It ends with `All sections ran.`

```bash
python examples/mujoco_quickstart.py Hopper-v5
```

The import prints `Overriding environment ... already in registry` warnings. They come from the
environment registry and can be ignored.

## Run a first shifted environment

A shift is declared as data and applied by `make_robust`. The example composes a Dynamic shift
on the target `dynamics` with an Observation shift on the target `observation`; the list order
is the stacking order.

```python
from robustrllib import make_robust, ShiftSpec

env = make_robust("Hopper-v5", shifts=[
    ShiftSpec("dynamics", "scale", {"param": "gravity", "factor": 1.3}),
    ShiftSpec("observation", "gauss", {"sigma": 0.05}),
], seed=0)

obs, info = env.reset(seed=0)
obs, reward, terminated, truncated, info = env.step(env.action_space.sample())
print(round(env.unwrapped.model.opt.gravity[2], 3))
```

```text
-12.753
```

Gravity is 1.3 times its nominal value of -9.81, and the observation carries Gaussian noise.

!!! tip
    Neither the import nor `make_robust` reads the command line, so a script may define and
    parse arguments of its own.

## Train a first method

An experiment file names an algorithm, a task and an evaluation grid. The command trains RORL
on the nominal `Hopper-v5` task from an offline dataset, which is downloaded on first use, and
writes checkpoints to `runs/rorl/hopper_medium_seed0/ckpt/`.

```bash
python baselines/rorl/train_rorl.py \
    -c robustrllib/configs/experiment/rorl_hopper.yaml --seed 0
```

The full run performs three million updates. **`--smoke` runs one update** and only tests the
plumbing; it writes to a run directory of its own.

## Evaluate it under shift

The evaluator loads the last checkpoint of the run and scores it on every condition of the
grid. Each condition is a list of shifts, and the grid of this experiment holds Dynamic shifts
in the Parametric mode: gravity, limb length and actuator gear at four factors each. The result
is written to `final_eval.json` in the run directory.

```bash
python baselines/eval_final.py \
    -c robustrllib/configs/experiment/rorl_hopper.yaml \
    --run-dir runs/rorl/hopper_medium_seed0
```

The documentation continues in three groups: [Algorithms](../algorithms/index.md),
[Shift Sources and Modes](../shifts/index.md) and the
[Evaluation Protocol](../evaluation/protocol.md).
