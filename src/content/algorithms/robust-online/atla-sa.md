---
title: ATLA-SA
---

# ATLA-SA

<p class="rl-subtitle">ATLA with state-adversarial regularisation and a recurrent policy</p>

<p class="rl-badges"><span class="rl-badge rl-setting">Online</span><span class="rl-badge rl-fam-learner">Learner-centric</span><span class="rl-badge rl-plain">Base · PPO</span><span class="rl-badge rl-plain">Claims · observation shift</span></p>

ATLA plus a state-adversarial KL regulariser and a 100-step recurrent policy.

## Features

| Feature | Value |
|---|---|
| Group | [Robust Online Algorithms](index.md) |
| Setting | Online |
| Family | Learner-centric |
| Base algorithm | PPO (LSTM policy) |
| Claimed robustness | Observation shift |
| Shifted-env rollout | No |
| Adversarial network | Yes |
| Learned model | No |
| Training budget | About 5M environment steps (2441 iterations of 2048 steps) |
| Original paper | Zhang et al. *Robust Reinforcement Learning on State Observations with Learned Optimal Adversary*. ICLR, 2021. |

## Mechanism

ATLA-SA adds the SA-PPO regulariser to ATLA: a KL penalty between the policy at a state and
at the worst-case neighbour found by stochastic gradient Langevin dynamics. It also uses a
recurrent (LSTM) policy with a 100-step history, so that the agent can infer a persistent
perturbation from context.

**Implementation notes.**

- Gradient-based observation attacks are not applicable to this method: a recurrent policy has no differentiable feed-forward actor to attack.

## Run the method

```bash
python baselines/train.py \
    -c robustrllib/configs/experiment/atla_sa_hopper.yaml --seed 0
python baselines/evaluate.py --run runs/atla_sa_hopper/seed0
```

| File | Path |
|---|---|
| Implementation | `baselines/atla` |
| Algorithm card | `robustrllib/configs/algorithm/atla_sa.yaml` |
| Experiment file | `robustrllib/configs/experiment/atla_sa_hopper.yaml` |

Training is on the nominal task. The configuration files are explained in [Run a Method](../run-a-method.md), and the evaluation of the frozen checkpoint in [Evaluation Protocol](../../evaluation/protocol.md).

## Robust performance

Normalized score of the frozen last checkpoint. Q1 to Q4 are the severity quartiles of each perturbation ladder, ordered by displacement from the nominal setting, and *All* covers every shifted condition.

| Method | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| **ATLA-SA** | **77.6** | **72.1** | **65.0** | **56.3** | **45.5** | **59.6** |
| PPO (base algorithm) | 71.2 | 58.8 | 47.7 | 41.2 | 37.2 | 46.2 |

## By task

| Task | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| CarRacing | 80.7 | 73.6 | 79.3 | 58.5 | 51.9 | 64.8 |
| FetchReach | 96.3 | 93.2 | 85.7 | 77.4 | 78.0 | 83.6 |
| HalfCheetah | 44.0 | 41.7 | 33.6 | 25.6 | 19.3 | 30.0 |
| Hopper | 102.2 | 81.9 | 66.8 | 50.5 | 32.4 | 57.9 |
| PointMaze | 78.7 | 82.0 | 77.7 | 83.2 | 52.1 | 73.7 |
| Walker2d | 63.6 | 60.4 | 47.2 | 42.7 | 39.3 | 47.4 |

## References

- Zhang et al. *Robust Reinforcement Learning on State Observations with Learned Optimal Adversary*. ICLR, 2021.
- Zhang et al. *Robust Deep Reinforcement Learning against Adversarial Perturbations on State Observations*. NeurIPS, 2020.
