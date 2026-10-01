---
title: ATLA-IQL
---

# ATLA-IQL

<p class="rl-subtitle">Offline adaptation of ATLA on an IQL backbone</p>

<p class="rl-badges"><span class="rl-badge rl-setting">Offline</span><span class="rl-badge rl-fam-learner">Learner-centric</span><span class="rl-badge rl-plain">Base · IQL</span><span class="rl-badge rl-plain">Claims · observation shift</span></p>

A learned observation adversary, trained through the critic instead of by RL.

## Features

| Feature | Value |
|---|---|
| Group | [Robust Offline Algorithms](index.md) |
| Setting | Offline |
| Family | Learner-centric |
| Base algorithm | IQL |
| Claimed robustness | Observation shift |
| Shifted-env rollout | No |
| Adversarial network | Yes |
| Learned model | No |
| Training budget | 1M updates, batch 256 |
| Original paper | Zhang et al. *Robust Reinforcement Learning on State Observations with Learned Optimal Adversary*. ICLR, 2021. |

## Mechanism

The offline adaptation keeps ATLA's principle, a learned observation adversary alternated
with the learner. Since no environment is available, the adversary is not trained by RL: it
is trained by a differentiable objective on the critic, minimising the minimum Q-value at the
policy's action under the perturbed state.

## Run the method

```bash
python baselines/run_baseline.py \
    -c robustrllib/configs/experiment/offline_atla_iql_hopper.yaml \
    -- --seed 0
```

| File | Path |
|---|---|
| Implementation | `baselines/offline_atla_iql` |
| Algorithm card | `robustrllib/configs/algorithm/offline_atla_iql.yaml` |
| Experiment file | `robustrllib/configs/experiment/offline_atla_iql_hopper.yaml` |

Training is on the nominal task. The configuration files are explained in [Run a Method](../run-a-method.md), and the evaluation of the frozen checkpoint in [Evaluation Protocol](../../evaluation/protocol.md).

## Robust performance

Normalized score of the frozen last checkpoint. Q1 to Q4 are the severity quartiles of each perturbation ladder, ordered by displacement from the nominal setting, and *All* covers every shifted condition.

| Method | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| **ATLA-IQL** | **108.0** | **81.4** | **61.3** | **44.3** | **40.4** | **56.9** |
| IQL (base algorithm) | 102.5 | 77.5 | 57.0 | 42.1 | 35.4 | 53.1 |

## By task

| Task | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| Door | 94.9 | 85.1 | 69.3 | 34.3 | 45.5 | 58.6 |
| HalfCheetah | 112.3 | 76.2 | 41.7 | 23.4 | 17.8 | 39.8 |
| Hopper | 107.2 | 62.2 | 53.6 | 42.3 | 31.2 | 47.3 |
| LunarLander | 101.1 | 92.3 | 86.6 | 73.2 | 68.5 | 80.2 |
| PointMaze | 101.5 | 66.5 | 50.2 | 42.5 | 40.1 | 49.8 |
| Walker2d | 130.9 | 106.0 | 66.3 | 50.3 | 39.3 | 65.5 |

## References

- Zhang et al. *Robust Reinforcement Learning on State Observations with Learned Optimal Adversary*. ICLR, 2021.
