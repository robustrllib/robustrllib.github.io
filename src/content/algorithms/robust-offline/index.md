---
title: Robust Offline Algorithms
---

# Robust Offline Algorithms

Robust offline methods learn from a fixed dataset and never interact with the environment, so they meet every shift without having seen it. They are organised by where robustness enters: the learner, the data, or a generative model of the data.

## Features

| Feature | Robust Offline Algorithms |
|---|---|
| Interface | One experiment file per run, launched with a training script |
| Method selection | The `algorithm` card named by the experiment file |
| Training data | A fixed dataset, named by the `task` card |
| Training environment | None. The environment is used for evaluation only |
| Budget | Gradient updates, native to each method |
| Evaluation | The frozen last checkpoint, on the grid named by the `eval` card |

## Supported methods

| Method | Family | Base | Claimed<br>robustness | Shifted-env<br>rollout | Adversarial<br>network | Learned<br>model |
|---|---|---|---|:-:|:-:|:-:|
| [**RFQI**](rfqi.md) | <span class="rl-badge rl-fam-learner">Learner-centric</span> | FQI | Dynamic |  |  |  |
| [**RORL**](rorl.md) | <span class="rl-badge rl-fam-learner">Learner-centric</span> | SAC | Observation |  |  |  |
| [**ATLA-IQL**](atla-iql.md) | <span class="rl-badge rl-fam-learner">Learner-centric</span> | IQL | Observation |  | ✓ |  |
| [**RSC-IQL**](rsc-iql.md) | <span class="rl-badge rl-fam-data">Data-centric</span> | IQL | Semantic |  |  | ✓ |
| [**RAMBO**](rambo.md) | <span class="rl-badge rl-fam-data">Data-centric</span> | SAC | Dynamic |  | ✓ | ✓ |
| [**ROMB**](romb.md) | <span class="rl-badge rl-fam-generative">Generative</span> | IQL | Dynamic |  | ✓ | ✓ |
| [**FWM**](fwm.md) | <span class="rl-badge rl-fam-generative">Generative</span> | IQL | Dynamic |  |  | ✓ |
| [**PLR-PVL**](plr-pvl.md) | <span class="rl-badge rl-fam-generative">Generative</span> | IQL | Dynamic |  |  | ✓ |

*Claimed robustness* is the shift the original paper targets.

## Run a method

Every method is launched from an experiment file. RORL on Hopper:

```bash
python baselines/train.py \
    -c robustrllib/configs/experiment/rorl_hopper.yaml --seed 0
python baselines/evaluate.py --run runs/rorl_hopper/seed0
```

Every method page gives the command for that method. [Run a Method](../run-a-method.md) explains the experiment file, the overrides and the run directory.

## Configuration

| Method | Implementation | Experiment file | Training budget |
|---|---|---|---|
| [RFQI](rfqi.md) | `baselines/rfqi` | `rfqi_hopper.yaml` | 500k updates, batch 1000 |
| [RORL](rorl.md) | `baselines/rorl` | `rorl_hopper.yaml` | 3M updates on MuJoCo and Door, 1M elsewhere |
| [ATLA-IQL](atla-iql.md) | `baselines/atla_iql` | `atla_iql_hopper.yaml` | 1M updates, batch 256 |
| [RSC-IQL](rsc-iql.md) | `baselines/rsc_iql` | `rsc_iql_hopper.yaml` | 1M updates, batch 256 |
| [RAMBO](rambo.md) | `baselines/rambo` | `rambo_hopper.yaml` | 2M updates on MuJoCo and Door, 1M elsewhere |
| [ROMB](romb.md) | `baselines/romb` | `romb_hopper.yaml` | 1M updates, batch 256 |
| [FWM](fwm.md) | `baselines/fwm` | `fwm_hopper.yaml` | 1M updates, batch 256 |
| [PLR-PVL](plr-pvl.md) | `baselines/plr_pvl` | `plr_pvl_hopper.yaml` | 1M updates, batch 256 |

Experiment files are in `robustrllib/configs/experiment/`. Each names the algorithm card, the task card and the evaluation grid of the run. **Every method keeps its native training recipe and budget**; what is shared is the evaluation.

## Robust performance

Normalized score of the frozen last checkpoint. Q1 to Q4 are the severity quartiles of each perturbation ladder, ordered by displacement from the nominal setting, and *All* covers every shifted condition.

| Method | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| [RFQI](rfqi.md) | 79.3 | 58.3 | 50.4 | 36.5 | 29.7 | 43.6 |
| [RORL](rorl.md) | 79.3 | 60.3 | 48.7 | 40.8 | 31.4 | 45.3 |
| [ATLA-IQL](atla-iql.md) | 108.0 | 81.4 | 61.3 | 44.3 | 40.4 | 56.9 |
| [RSC-IQL](rsc-iql.md) | 100.4 | 80.3 | 56.2 | 42.2 | 33.3 | 53.0 |
| [RAMBO](rambo.md) | 95.5 | 73.5 | 57.4 | 45.9 | 37.8 | 53.7 |
| [ROMB](romb.md) | 106.6 | 79.7 | 59.7 | 44.0 | 36.2 | 54.9 |
| [FWM](fwm.md) | 105.9 | 81.8 | 62.1 | 45.3 | 37.0 | 56.6 |
| [PLR-PVL](plr-pvl.md) | 102.7 | 76.9 | 60.2 | 45.4 | 37.3 | 55.0 |

Scores are not clipped: 0 and 100 are reference points, not bounds. The protocol is described in [Evaluation Protocol](../../evaluation/protocol.md).

## Method pages

**Learner-centric**

- [RFQI](rfqi.md): Worst-case Bellman update over a total-variation uncertainty set.
- [RORL](rorl.md): Local policy and value smoothing, with an ensemble penalty at perturbed states.
- [ATLA-IQL](atla-iql.md): A learned observation adversary, trained through the critic instead of by RL.

**Data-centric**

- [RSC-IQL](rsc-iql.md): Rewrites logged transitions along the dimensions a causal mask marks as non-causal.
- [RAMBO](rambo.md): Model rollouts from an ensemble that is trained adversarially against the policy.

**Data-centric · generative**

- [ROMB](romb.md): A world model adapted against the policy under a constrained maximin objective.
- [FWM](fwm.md): Multi-step critic targets whose future is sampled from a flow-matching world model.
- [PLR-PVL](plr-pvl.md): An ensemble of world models, prioritised per sample by the value loss they induce.
