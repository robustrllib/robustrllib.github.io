---
title: RAMBO
---

# RAMBO

<p class="rl-subtitle">Robust Adversarial Model-Based Offline RL</p>

<p class="rl-badges"><span class="rl-badge rl-setting">Offline</span><span class="rl-badge rl-fam-data">Data-centric</span><span class="rl-badge rl-plain">Base · SAC</span><span class="rl-badge rl-plain">Claims · dynamic shift</span></p>

Model rollouts from an ensemble that is trained adversarially against the policy.

## Features

| Feature | Value |
|---|---|
| Group | [Robust Offline Algorithms](index.md) |
| Setting | Offline |
| Family | Data-centric |
| Base algorithm | SAC |
| Claimed robustness | Dynamic shift |
| Shifted-env rollout | No |
| Adversarial network | Yes |
| Learned model | Yes |
| Training budget | 2M updates on MuJoCo and Door, 1M elsewhere |
| Original paper | Rigter et al. *RAMBO-RL: Robust Adversarial Model-Based Offline Reinforcement Learning*. NeurIPS, 2022. |

## Mechanism

RAMBO augments the dataset with short rollouts from a learned dynamics ensemble and replaces
the uncertainty penalty by adversarial training of the model. The ensemble is updated to
lower the critic's value of the policy's transitions while a maximum-likelihood term keeps
it close to the data. The policy is behaviour-cloned before the first epoch.

RAMBO is a standalone recipe rather than a mechanism added to a shared base algorithm.

## Run the method

```bash
python baselines/train.py \
    -c robustrllib/configs/experiment/rambo_hopper.yaml --seed 0
python baselines/evaluate.py --run runs/rambo_hopper/seed0
```

| File | Path |
|---|---|
| Implementation | `baselines/rambo` |
| Algorithm card | `robustrllib/configs/algorithm/rambo.yaml` |
| Experiment file | `robustrllib/configs/experiment/rambo_hopper.yaml` |

Training is on the nominal task. The configuration files are explained in [Run a Method](../run-a-method.md), and the evaluation of the frozen checkpoint in [Evaluation Protocol](../../evaluation/protocol.md).

## Robust performance

Normalized score of the frozen last checkpoint. Q1 to Q4 are the severity quartiles of each perturbation ladder, ordered by displacement from the nominal setting, and *All* covers every shifted condition.

| Method | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| **RAMBO** | **95.5** | **73.5** | **57.4** | **45.9** | **37.8** | **53.7** |

## By task

| Task | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| Door | 55.8 | 43.7 | 47.9 | 38.0 | 40.3 | 42.5 |
| HalfCheetah | 117.4 | 83.4 | 44.0 | 29.1 | 21.8 | 44.6 |
| Hopper | 99.0 | 61.2 | 58.6 | 44.3 | 32.7 | 49.2 |
| LunarLander | 98.7 | 94.4 | 85.0 | 76.8 | 73.1 | 82.8 |
| PointMaze | 75.3 | 47.9 | 41.0 | 33.9 | 18.8 | 35.4 |
| Walker2d | 126.7 | 110.6 | 67.9 | 53.2 | 40.1 | 68.0 |

## References

- Rigter et al. *RAMBO-RL: Robust Adversarial Model-Based Offline Reinforcement Learning*. NeurIPS, 2022.
