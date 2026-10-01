---
title: RSC-IQL
---

# RSC-IQL

<p class="rl-subtitle">Causal counterfactual rewriting on an IQL backbone</p>

<p class="rl-badges"><span class="rl-badge rl-setting">Offline</span><span class="rl-badge rl-fam-data">Data-centric</span><span class="rl-badge rl-plain">Base · IQL</span><span class="rl-badge rl-plain">Claims · semantic shift</span></p>

Rewrites logged transitions along the dimensions a causal mask marks as non-causal.

## Features

| Feature | Value |
|---|---|
| Group | [Robust Offline Algorithms](index.md) |
| Setting | Offline |
| Family | Data-centric |
| Base algorithm | IQL |
| Claimed robustness | Semantic shift |
| Shifted-env rollout | No |
| Adversarial network | No |
| Learned model | Yes |
| Training budget | 1M updates, batch 256 |
| Original paper | Ding et al. *Seeing is not Believing: Robust Reinforcement Learning against Spurious Correlation*. NeurIPS, 2023. |

## Mechanism

RSC-IQL applies RSC's counterfactual rewriting to logged data. A causal mask over state
dimensions is fitted from the dataset, and transitions are rewritten by permuting or
perturbing the dimensions the mask marks as non-causal.

## Run the method

```bash
python baselines/train.py \
    -c robustrllib/configs/experiment/rsc_iql_hopper.yaml --seed 0
python baselines/evaluate.py --run runs/rsc_iql_hopper/seed0
```

| File | Path |
|---|---|
| Implementation | `baselines/rsc_iql` |
| Algorithm card | `robustrllib/configs/algorithm/rsc_iql.yaml` |
| Experiment file | `robustrllib/configs/experiment/rsc_iql_hopper.yaml` |

Training is on the nominal task. The configuration files are explained in [Train an algorithm](../run-a-method.md), and the evaluation of the frozen checkpoint in [Evaluation Protocol](../../evaluation/protocol.md).

## Robust performance

Normalized score of the frozen last checkpoint. Q1 to Q4 are the severity quartiles of each perturbation ladder, ordered by displacement from the nominal setting, and *All* covers every shifted condition. The last row averages the tasks.

| Task | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| Door | 83.3 | 76.6 | 42.0 | 30.2 | 15.6 | 41.1 |
| HalfCheetah | 99.9 | 72.6 | 39.7 | 26.2 | 17.9 | 39.1 |
| Hopper | 100.8 | 66.0 | 43.8 | 31.4 | 22.0 | 40.8 |
| LunarLander | 99.9 | 92.5 | 86.0 | 74.0 | 65.9 | 79.5 |
| PointMaze | 100.3 | 67.6 | 54.4 | 42.7 | 38.8 | 50.9 |
| Walker2d | 118.2 | 106.2 | 71.5 | 48.7 | 39.4 | 66.5 |
| **Average** | **100.4** | **80.3** | **56.2** | **42.2** | **33.3** | **53.0** |

## References

- Ding et al. *Seeing is not Believing: Robust Reinforcement Learning against Spurious Correlation*. NeurIPS, 2023.
