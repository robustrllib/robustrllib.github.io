---
title: SynthER
---

# SynthER

<p class="rl-subtitle">Synthetic Experience Replay</p>

<p class="rl-badges"><span class="rl-badge rl-setting">Offline</span><span class="rl-badge rl-fam-standard">Standard reference</span><span class="rl-badge rl-plain">Base · IQL</span></p>

A diffusion model enlarges the dataset; the offline learner itself is unchanged.

## Features

| Feature | Value |
|---|---|
| Group | [Standard Algorithms](index.md) |
| Setting | Offline |
| Family | Standard reference |
| Base algorithm | IQL |
| Claimed robustness | — |
| Training budget | 1M updates, batch 256 |
| Original paper | Lu et al. *Synthetic Experience Replay*. NeurIPS, 2023. |

## Mechanism

SynthER fits a diffusion model to logged transitions and trains an unmodified offline learner
on a much larger sample from it.

The library counts it as data augmentation rather than a generative mechanism: it samples
individual transitions to enlarge the dataset, where FWM and PLR-PVL sample multi-step
futures conditioned on the current state and turn them into critic targets.

## Run the method

```bash
python baselines/train.py \
    -c robustrllib/configs/experiment/synther_hopper.yaml --seed 0
python baselines/evaluate.py --run runs/synther_hopper/seed0
```

| File | Path |
|---|---|
| Implementation | `baselines/synther` |
| Algorithm card | `robustrllib/configs/algorithm/synther.yaml` |
| Experiment file | `robustrllib/configs/experiment/synther_hopper.yaml` |

Training is on the nominal task. The configuration files are explained in [Train an algorithm](../run-a-method.md), and the evaluation of the frozen checkpoint in [Evaluation Protocol](../../evaluation/protocol.md).

## Robust performance

Normalized score of the frozen checkpoint. Q1 to Q4 are the severity quartiles of each shift factor's scales, ordered by displacement from the nominal setting, and *All* covers every shifted condition. The last row averages the tasks.

| Task | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| Door | 90.5 | 83.4 | 69.7 | 53.4 | 47.2 | 63.4 |
| HalfCheetah | 114.0 | 59.0 | 29.4 | 17.6 | 15.8 | 30.4 |
| Hopper | 110.7 | 58.9 | 48.7 | 40.9 | 31.0 | 44.9 |
| LunarLander | 100.7 | 93.1 | 83.3 | 71.5 | 70.7 | 80.4 |
| PointMaze | 86.6 | 56.9 | 44.6 | 35.9 | 33.6 | 42.8 |
| Walker2d | 121.7 | 94.2 | 61.2 | 41.7 | 32.6 | 57.4 |
| **Average** | **104.0** | **74.2** | **56.2** | **43.5** | **38.5** | **53.2** |

## References

- Lu et al. *Synthetic Experience Replay*. NeurIPS, 2023.
