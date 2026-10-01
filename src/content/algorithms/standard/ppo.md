---
title: PPO
---

# PPO

<p class="rl-subtitle">Proximal Policy Optimization</p>

<p class="rl-badges"><span class="rl-badge rl-setting">Online</span><span class="rl-badge rl-fam-standard">Standard reference</span></p>

The on-policy reference: a clipped probability-ratio surrogate with GAE.

## Features

| Feature | Value |
|---|---|
| Group | [Standard Algorithms](index.md) |
| Setting | Online |
| Family | Standard reference |
| Base algorithm | — |
| Claimed robustness | — |
| Training budget | 2M environment steps |
| Original paper | Schulman et al. *Proximal Policy Optimization Algorithms*. arXiv:1707.06347, 2017. |

## Mechanism

PPO is the on-policy reference: a clipped probability-ratio surrogate on trajectories from
the current policy, with generalised advantage estimation. The library uses the
Stable-Baselines3 implementation.

PPO is the backbone of ATLA, ATLA-SA and RARL-PPO.

## Run the method

```bash
python baselines/train.py \
    -c robustrllib/configs/experiment/ppo_hopper.yaml --seed 0
python baselines/evaluate.py --run runs/ppo_hopper/seed0
```

| File | Path |
|---|---|
| Implementation | `baselines/sb3` |
| Algorithm card | `robustrllib/configs/algorithm/ppo.yaml` |
| Experiment file | `robustrllib/configs/experiment/ppo_hopper.yaml` |

Training is on the nominal task. The configuration files are explained in [Train an algorithm](../run-a-method.md), and the evaluation of the frozen checkpoint in [Evaluation Protocol](../../evaluation/protocol.md).

## Robust performance

Normalized score of the frozen checkpoint. Q1 to Q4 are the severity quartiles of each perturbation ladder, ordered by displacement from the nominal setting, and *All* covers every shifted condition. The last row averages the tasks.

| Task | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| CarRacing | 78.1 | 73.1 | 69.9 | 60.3 | 55.9 | 64.7 |
| FetchReach | 96.6 | 92.9 | 83.2 | 75.7 | 80.7 | 83.1 |
| HalfCheetah | 23.4 | 19.3 | 13.9 | 10.2 | 8.0 | 12.9 |
| Hopper | 75.5 | 55.1 | 33.8 | 26.6 | 20.9 | 34.1 |
| PointMaze | 76.7 | 68.2 | 55.7 | 51.4 | 38.5 | 53.4 |
| Walker2d | 77.1 | 44.1 | 29.5 | 23.1 | 19.1 | 29.0 |
| **Average** | **71.2** | **58.8** | **47.7** | **41.2** | **37.2** | **46.2** |

## References

- Schulman et al. *Proximal Policy Optimization Algorithms*. arXiv:1707.06347, 2017.
- Raffin et al. *Stable-Baselines3: Reliable Reinforcement Learning Implementations*. JMLR, 2021.
