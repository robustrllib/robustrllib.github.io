---
title: TD3+BC
---

# TD3+BC

<p class="rl-subtitle">TD3 with Behaviour Cloning</p>

<p class="rl-badges"><span class="rl-badge rl-setting">Offline</span><span class="rl-badge rl-fam-standard">Standard reference</span></p>

TD3 with a behaviour-cloning term balanced against the critic.

## Features

| Feature | Value |
|---|---|
| Group | [Standard Algorithms](index.md) |
| Setting | Offline |
| Family | Standard reference |
| Base algorithm | — |
| Claimed robustness | — |
| Training budget | 1M updates, batch 256 |
| Original paper | Fujimoto and Gu *A Minimalist Approach to Offline Reinforcement Learning*. NeurIPS, 2021. |

## Mechanism

TD3+BC adds a behaviour-cloning term to the TD3 actor loss and normalises states. The term is
balanced against the critic by dividing by the mean absolute Q-value over the batch.

## Run the method

```bash
python baselines/train.py \
    -c robustrllib/configs/experiment/td3bc_hopper.yaml --seed 0
python baselines/evaluate.py --run runs/td3bc_hopper/seed0
```

| File | Path |
|---|---|
| Implementation | `baselines/td3bc` |
| Algorithm card | `robustrllib/configs/algorithm/td3bc.yaml` |
| Experiment file | `robustrllib/configs/experiment/td3bc_hopper.yaml` |

Training is on the nominal task. The configuration files are explained in [Train an algorithm](../run-a-method.md), and the evaluation of the frozen checkpoint in [Evaluation Protocol](../../evaluation/protocol.md).

## Robust performance

Normalized score of the frozen last checkpoint. Q1 to Q4 are the severity quartiles of each perturbation ladder, ordered by displacement from the nominal setting, and *All* covers every shifted condition.

| Method | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| **TD3+BC** | **89.4** | **70.5** | **57.1** | **44.5** | **32.9** | **51.3** |

## By task

| Task | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| Door | 0.9 | 0.9 | 0.9 | 0.9 | 0.9 | 0.9 |
| HalfCheetah | 96.9 | 76.0 | 56.5 | 42.6 | 29.6 | 51.2 |
| Hopper | 110.2 | 64.9 | 52.8 | 39.0 | 20.3 | 44.3 |
| LunarLander | 101.5 | 99.2 | 95.7 | 83.2 | 78.9 | 89.2 |
| PointMaze | 92.7 | 61.9 | 46.5 | 37.6 | 21.0 | 41.8 |
| Walker2d | 134.2 | 120.1 | 90.2 | 63.9 | 46.9 | 80.3 |

## References

- Fujimoto and Gu *A Minimalist Approach to Offline Reinforcement Learning*. NeurIPS, 2021.
