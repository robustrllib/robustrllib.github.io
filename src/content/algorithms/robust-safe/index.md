---
title: Robust Safe Algorithms
---

# Robust Safe Algorithms

Robust safe methods add a cost constraint and make it hold under shifted dynamics. They are implemented in the online setting on a shared PPO learner and run on the Isaac Lab tasks.

## Features

| Feature | Robust Safe Algorithms |
|---|---|
| Interface | The Isaac Lab training and evaluation recipe |
| Shared learner | One PPO implementation for every method |
| Constraint | A cost budget on joint-limit violations |
| Tasks | Unitree G1 locomotion and Franka drawer manipulation |

## Supported methods

| Method | Family | Base | Claimed<br>robustness | Shifted-env<br>rollout | Adversarial<br>network | Learned<br>model |
|---|---|---|---|:-:|:-:|:-:|
| [**RAMU**](ramu.md) | <span class="rl-badge rl-fam-safe">Robust safe</span> | PPO | Dynamic |  |  |  |
| [**SPiDR**](spidr.md) | <span class="rl-badge rl-fam-safe">Robust safe</span> | PPO | Dynamic | ✓ |  | ✓ |

*Claimed robustness* is the shift the original paper targets.

## Run a method

The methods of this group are trained and evaluated with the Isaac Lab recipe, on one PPO implementation that every method shares.

## Method pages

- [RAMU](ramu.md): A risk measure over sampled next-state perturbations, applied to reward and cost targets.
- [SPiDR](spidr.md): Constrained learning under domain randomisation with a pessimistic cost penalty.
