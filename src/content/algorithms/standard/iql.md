---
title: IQL
---

# IQL

<p class="rl-subtitle">Implicit Q-Learning</p>

<p class="rl-badges"><span class="rl-badge rl-setting">Offline</span><span class="rl-badge rl-fam-standard">Standard reference</span></p>

Expectile-regression value learning that never queries out-of-distribution actions.

## Features

| Feature | Value |
|---|---|
| Group | [Standard Algorithms](index.md) |
| Setting | Offline |
| Family | Standard reference |
| Base algorithm | — |
| Claimed robustness | — |
| Training budget | 1M updates, batch 256 |
| Original paper | Kostrikov et al. *Offline Reinforcement Learning with Implicit Q-Learning*. arXiv:2110.06169, 2021. |

## Mechanism

IQL avoids querying out-of-distribution actions altogether. A value function is fitted to the
critic by expectile regression, the twin critics bootstrap from that value function, and the
actor is extracted by advantage-weighted regression.

IQL is the backbone of five mechanisms in the library (ATLA-IQL, RSC-IQL, ROMB, FWM and
PLR-PVL). Each of them changes one component and keeps the rest of this recipe.

## Run the method

```bash
python baselines/iql/train_iql.py \
    -c robustrllib/configs/experiment/iql_hopper.yaml --seed 0
```

| File | Path |
|---|---|
| Implementation | `baselines/iql` |
| Algorithm card | `robustrllib/configs/algorithm/iql.yaml` |
| Experiment file | `robustrllib/configs/experiment/iql_hopper.yaml` |

Training is on the nominal task. The configuration files are explained in [Run a Method](../run-a-method.md), and the evaluation of the frozen checkpoint in [Evaluation Protocol](../../evaluation/protocol.md).

## Robust performance

Normalized score of the frozen last checkpoint. Q1 to Q4 are the severity quartiles of each perturbation ladder, ordered by displacement from the nominal setting, and *All* covers every shifted condition.

| Method | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| **IQL** | **102.5** | **77.5** | **57.0** | **42.1** | **35.4** | **53.1** |

## By task

| Task | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| Door | 61.5 | 61.8 | 41.3 | 19.1 | 16.6 | 34.7 |
| HalfCheetah | 121.3 | 75.4 | 41.8 | 25.8 | 19.0 | 40.5 |
| Hopper | 106.8 | 59.2 | 51.2 | 44.0 | 24.7 | 44.8 |
| LunarLander | 100.0 | 94.7 | 86.5 | 72.8 | 70.4 | 81.6 |
| PointMaze | 100.0 | 64.0 | 51.3 | 44.0 | 38.7 | 49.5 |
| Walker2d | 125.1 | 109.6 | 69.7 | 46.8 | 43.0 | 67.3 |

## References

- Kostrikov et al. *Offline Reinforcement Learning with Implicit Q-Learning*. arXiv:2110.06169, 2021.
