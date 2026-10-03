---
title: FWM
---

# FWM

<p class="rl-subtitle">Flow-matching World Model</p>

<p class="rl-badges"><span class="rl-badge rl-setting">Offline</span><span class="rl-badge rl-fam-generative">Data-centric · generative</span><span class="rl-badge rl-plain">Base · IQL</span><span class="rl-badge rl-plain">Claims · dynamic shift</span></p>

Multi-step critic targets whose future is sampled from a flow-matching world model.

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
| Original paper | Ding et al. *Diffusion World Model: Future Modeling Beyond Step-by-Step Rollout for Offline Reinforcement Learning*. arXiv:2402.03570, 2024. |

## Mechanism

FWM transfers the multi-step future modelling of the Diffusion World Model to a flow-matching
world model. Instead of a one-step bootstrap, the critic regresses a multi-step return whose
future is sampled from the generative model, conditioned on the current state, action and
return-to-go. The replacement is confined to how that future is produced.

The model is trained on windows of states and rewards. It learns the velocity that carries
a noise sample to a data window along a straight line, which replaces the denoising
objective of the diffusion model. The return-to-go condition is dropped with probability
0.2 during training, so that one network carries both the conditional and the
unconditional velocity. Sampling integrates the learned velocity from noise to data in
five midpoint steps, with a guidance weight of 2.0 between the conditional and the
unconditional velocity.

## Run the method

```bash
python baselines/train.py \
    -c robustrllib/configs/experiment/fwm_hopper.yaml --seed 0
python baselines/evaluate.py --run runs/fwm_hopper/seed0
```

| File | Path |
|---|---|
| Implementation | `baselines/fwm` |
| Algorithm card | `robustrllib/configs/algorithm/fwm.yaml` |
| Experiment file | `robustrllib/configs/experiment/fwm_hopper.yaml` |

Training is on the nominal task. The configuration files are explained in [Train an algorithm](../run-a-method.md), and the evaluation of the frozen checkpoint in [Evaluation Protocol](../../evaluation/protocol.md).

## Robust performance

Normalized score of the frozen checkpoint. Q1 to Q4 are the severity quartiles of each shift factor's scales, ordered by displacement from the nominal setting, and *All* covers every shifted condition. The last row averages the tasks.

| Task | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| Door | 83.3 | 71.3 | 49.8 | 25.8 | 19.2 | 41.5 |
| HalfCheetah | 123.7 | 80.7 | 46.7 | 27.6 | 20.6 | 43.9 |
| Hopper | 101.1 | 63.7 | 51.4 | 44.8 | 29.5 | 47.3 |
| LunarLander | 100.6 | 92.3 | 84.6 | 75.0 | 71.4 | 81.2 |
| PointMaze | 93.9 | 67.4 | 54.4 | 41.8 | 39.8 | 50.8 |
| Walker2d | 132.7 | 115.2 | 85.7 | 56.7 | 41.8 | 74.8 |
| **Average** | **105.9** | **81.8** | **62.1** | **45.3** | **37.0** | **56.6** |

## References

- Ding et al. *Diffusion World Model: Future Modeling Beyond Step-by-Step Rollout for Offline Reinforcement Learning*. arXiv:2402.03570, 2024.
- Lipman et al. *Flow Matching for Generative Modeling*. arXiv:2210.02747, 2022.
