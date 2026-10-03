---
title: RSC
---

# RSC

<p class="rl-subtitle">Robust RL against Spurious Correlation</p>

<p class="rl-badges"><span class="rl-badge rl-setting">Online</span><span class="rl-badge rl-fam-learner">Learner-centric</span><span class="rl-badge rl-plain">Base · SAC</span><span class="rl-badge rl-plain">Claims · semantic shift</span></p>

Causal counterfactual replay that removes correlations a policy would exploit.

## Features

| Feature | Value |
|---|---|
| Group | [Robust Online Algorithms](index.md) |
| Setting | Online |
| Family | Learner-centric |
| Base algorithm | SAC |
| Claimed robustness | Semantic shift |
| Shifted-env rollout | No |
| Adversarial network | No |
| Learned model | Yes |
| Training budget | 1M environment steps |
| Original paper | Ding et al. *Seeing is not Believing: Robust Reinforcement Learning against Spurious Correlation*. NeurIPS, 2023. |

## Mechanism

RSC learns a causal graph and a dynamics model over the state variables from replayed
experience, then generates counterfactual transitions by intervening on the variables the
graph marks as non-causal for the reward. Mixing these into replay removes the spurious
correlations a policy would otherwise exploit.

## Run the method

```bash
python baselines/train.py \
    -c robustrllib/configs/experiment/rsc_hopper.yaml --seed 0
python baselines/evaluate.py --run runs/rsc_hopper/seed0
```

| File | Path |
|---|---|
| Implementation | `baselines/rsc` |
| Algorithm card | `robustrllib/configs/algorithm/rsc.yaml` |
| Experiment file | `robustrllib/configs/experiment/rsc_hopper.yaml` |

Training is on the nominal task. The configuration files are explained in [Train an algorithm](../run-a-method.md), and the evaluation of the frozen checkpoint in [Evaluation Protocol](../../evaluation/protocol.md).

## Robust performance

Normalized score of the frozen checkpoint. Q1 to Q4 are the severity quartiles of each shift factor's scales, ordered by displacement from the nominal setting, and *All* covers every shifted condition. The last row averages the tasks.

| Task | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| CarRacing | 85.5 | 67.9 | 86.9 | 22.2 | 23.7 | 48.7 |
| FetchReach | 93.3 | 89.7 | 80.0 | 73.6 | 78.3 | 80.4 |
| HalfCheetah | 64.5 | 60.2 | 49.7 | 40.3 | 30.4 | 45.1 |
| Hopper | 80.5 | 66.6 | 58.3 | 47.0 | 29.3 | 50.3 |
| PointMaze | 56.0 | 48.5 | 35.2 | 30.2 | 24.7 | 34.6 |
| Walker2d | 87.3 | 73.0 | 60.9 | 51.1 | 42.9 | 57.0 |
| **Average** | **77.9** | **67.7** | **61.8** | **44.1** | **38.2** | **52.7** |

## References

- Ding et al. *Seeing is not Believing: Robust Reinforcement Learning against Spurious Correlation*. NeurIPS, 2023.
