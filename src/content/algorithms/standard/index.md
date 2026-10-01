---
title: Standard Algorithms
---

# Standard Algorithms

Standard algorithms carry no robustness mechanism. They are the base learners that the robust methods are built on, and the reference that every robust method is measured against. The library holds four offline and two online standard algorithms.

## Features

| Feature | Standard Algorithms |
|---|---|
| Role | Base learner of the robust methods, and reference for comparison |
| Interface | One experiment file per run, launched with a training script |
| Method selection | The `algorithm` card named by the experiment file |
| Training | On the nominal task, with the native recipe of each algorithm |
| Evaluation | The frozen last checkpoint, on the grid named by the `eval` card |

## Supported methods

| Method | Family | Setting | Base | Claimed<br>robustness | Shifted-env<br>rollout | Adversarial<br>network | Learned<br>model |
|---|---|---|---|---|:-:|:-:|:-:|
| [**IQL**](iql.md) | <span class="rl-badge rl-fam-standard">Standard reference</span> | Offline | — | — |  |  |  |
| [**TD3+BC**](td3bc.md) | <span class="rl-badge rl-fam-standard">Standard reference</span> | Offline | — | — |  |  |  |
| [**MOPO**](mopo.md) | <span class="rl-badge rl-fam-standard">Standard reference</span> | Offline | SAC | — |  |  |  |
| [**SynthER**](synther.md) | <span class="rl-badge rl-fam-standard">Standard reference</span> | Offline | IQL | — |  |  |  |
| [**PPO**](ppo.md) | <span class="rl-badge rl-fam-standard">Standard reference</span> | Online | — | — |  |  |  |
| [**SAC**](sac.md) | <span class="rl-badge rl-fam-standard">Standard reference</span> | Online | — | — |  |  |  |

## Run a method

Every method is launched from an experiment file. IQL on Hopper:

```bash
python baselines/iql/train_iql.py \
    -c robustrllib/configs/experiment/iql_hopper.yaml --seed 0
```

Every method page gives the command for that method. [Run a Method](../run-a-method.md) explains the experiment file, the overrides and the run directory.

## Configuration

| Method | Implementation | Experiment file | Training budget |
|---|---|---|---|
| [IQL](iql.md) | `baselines/iql` | `iql_hopper.yaml` | 1M updates, batch 256 |
| [TD3+BC](td3bc.md) | `baselines/td3bc` | `td3bc_hopper.yaml` | 1M updates, batch 256 |
| [MOPO](mopo.md) | `baselines/mopo` | `mopo_hopper.yaml` | 1M updates, batch 256 |
| [SynthER](synther.md) | `baselines/synther` | `iql_hopper_synther.yaml` | 1M updates, batch 256 |
| [PPO](ppo.md) | `robustrllib.algos` | `ppo_hopper.yaml` | 2M environment steps |
| [SAC](sac.md) | `robustrllib.algos` | `sac_hopper.yaml` | 1M environment steps |

Experiment files are in `robustrllib/configs/experiment/`. Each names the algorithm card, the task card and the evaluation grid of the run. **Every method keeps its native training recipe and budget**; what is shared is the evaluation.

## Robust performance

Normalized score of the frozen last checkpoint. Q1 to Q4 are the severity quartiles of each perturbation ladder, ordered by displacement from the nominal setting, and *All* covers every shifted condition.

| Method | Nominal | Q1 | Q2 | Q3 | Q4 | All |
|---|--:|--:|--:|--:|--:|--:|
| [IQL](iql.md) | 102.5 | 77.5 | 57.0 | 42.1 | 35.4 | 53.1 |
| [TD3+BC](td3bc.md) | 89.4 | 70.5 | 57.1 | 44.5 | 32.9 | 51.3 |
| [MOPO](mopo.md) | 24.6 | 20.2 | 13.8 | 12.6 | 9.6 | 14.0 |
| [SynthER](synther.md) | 104.0 | 74.2 | 56.2 | 43.5 | 38.5 | 53.2 |
| [PPO](ppo.md) | 71.2 | 58.8 | 47.7 | 41.2 | 37.2 | 46.2 |
| [SAC](sac.md) | 78.6 | 70.6 | 64.6 | 49.0 | 43.0 | 56.7 |

Scores are not clipped: 0 and 100 are reference points, not bounds. The protocol is described in [Evaluation Protocol](../../evaluation/protocol.md).

## Method pages

- [IQL](iql.md): Expectile-regression value learning that never queries out-of-distribution actions.
- [TD3+BC](td3bc.md): TD3 with a behaviour-cloning term balanced against the critic.
- [MOPO](mopo.md): SAC on real and model data, with rollout rewards penalised by model uncertainty.
- [SynthER](synther.md): A diffusion model enlarges the dataset; the offline learner itself is unchanged.
- [PPO](ppo.md): The on-policy reference: a clipped probability-ratio surrogate with GAE.
- [SAC](sac.md): The off-policy reference: twin critics and an entropy-regularised stochastic actor.
