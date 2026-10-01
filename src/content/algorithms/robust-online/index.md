---
title: Robust Online Algorithms
---

# Robust Online Algorithms

Robust online methods learn through continued interaction with the environment. They are organised by where robustness enters: learner-centric methods change how experience is optimised, and environment-centric methods collect their rollouts in a perturbed environment.

## Features

| Feature | Robust Online Algorithms |
|---|---|
| Interface | One experiment file per run, launched with a training script |
| Method selection | The `algorithm` card named by the experiment file |
| Training data | Rollouts collected during training |
| Training environment | Nominal, except for environment-centric methods |
| Budget | Environment steps, native to each method |
| Evaluation | The frozen last checkpoint, on the grid named by the `eval` card |

## Supported methods

| Method | Family | Base | Claimed<br>robustness | Shifted-env<br>rollout | Adversarial<br>network | Learned<br>model |
|---|---|---|---|:-:|:-:|:-:|
| [**ATLA**](atla.md) | <span class="rl-badge rl-fam-learner">Learner-centric</span> | PPO | Observation |  | ✓ |  |
| [**ATLA-SA**](atla-sa.md) | <span class="rl-badge rl-fam-learner">Learner-centric</span> | PPO | Observation |  | ✓ |  |
| [**RSC**](rsc.md) | <span class="rl-badge rl-fam-learner">Learner-centric</span> | SAC | Semantic |  |  | ✓ |
| [**RARL**](rarl.md) | <span class="rl-badge rl-fam-environment">Environment-centric</span> | PPO / TRPO | Dynamic | ✓ | ✓ |  |
| [**DR**](dr.md) | <span class="rl-badge rl-fam-environment">Environment-centric</span> | SAC / PPO | Dynamic | ✓ |  |  |

*Claimed robustness* is the shift the original paper targets.

## Run a method

Every method is launched from an experiment file. ATLA-SA on Hopper:

```bash
python baselines/train.py \
    -c robustrllib/configs/experiment/atla_sa_hopper.yaml --seed 0
python baselines/evaluate.py --run runs/atla_sa_hopper/seed0
```

Every method page gives the command for that method. [Train an algorithm](../run-a-method.md) explains the experiment file, the overrides and the run directory.

## Configuration

| Method | Implementation | Experiment file | Training budget |
|---|---|---|---|
| [ATLA](atla.md) | `baselines/atla` | `atla_hopper.yaml` | About 5M environment steps (2441 iterations of 2048 steps) |
| [ATLA-SA](atla-sa.md) | `baselines/atla` | `atla_sa_hopper.yaml` | About 5M environment steps (2441 iterations of 2048 steps) |
| [RSC](rsc.md) | `baselines/rsc` | `rsc_hopper.yaml` | 1M environment steps |
| [RARL](rarl.md) | `baselines/rarl` | `rarl_ppo_hopper.yaml` | 2M environment steps |
| [DR](dr.md) | `baselines/dr_sac` | `dr_sac_hopper.yaml` | 1M environment steps (DR-SAC) |

Experiment files are in `robustrllib/configs/experiment/`. Each names the algorithm card, the task card and the evaluation grid of the run. **Every method keeps its native training recipe and budget**; what is shared is the evaluation.

## Robust performance

Normalized score of the frozen last checkpoint. Q1 to Q4 are the severity quartiles of each perturbation ladder, ordered by displacement from the nominal setting, and *All* covers every shifted condition.

| Method | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| [ATLA](atla.md) | 72.4 | 65.9 | 57.2 | 51.4 | 39.3 | 53.4 |
| [ATLA-SA](atla-sa.md) | 77.6 | 72.1 | 65.0 | 56.3 | 45.5 | 59.6 |
| [RSC](rsc.md) | 77.9 | 67.7 | 61.8 | 44.1 | 38.2 | 52.7 |
| [RARL-PPO](rarl.md) | 76.3 | 65.2 | 49.4 | 43.8 | 38.4 | 49.4 |
| [RARL-TRPO](rarl.md) | 72.8 | 64.4 | 51.9 | 45.3 | 37.7 | 49.8 |
| [DR](dr.md) | 91.1 | 84.7 | 76.9 | 58.3 | 48.2 | 66.8 |

Scores are not clipped: 0 and 100 are reference points, not bounds. The protocol is described in [Evaluation Protocol](../../evaluation/protocol.md).

## Method pages

**Learner-centric**

- [ATLA](atla.md): A policy trained against an observation adversary that is itself an RL agent.
- [ATLA-SA](atla-sa.md): ATLA plus a state-adversarial KL regulariser and a 100-step recurrent policy.
- [RSC](rsc.md): Causal counterfactual replay that removes correlations a policy would exploit.

**Environment-centric**

- [RARL](rarl.md): A two-player zero-sum game against an adversary that applies external forces.
- [DR](dr.md): Simulator parameters resampled every episode from fixed ranges.
