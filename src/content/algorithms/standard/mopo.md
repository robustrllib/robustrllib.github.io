---
title: MOPO
---

# MOPO

<p class="rl-subtitle">Model-based Offline Policy Optimization</p>

<p class="rl-badges"><span class="rl-badge rl-setting">Offline</span><span class="rl-badge rl-fam-standard">Standard reference</span><span class="rl-badge rl-plain">Base · SAC</span></p>

SAC on real and model data, with rollout rewards penalised by model uncertainty.

## Features

| Feature | Value |
|---|---|
| Group | [Standard Algorithms](index.md) |
| Setting | Offline |
| Family | Standard reference |
| Base algorithm | SAC |
| Claimed robustness | — |
| Training budget | 1M updates, batch 256 |
| Original paper | Yu et al. *MOPO: Model-based Offline Policy Optimization*. NeurIPS, 2020. |

## Mechanism

MOPO learns an ensemble dynamics model, branches short rollouts from dataset states, and
penalises the rollout reward by the model's predicted uncertainty before running SAC on the
mixture of real and model data.

## Run the method

```bash
python baselines/train.py \
    -c robustrllib/configs/experiment/mopo_hopper.yaml --seed 0
python baselines/evaluate.py --run runs/mopo_hopper/seed0
```

| File | Path |
|---|---|
| Implementation | `baselines/mopo` |
| Algorithm card | `robustrllib/configs/algorithm/mopo.yaml` |
| Experiment file | `robustrllib/configs/experiment/mopo_hopper.yaml` |

Training is on the nominal task. The configuration files are explained in [Train an algorithm](../run-a-method.md), and the evaluation of the frozen checkpoint in [Evaluation Protocol](../../evaluation/protocol.md).

## Robust performance

Normalized score of the frozen last checkpoint. Q1 to Q4 are the severity quartiles of each perturbation ladder, ordered by displacement from the nominal setting, and *All* covers every shifted condition. The last row averages the tasks.

| Task | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| Door | 0.7 | 0.7 | 0.7 | 0.7 | 0.7 | 0.7 |
| HalfCheetah | 69.0 | 47.7 | 13.8 | 6.1 | 6.1 | 18.4 |
| Hopper | 33.9 | 30.5 | 29.2 | 26.0 | 19.6 | 26.3 |
| LunarLander | 34.3 | 32.8 | 30.1 | 34.9 | 25.9 | 30.4 |
| PointMaze | 0.0 | 0.0 | 0.1 | 0.4 | 0.0 | 0.1 |
| Walker2d | 9.5 | 9.5 | 8.8 | 7.6 | 5.1 | 7.8 |
| **Average** | **24.6** | **20.2** | **13.8** | **12.6** | **9.6** | **14.0** |

## References

- Yu et al. *MOPO: Model-based Offline Policy Optimization*. NeurIPS, 2020.
