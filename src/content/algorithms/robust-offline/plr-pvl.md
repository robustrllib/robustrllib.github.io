---
title: PLR-PVL
---

# PLR-PVL

<p class="rl-subtitle">Prioritised world-model selection by positive value loss</p>

<p class="rl-badges"><span class="rl-badge rl-setting">Offline</span><span class="rl-badge rl-fam-generative">Data-centric · generative</span><span class="rl-badge rl-plain">Base · IQL</span><span class="rl-badge rl-plain">Claims · dynamic shift</span></p>

An ensemble of world models, prioritised per sample by the value loss they induce.

## Features

| Feature | Value |
|---|---|
| Group | [Robust Offline Algorithms](index.md) |
| Setting | Offline |
| Family | Data-centric · generative |
| Base algorithm | IQL |
| Claimed robustness | Dynamic shift |
| Shifted-env rollout | No |
| Adversarial network | No |
| Learned model | Yes |
| Training budget | 1M updates, batch 256 |
| Original paper | Berdica et al. *Robust Offline Learning via Adversarial World Models*. NeurIPS Workshop on Open-World Agents, 2024. |

## Mechanism

PLR-PVL trains a collection of world models consistent with the offline data, treats each as
a level in the sense of unsupervised environment design, and prioritises them during policy
learning by the value loss they induce.

The library replaces the original world model with the flow-matching model of
[FWM](fwm.md). The ensemble consists of flow models that differ only in training seed,
each proposing one multi-step future for the same conditioning. The critic target is
taken per sample from the model whose rollout carries the largest positive value loss,
measured by the generalised-advantage residual of the current critic along that rollout.

**Implementation notes.**

- The selection rule is a learning-potential criterion, not a worst-case-return criterion: it picks the model the critic currently explains worst.
- The flow models are frozen during policy learning. No network is trained adversarially.

## Run the method

```bash
python baselines/train.py \
    -c robustrllib/configs/experiment/plr_pvl_hopper.yaml --seed 0
python baselines/evaluate.py --run runs/plr_pvl_hopper/seed0
```

| File | Path |
|---|---|
| Implementation | `baselines/plr_pvl` |
| Algorithm card | `robustrllib/configs/algorithm/plr_pvl.yaml` |
| Experiment file | `robustrllib/configs/experiment/plr_pvl_hopper.yaml` |

Training is on the nominal task. The configuration files are explained in [Train an algorithm](../run-a-method.md), and the evaluation of the frozen checkpoint in [Evaluation Protocol](../../evaluation/protocol.md).

## Robust performance

Normalized score of the frozen last checkpoint. Q1 to Q4 are the severity quartiles of each perturbation ladder, ordered by displacement from the nominal setting, and *All* covers every shifted condition.

| Method | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| **PLR-PVL** | **102.7** | **76.9** | **60.2** | **45.4** | **37.3** | **55.0** |
| IQL (base algorithm) | 102.5 | 77.5 | 57.0 | 42.1 | 35.4 | 53.1 |

## By task

| Task | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| Door | 62.3 | 56.0 | 50.4 | 29.9 | 20.6 | 39.2 |
| HalfCheetah | 117.9 | 76.5 | 41.0 | 23.5 | 18.9 | 40.0 |
| Hopper | 106.7 | 62.3 | 53.1 | 47.0 | 32.8 | 48.8 |
| LunarLander | 99.7 | 93.3 | 85.8 | 75.0 | 70.4 | 81.4 |
| PointMaze | 95.4 | 67.0 | 51.9 | 44.1 | 38.8 | 50.5 |
| Walker2d | 134.1 | 106.6 | 79.1 | 53.2 | 42.5 | 70.3 |

## References

- Berdica et al. *Robust Offline Learning via Adversarial World Models*. NeurIPS Workshop on Open-World Agents, 2024.
