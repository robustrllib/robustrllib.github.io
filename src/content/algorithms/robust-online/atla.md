---
title: ATLA
---

# ATLA

<p class="rl-subtitle">Alternating Training with Learned Adversaries</p>

<p class="rl-badges"><span class="rl-badge rl-setting">Online</span><span class="rl-badge rl-fam-learner">Learner-centric</span><span class="rl-badge rl-plain">Base · PPO</span><span class="rl-badge rl-plain">Claims · observation shift</span></p>

A policy trained against an observation adversary that is itself an RL agent.

## Features

| Feature | Value |
|---|---|
| Group | [Robust Online Algorithms](index.md) |
| Setting | Online |
| Family | Learner-centric |
| Base algorithm | PPO |
| Claimed robustness | Observation shift |
| Shifted-env rollout | No |
| Adversarial network | Yes |
| Learned model | No |
| Training budget | About 5M environment steps (2441 iterations of 2048 steps) |
| Original paper | Zhang et al. *Robust Reinforcement Learning on State Observations with Learned Optimal Adversary*. ICLR, 2021. |

## Mechanism

ATLA trains a policy against an *optimal* observation adversary in the state-adversarial MDP.
The adversary is itself an RL agent that outputs a bounded perturbation of the observation,
is rewarded by the protagonist's negative return, and is updated in alternation with the
protagonist.

## Run the method

```bash
python baselines/train.py \
    -c robustrllib/configs/experiment/atla_hopper.yaml --seed 0
python baselines/evaluate.py --run runs/atla_hopper/seed0
```

| File | Path |
|---|---|
| Implementation | `baselines/atla` |
| Algorithm card | `robustrllib/configs/algorithm/atla.yaml` |
| Experiment file | `robustrllib/configs/experiment/atla_hopper.yaml` |

Training is on the nominal task. The configuration files are explained in [Train an algorithm](../run-a-method.md), and the evaluation of the frozen checkpoint in [Evaluation Protocol](../../evaluation/protocol.md).

## Robust performance

Normalized score of the frozen last checkpoint. Q1 to Q4 are the severity quartiles of each perturbation ladder, ordered by displacement from the nominal setting, and *All* covers every shifted condition. The last row averages the tasks.

| Task | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| CarRacing | 58.7 | 54.8 | 54.5 | 46.8 | 40.7 | 48.7 |
| FetchReach | 85.3 | 85.3 | 86.0 | 77.1 | 67.9 | 79.1 |
| HalfCheetah | 45.3 | 42.6 | 33.9 | 26.2 | 20.2 | 30.7 |
| Hopper | 67.5 | 61.1 | 46.2 | 38.3 | 24.2 | 42.5 |
| PointMaze | 94.1 | 95.9 | 87.7 | 94.5 | 63.3 | 85.4 |
| Walker2d | 83.5 | 55.6 | 34.8 | 25.7 | 19.2 | 33.8 |
| **Average** | **72.4** | **65.9** | **57.2** | **51.4** | **39.3** | **53.4** |

## References

- Zhang et al. *Robust Reinforcement Learning on State Observations with Learned Optimal Adversary*. ICLR, 2021.
- Zhang et al. *Robust Deep Reinforcement Learning against Adversarial Perturbations on State Observations*. NeurIPS, 2020.
