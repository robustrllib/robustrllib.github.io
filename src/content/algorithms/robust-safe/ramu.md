---
title: RAMU
---

# RAMU

<p class="rl-subtitle">Risk-Averse Model Uncertainty</p>

<p class="rl-badges"><span class="rl-badge rl-setting">Online</span><span class="rl-badge rl-fam-safe">Robust safe</span><span class="rl-badge rl-plain">Base · PPO</span><span class="rl-badge rl-plain">Claims · dynamic shift</span></p>

A risk measure over sampled next-state perturbations, applied to reward and cost targets.

## Features

| Feature | Value |
|---|---|
| Group | [Robust Safe Algorithms](index.md) |
| Setting | Online, with a cost constraint |
| Family | Robust safe |
| Base algorithm | PPO |
| Claimed robustness | Dynamic shift |
| Shifted-env rollout | No |
| Adversarial network | No |
| Learned model | No |
| Training budget | Isaac Lab recipe |
| Original paper | Queeney and Benosman *Risk-Averse Model Uncertainty for Distributionally Robust Safe Reinforcement Learning*. NeurIPS, 2023. |

## Mechanism

RAMU applies a risk measure over sampled next-state perturbations to both the reward and the
cost targets. The original method is defined for TD learners; the library's row is a PPO
adaptation that applies the same transform to PPO's value targets.

## Run the method

The method is trained and evaluated with the Isaac Lab recipe, on the PPO implementation that every method of this group shares.

## References

- Queeney and Benosman *Risk-Averse Model Uncertainty for Distributionally Robust Safe Reinforcement Learning*. NeurIPS, 2023.
