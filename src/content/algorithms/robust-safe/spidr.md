---
title: SPiDR
---

# SPiDR

<p class="rl-subtitle">Zero-shot safety under domain randomisation</p>

<p class="rl-badges"><span class="rl-badge rl-setting">Online</span><span class="rl-badge rl-fam-safe">Robust safe</span><span class="rl-badge rl-plain">Base · PPO</span><span class="rl-badge rl-plain">Claims · dynamic shift</span></p>

Constrained learning under domain randomisation with a pessimistic cost penalty.

## Features

| Feature | Value |
|---|---|
| Group | [Robust Safe Algorithms](index.md) |
| Setting | Online, with a cost constraint |
| Family | Robust safe |
| Base algorithm | PPO |
| Claimed robustness | Dynamic shift |
| Shifted-env rollout | Yes |
| Adversarial network | No |
| Learned model | Yes |
| Training budget | Isaac Lab recipe |
| Original paper | As et al. *SPiDR: A Simple Approach for Zero-Shot Safety in Sim-to-Real Transfer*. NeurIPS, 2026. |

## Mechanism

SPiDR trains a constrained policy under domain randomisation and adds a pessimistic cost
penalty proportional to the disagreement of next-state predictions across sampled dynamics.
It runs with the original solver and a joint-limit cost budget.

## Run the method

```bash
./isaaclab.sh -p isaac/train.py --task g1 --method spidr --seed 0 --headless
./isaaclab.sh \
    -p isaac/evaluate.py --task g1 --checkpoint runs/isaac/g1_spidr/seed0/model_899.pt --condition all --headless
```

| File | Path |
|---|---|
| Implementation | `isaac/methods/spidr.py` |

Training rollouts come from the method's own perturbed environment. The configuration files are explained in [Run a Method](../run-a-method.md), and the evaluation of the frozen checkpoint in [Evaluation Protocol](../../evaluation/protocol.md).

## References

- As et al. *SPiDR: A Simple Approach for Zero-Shot Safety in Sim-to-Real Transfer*. NeurIPS, 2026.
