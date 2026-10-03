---
title: ROMB
---

# ROMB

<p class="rl-subtitle">Policy-driven world-model adaptation</p>

<p class="rl-badges"><span class="rl-badge rl-setting">Offline</span><span class="rl-badge rl-fam-generative">Data-centric · generative</span><span class="rl-badge rl-plain">Base · IQL</span><span class="rl-badge rl-plain">Claims · dynamic shift</span></p>

A world model adapted against the policy under a constrained maximin objective.

## Features

| Feature | Value |
|---|---|
| Group | [Robust Offline Algorithms](index.md) |
| Setting | Offline |
| Family | Data-centric · generative |
| Base algorithm | IQL |
| Claimed robustness | Dynamic shift |
| Shifted-env rollout | No |
| Adversarial network | Yes |
| Learned model | Yes |
| Training budget | 1M updates, batch 256 |
| Original paper | Chen et al. *Policy-Driven World Model Adaptation for Robust Offline Model-based Reinforcement Learning*. arXiv:2505.13709, 2025. |

## Mechanism

ROMB adapts a learned world model against the policy under a constrained maximin objective.
The model is pushed toward transitions that lower the policy's value while a supervised loss
keeps it on the data, and the policy is trained on rollouts from the adapted model.

## Run the method

```bash
python baselines/train.py \
    -c robustrllib/configs/experiment/romb_hopper.yaml --seed 0
python baselines/evaluate.py --run runs/romb_hopper/seed0
```

| File | Path |
|---|---|
| Implementation | `baselines/romb` |
| Algorithm card | `robustrllib/configs/algorithm/romb.yaml` |
| Experiment file | `robustrllib/configs/experiment/romb_hopper.yaml` |

Training is on the nominal task. The configuration files are explained in [Train an algorithm](../run-a-method.md), and the evaluation of the frozen checkpoint in [Evaluation Protocol](../../evaluation/protocol.md).

## Robust performance

Normalized score of the frozen checkpoint. Q1 to Q4 are the severity quartiles of each shift factor's scales, ordered by displacement from the nominal setting, and *All* covers every shifted condition. The last row averages the tasks.

| Task | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| Door | 89.7 | 76.4 | 60.8 | 28.8 | 25.9 | 48.0 |
| HalfCheetah | 120.4 | 75.2 | 40.4 | 24.3 | 18.1 | 39.5 |
| Hopper | 99.1 | 60.1 | 53.5 | 46.3 | 27.5 | 46.9 |
| LunarLander | 99.6 | 92.7 | 86.2 | 73.1 | 67.6 | 80.0 |
| PointMaze | 97.6 | 64.8 | 51.1 | 43.5 | 36.5 | 49.0 |
| Walker2d | 133.1 | 108.9 | 66.0 | 48.3 | 41.8 | 66.3 |
| **Average** | **106.6** | **79.7** | **59.7** | **44.0** | **36.2** | **54.9** |

## References

- Chen et al. *Policy-Driven World Model Adaptation for Robust Offline Model-based Reinforcement Learning*. arXiv:2505.13709, 2025.
