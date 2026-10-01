---
title: RORL
---

# RORL

<p class="rl-subtitle">Robust Offline RL via Conservative Smoothing</p>

<p class="rl-badges"><span class="rl-badge rl-setting">Offline</span><span class="rl-badge rl-fam-learner">Learner-centric</span><span class="rl-badge rl-plain">Base · SAC</span><span class="rl-badge rl-plain">Claims · observation shift</span></p>

Local policy and value smoothing, with an ensemble penalty at perturbed states.

## Features

| Feature | Value |
|---|---|
| Group | [Robust Offline Algorithms](index.md) |
| Setting | Offline |
| Family | Learner-centric |
| Base algorithm | SAC |
| Claimed robustness | Observation shift |
| Shifted-env rollout | No |
| Adversarial network | No |
| Learned model | No |
| Training budget | 3M updates on MuJoCo and Door, 1M elsewhere |
| Original paper | Yang et al. *RORL: Robust Offline Reinforcement Learning via Conservative Smoothing*. NeurIPS, 2022. |

## Mechanism

RORL makes an SAC learner conservative through smoothing. The critic and the policy are
regularised to vary little within a small ball around dataset states, and Q-values at
perturbed states are penalised by the disagreement of a ten-critic ensemble.

RORL is a standalone recipe rather than a mechanism added to a shared base algorithm.

## Run the method

```bash
python baselines/train.py \
    -c robustrllib/configs/experiment/rorl_hopper.yaml --seed 0
python baselines/evaluate.py --run runs/rorl_hopper/seed0
```

| File | Path |
|---|---|
| Implementation | `baselines/rorl` |
| Algorithm card | `robustrllib/configs/algorithm/rorl.yaml` |
| Experiment file | `robustrllib/configs/experiment/rorl_hopper.yaml` |

Training is on the nominal task. The configuration files are explained in [Train an algorithm](../run-a-method.md), and the evaluation of the frozen checkpoint in [Evaluation Protocol](../../evaluation/protocol.md).

## Robust performance

Normalized score of the frozen last checkpoint. Q1 to Q4 are the severity quartiles of each perturbation ladder, ordered by displacement from the nominal setting, and *All* covers every shifted condition.

| Method | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| **RORL** | **79.3** | **60.3** | **48.7** | **40.8** | **31.4** | **45.3** |

## By task

| Task | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| Door | 0.6 | 0.6 | 0.6 | 0.6 | 0.6 | 0.6 |
| HalfCheetah | 119.5 | 72.9 | 45.2 | 31.0 | 23.1 | 43.1 |
| Hopper | 110.5 | 62.6 | 57.6 | 51.1 | 36.5 | 52.0 |
| LunarLander | 79.9 | 74.1 | 62.4 | 68.2 | 54.5 | 64.6 |
| PointMaze | 29.9 | 21.6 | 21.2 | 13.9 | 5.7 | 15.6 |
| Walker2d | 135.5 | 129.7 | 105.1 | 79.9 | 68.2 | 95.7 |

## References

- Yang et al. *RORL: Robust Offline Reinforcement Learning via Conservative Smoothing*. NeurIPS, 2022.
