---
title: RFQI
---

# RFQI

<p class="rl-subtitle">Robust Fitted Q-Iteration</p>

<p class="rl-badges"><span class="rl-badge rl-setting">Offline</span><span class="rl-badge rl-fam-learner">Learner-centric</span><span class="rl-badge rl-plain">Base · FQI</span><span class="rl-badge rl-plain">Claims · dynamic shift</span></p>

Worst-case Bellman update over a total-variation uncertainty set.

## Features

| Feature | Value |
|---|---|
| Group | [Robust Offline Algorithms](index.md) |
| Setting | Offline |
| Family | Learner-centric |
| Base algorithm | FQI |
| Claimed robustness | Dynamic shift |
| Shifted-env rollout | No |
| Adversarial network | No |
| Learned model | No |
| Training budget | 500k updates, batch 1000 |
| Original paper | Panaganti et al. *Robust Reinforcement Learning using Offline Data*. NeurIPS, 2022. |

## Mechanism

RFQI replaces the fitted-Q target by a worst-case Bellman backup over a total-variation
uncertainty set of a fixed radius around the empirical transitions. The inner maximisation is
solved through a dual variable fitted per batch, and the actor and critic follow the
BCQ-style architecture of the original release.

RFQI is a standalone recipe rather than a mechanism added to a shared base algorithm.

## Run the method

```bash
python baselines/train.py \
    -c robustrllib/configs/experiment/rfqi_hopper.yaml --seed 0
python baselines/evaluate.py --run runs/rfqi_hopper/seed0
```

| File | Path |
|---|---|
| Implementation | `baselines/rfqi` |
| Algorithm card | `robustrllib/configs/algorithm/rfqi.yaml` |
| Experiment file | `robustrllib/configs/experiment/rfqi_hopper.yaml` |

Training is on the nominal task. The configuration files are explained in [Train an algorithm](../run-a-method.md), and the evaluation of the frozen checkpoint in [Evaluation Protocol](../../evaluation/protocol.md).

## Robust performance

Normalized score of the frozen checkpoint. Q1 to Q4 are the severity quartiles of each perturbation ladder, ordered by displacement from the nominal setting, and *All* covers every shifted condition. The last row averages the tasks.

| Task | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| Door | 28.2 | 13.0 | 26.4 | 1.9 | 22.8 | 16.0 |
| HalfCheetah | 64.2 | 51.5 | 36.3 | 19.9 | 13.8 | 30.4 |
| Hopper | 108.1 | 57.1 | 48.0 | 36.2 | 22.3 | 40.9 |
| LunarLander | 95.1 | 88.7 | 82.8 | 81.7 | 69.6 | 80.2 |
| PointMaze | 71.6 | 52.6 | 42.9 | 35.9 | 20.7 | 38.0 |
| Walker2d | 108.6 | 86.6 | 65.8 | 43.5 | 28.8 | 56.2 |
| **Average** | **79.3** | **58.3** | **50.4** | **36.5** | **29.7** | **43.6** |

## References

- Panaganti et al. *Robust Reinforcement Learning using Offline Data*. NeurIPS, 2022.
