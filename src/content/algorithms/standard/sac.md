---
title: SAC
---

# SAC

<p class="rl-subtitle">Soft Actor-Critic</p>

<p class="rl-badges"><span class="rl-badge rl-setting">Online</span><span class="rl-badge rl-fam-standard">Standard reference</span></p>

The off-policy reference: twin critics and an entropy-regularised stochastic actor.

## Features

| Feature | Value |
|---|---|
| Group | [Standard Algorithms](index.md) |
| Setting | Online |
| Family | Standard reference |
| Base algorithm | — |
| Claimed robustness | — |
| Training budget | 1M environment steps |
| Original paper | Haarnoja et al. *Soft Actor-Critic: Off-Policy Maximum Entropy Deep Reinforcement Learning with a Stochastic Actor*. ICML, 2018. |

## Mechanism

SAC is the off-policy reference: twin critics with a clipped double-Q target and a
stochastic actor whose objective adds an entropy bonus with automatically tuned temperature.
The library uses the Stable-Baselines3 implementation.

SAC is the backbone of DR-SAC and RSC-SAC.

## Run the method

```bash
python baselines/train.py \
    -c robustrllib/configs/experiment/sac_hopper.yaml --seed 0
python baselines/evaluate.py --run runs/sac_hopper/seed0
```

| File | Path |
|---|---|
| Implementation | `baselines/sb3` |
| Algorithm card | `robustrllib/configs/algorithm/sac.yaml` |
| Experiment file | `robustrllib/configs/experiment/sac_hopper.yaml` |

Training is on the nominal task. The configuration files are explained in [Train an algorithm](../run-a-method.md), and the evaluation of the frozen checkpoint in [Evaluation Protocol](../../evaluation/protocol.md).

## Robust performance

Normalized score of the frozen checkpoint. Q1 to Q4 are the severity quartiles of each shift factor's scales, ordered by displacement from the nominal setting, and *All* covers every shifted condition. The last row averages the tasks.

| Task | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| CarRacing | 35.4 | 30.1 | 43.6 | 4.3 | 10.1 | 21.4 |
| FetchReach | 97.4 | 94.0 | 86.1 | 78.1 | 77.5 | 83.9 |
| HalfCheetah | 64.2 | 57.1 | 47.0 | 37.2 | 31.5 | 43.2 |
| Hopper | 71.0 | 55.4 | 45.0 | 33.0 | 24.1 | 39.4 |
| PointMaze | 99.1 | 85.9 | 73.8 | 68.4 | 54.4 | 70.6 |
| Walker2d | 104.8 | 101.0 | 92.1 | 72.8 | 60.5 | 81.6 |
| **Average** | **78.6** | **70.6** | **64.6** | **49.0** | **43.0** | **56.7** |

## References

- Haarnoja et al. *Soft Actor-Critic: Off-Policy Maximum Entropy Deep Reinforcement Learning with a Stochastic Actor*. ICML, 2018.
- Raffin et al. *Stable-Baselines3: Reliable Reinforcement Learning Implementations*. JMLR, 2021.
