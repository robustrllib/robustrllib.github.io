---
title: RARL
---

# RARL

<p class="rl-subtitle">Robust Adversarial Reinforcement Learning</p>

<p class="rl-badges"><span class="rl-badge rl-setting">Online</span><span class="rl-badge rl-fam-environment">Environment-centric</span><span class="rl-badge rl-plain">Base · PPO / TRPO</span><span class="rl-badge rl-plain">Claims · dynamic shift</span></p>

A two-player zero-sum game against an adversary that applies external forces.

## Features

| Feature | Value |
|---|---|
| Group | [Robust Online Algorithms](index.md) |
| Setting | Online |
| Family | Environment-centric |
| Base algorithm | PPO / TRPO |
| Claimed robustness | Dynamic shift |
| Shifted-env rollout | Yes |
| Adversarial network | Yes |
| Learned model | No |
| Training budget | 2M environment steps |
| Original paper | Pinto et al. *Robust Adversarial Reinforcement Learning*. ICML, 2017. |

## Mechanism

RARL casts robustness as a two-player zero-sum game. An adversary applies bounded external
forces to the robot and is trained to minimise the protagonist's return, and the two are
updated in alternating blocks.

The library provides two variants that differ only in the policy optimiser. TRPO appears in
the library only as the base of RARL-TRPO.

## Run the method

```bash
python baselines/train.py \
    -c robustrllib/configs/experiment/rarl_ppo_hopper.yaml --seed 0
python baselines/train.py \
    -c robustrllib/configs/experiment/rarl_trpo_hopper.yaml --seed 0
python baselines/evaluate.py --run runs/rarl_ppo_hopper/seed0
```

| File | Path |
|---|---|
| Implementation | `baselines/rarl` |
| Algorithm card | `robustrllib/configs/algorithm/rarl_ppo.yaml` |
| Experiment file | `robustrllib/configs/experiment/rarl_ppo_hopper.yaml` |

Training rollouts come from the method's own perturbed environment. The configuration files are explained in [Run a Method](../run-a-method.md), and the evaluation of the frozen checkpoint in [Evaluation Protocol](../../evaluation/protocol.md).

## Robust performance

Normalized score of the frozen last checkpoint. Q1 to Q4 are the severity quartiles of each perturbation ladder, ordered by displacement from the nominal setting, and *All* covers every shifted condition.

| Method | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| **RARL-PPO** | **76.3** | **65.2** | **49.4** | **43.8** | **38.4** | **49.4** |
| PPO (base algorithm) | 71.2 | 58.8 | 47.7 | 41.2 | 37.2 | 46.2 |
| **RARL-TRPO** | **72.8** | **64.4** | **51.9** | **45.3** | **37.7** | **49.8** |

## By task

**RARL-PPO**

| Task | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| CarRacing | 75.7 | 72.7 | 53.6 | 63.3 | 57.5 | 62.9 |
| FetchReach | 96.5 | 93.2 | 85.7 | 77.7 | 77.2 | 83.4 |
| HalfCheetah | 25.6 | 22.4 | 18.1 | 14.4 | 11.4 | 16.6 |
| Hopper | 74.1 | 59.2 | 37.2 | 26.2 | 20.7 | 35.8 |
| PointMaze | 73.4 | 63.4 | 50.3 | 47.6 | 34.4 | 48.9 |
| Walker2d | 112.3 | 80.3 | 51.4 | 33.4 | 29.5 | 48.6 |

**RARL-TRPO**

| Task | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| CarRacing | 52.5 | 50.5 | 47.9 | 41.5 | 39.8 | 45.0 |
| FetchReach | 96.5 | 93.3 | 86.4 | 78.3 | 76.8 | 83.7 |
| HalfCheetah | 39.0 | 35.8 | 28.0 | 21.9 | 16.7 | 25.6 |
| Hopper | 76.3 | 62.2 | 42.6 | 37.5 | 24.7 | 41.8 |
| PointMaze | 74.6 | 65.7 | 60.8 | 59.0 | 39.8 | 56.3 |
| Walker2d | 97.9 | 78.7 | 45.5 | 33.6 | 28.5 | 46.6 |

## References

- Pinto et al. *Robust Adversarial Reinforcement Learning*. ICML, 2017.
