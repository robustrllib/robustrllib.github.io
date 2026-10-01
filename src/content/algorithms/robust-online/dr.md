---
title: DR
---

# DR

<p class="rl-subtitle">Domain Randomization</p>

<p class="rl-badges"><span class="rl-badge rl-setting">Online</span><span class="rl-badge rl-fam-environment">Environment-centric</span><span class="rl-badge rl-plain">Base · SAC / PPO</span><span class="rl-badge rl-plain">Claims · dynamic shift</span></p>

Simulator parameters resampled every episode from fixed ranges.

## Features

| Feature | Value |
|---|---|
| Group | [Robust Online Algorithms](index.md) |
| Setting | Online |
| Family | Environment-centric |
| Base algorithm | SAC / PPO |
| Claimed robustness | Dynamic shift |
| Shifted-env rollout | Yes |
| Adversarial network | No |
| Learned model | No |
| Training budget | 1M environment steps (DR-SAC) |
| Original paper | Tobin et al. *Domain Randomization for Transferring Deep Neural Networks from Simulation to the Real World*. IROS, 2017. |

## Mechanism

Domain randomisation samples simulator parameters from fixed ranges at every episode, so
that the policy meets a distribution of dynamics during training.

DR-SAC is the variant used on the standard control tasks. On the locomotion tasks it
randomises gravity, morphology and actuator gear, each drawn uniformly between
0.9 and 1.1 times its nominal value at every reset. That is half the width of the
evaluation grid on the same three axes, so the outer half of the grid lies outside the
training range. DR-PPO is used on the Isaac Lab tasks.

## Run the method

```bash
python baselines/train.py \
    -c robustrllib/configs/experiment/dr_sac_hopper.yaml --seed 0
python baselines/evaluate.py --run runs/dr_sac_hopper/seed0
```

| File | Path |
|---|---|
| Implementation | `baselines/dr_sac` |
| Algorithm card | `robustrllib/configs/algorithm/dr_sac.yaml` |
| Experiment file | `robustrllib/configs/experiment/dr_sac_hopper.yaml` |

Training rollouts come from the method's own perturbed environment. The configuration files are explained in [Run a Method](../run-a-method.md), and the evaluation of the frozen checkpoint in [Evaluation Protocol](../../evaluation/protocol.md).

## Robust performance

Normalized score of the frozen last checkpoint. Q1 to Q4 are the severity quartiles of each perturbation ladder, ordered by displacement from the nominal setting, and *All* covers every shifted condition.

| Method | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| **DR-SAC** | **91.1** | **84.7** | **76.9** | **58.3** | **48.2** | **66.8** |
| SAC (base algorithm) | 78.6 | 70.6 | 64.6 | 49.0 | 43.0 | 56.7 |

## By task

| Task | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| CarRacing | 87.1 | 78.8 | 90.8 | 30.8 | 24.7 | 54.8 |
| FetchReach | 97.3 | 93.9 | 86.2 | 78.2 | 77.3 | 83.9 |
| HalfCheetah | 79.4 | 76.3 | 66.0 | 54.5 | 44.0 | 60.2 |
| Hopper | 103.1 | 83.7 | 64.8 | 52.5 | 33.0 | 58.5 |
| PointMaze | 96.8 | 85.3 | 75.3 | 70.1 | 54.1 | 71.2 |
| Walker2d | 83.0 | 90.2 | 78.3 | 63.9 | 56.2 | 72.1 |

## References

- Tobin et al. *Domain Randomization for Transferring Deep Neural Networks from Simulation to the Real World*. IROS, 2017.
- Peng et al. *Sim-to-Real Transfer of Robotic Control with Dynamics Randomization*. ICRA, 2018.
