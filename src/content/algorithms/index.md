---
title: All Methods
---

# All Methods

RobustRLlib is organised around **algorithm attribution**. Every method records where robustness enters, which shift it claims to address, and which base algorithm realises it.

## Algorithm book

The book below holds one spread per method. Its labels open the four groups: standard, robust online, robust offline and robust safe.

<div class="rl-book" id="algorithm-book" data-book markdown>

<nav class="rl-book-tabs" aria-label="Groups of the algorithm book">
<a class="rl-tab rl-tab-contents" data-group="contents" href="#book-contents">Contents</a>
<a class="rl-tab rl-tab-standard" data-group="standard" href="#book-iql">Standard<span>6</span></a>
<a class="rl-tab rl-tab-robust-online" data-group="robust-online" href="#book-atla">Robust Online<span>5</span></a>
<a class="rl-tab rl-tab-robust-offline" data-group="robust-offline" href="#book-rfqi">Robust Offline<span>8</span></a>
<a class="rl-tab rl-tab-robust-safe" data-group="robust-safe" href="#book-ramu">Robust Safe<span>2</span></a>
</nav>

<div class="rl-book-stage" markdown>

<section class="rl-spread" id="book-contents" data-group="contents" data-name="Contents" data-label="" markdown>

<div class="rl-page rl-left" markdown>
<p class="rl-book-group">RobustRLlib</p>
<p class="rl-book-name">The Algorithm Book</p>
<p class="rl-book-title">22 algorithms in four groups</p>

Every method has one spread: what it is on the left, how it is configured and run on the right. The two variants of RARL share one spread.

- Turn the page with the buttons, the arrow keys or a swipe.
- A label on the edge of the book opens a group.
- *Open the full page* leads to the complete description of a method.

<p class="rl-book-folio">1</p>
</div>

<div class="rl-page rl-right" markdown>
<p class="rl-book-h">Contents</p>

<div class="rl-book-toc" markdown>

<span class="rl-book-tocg">Standard</span>[IQL](#book-iql) · [TD3+BC](#book-td3bc) · [MOPO](#book-mopo) · [SynthER](#book-synther) · [PPO](#book-ppo) · [SAC](#book-sac)

<span class="rl-book-tocg">Robust Online</span>[ATLA](#book-atla) · [ATLA-SA](#book-atla-sa) · [RSC](#book-rsc) · [RARL](#book-rarl) · [DR](#book-dr)

<span class="rl-book-tocg">Robust Offline</span>[RFQI](#book-rfqi) · [RORL](#book-rorl) · [ATLA-IQL](#book-atla-iql) · [RSC-IQL](#book-rsc-iql) · [RAMBO](#book-rambo) · [ROMB](#book-romb) · [FWM](#book-fwm) · [PLR-PVL](#book-plr-pvl)

<span class="rl-book-tocg">Robust Safe</span>[RAMU](#book-ramu) · [SPiDR](#book-spidr)

</div>

<p class="rl-book-folio">2</p>
</div>

</section>

<section class="rl-spread" id="book-iql" data-group="standard" data-name="IQL" data-label="Standard · 1 of 6" markdown>

<div class="rl-page rl-left" markdown>
<p class="rl-book-group">Standard · 1 of 6</p>
<p class="rl-book-name">IQL</p>
<p class="rl-book-title">Implicit Q-Learning</p>
<p class="rl-badges"><span class="rl-badge rl-fam-standard">Standard reference</span></p>
<p class="rl-book-tagline">Expectile-regression value learning that never queries out-of-distribution actions.</p>

IQL avoids querying out-of-distribution actions altogether. A value function is fitted to the critic by expectile regression, the twin critics bootstrap from that value function, and the actor is extracted by advantage-weighted regression.

<p class="rl-book-paper" markdown><b>Original paper</b>Kostrikov et al. *Offline Reinforcement Learning with Implicit Q-Learning*. arXiv:2110.06169, 2021.</p>

<p class="rl-book-folio">3</p>
</div>

<div class="rl-page rl-right" markdown>
<p class="rl-book-h">Features</p>

| Feature | Value |
|---|---|
| Base algorithm | — |
| Training budget | 1M updates, batch 256 |

<p class="rl-book-h">Run the method</p>

```bash
CFG=robustrllib/configs/experiment
python baselines/train.py \
    -c $CFG/iql_hopper.yaml --seed 0
python baselines/evaluate.py \
    --run runs/iql_hopper/seed0
```

<p class="rl-book-more" markdown>[Open the full page](standard/iql.md)</p>

<p class="rl-book-folio">4</p>
</div>

</section>

<section class="rl-spread" id="book-td3bc" data-group="standard" data-name="TD3+BC" data-label="Standard · 2 of 6" markdown>

<div class="rl-page rl-left" markdown>
<p class="rl-book-group">Standard · 2 of 6</p>
<p class="rl-book-name">TD3+BC</p>
<p class="rl-book-title">TD3 with Behaviour Cloning</p>
<p class="rl-badges"><span class="rl-badge rl-fam-standard">Standard reference</span></p>
<p class="rl-book-tagline">TD3 with a behaviour-cloning term balanced against the critic.</p>

TD3+BC adds a behaviour-cloning term to the TD3 actor loss and normalises states. The term is balanced against the critic by dividing by the mean absolute Q-value over the batch.

<p class="rl-book-paper" markdown><b>Original paper</b>Fujimoto and Gu *A Minimalist Approach to Offline Reinforcement Learning*. NeurIPS, 2021.</p>

<p class="rl-book-folio">5</p>
</div>

<div class="rl-page rl-right" markdown>
<p class="rl-book-h">Features</p>

| Feature | Value |
|---|---|
| Base algorithm | — |
| Training budget | 1M updates, batch 256 |

<p class="rl-book-h">Run the method</p>

```bash
CFG=robustrllib/configs/experiment
python baselines/train.py \
    -c $CFG/td3bc_hopper.yaml --seed 0
python baselines/evaluate.py \
    --run runs/td3bc_hopper/seed0
```

<p class="rl-book-more" markdown>[Open the full page](standard/td3bc.md)</p>

<p class="rl-book-folio">6</p>
</div>

</section>

<section class="rl-spread" id="book-mopo" data-group="standard" data-name="MOPO" data-label="Standard · 3 of 6" markdown>

<div class="rl-page rl-left" markdown>
<p class="rl-book-group">Standard · 3 of 6</p>
<p class="rl-book-name">MOPO</p>
<p class="rl-book-title">Model-based Offline Policy Optimization</p>
<p class="rl-badges"><span class="rl-badge rl-fam-standard">Standard reference</span><span class="rl-badge rl-plain">Base · SAC</span></p>
<p class="rl-book-tagline">SAC on real and model data, with rollout rewards penalised by model uncertainty.</p>

MOPO learns an ensemble dynamics model, branches short rollouts from dataset states, and penalises the rollout reward by the model's predicted uncertainty before running SAC on the mixture of real and model data.

<p class="rl-book-paper" markdown><b>Original paper</b>Yu et al. *MOPO: Model-based Offline Policy Optimization*. NeurIPS, 2020.</p>

<p class="rl-book-folio">7</p>
</div>

<div class="rl-page rl-right" markdown>
<p class="rl-book-h">Features</p>

| Feature | Value |
|---|---|
| Base algorithm | SAC |
| Training budget | 1M updates, batch 256 |

<p class="rl-book-h">Run the method</p>

```bash
CFG=robustrllib/configs/experiment
python baselines/train.py \
    -c $CFG/mopo_hopper.yaml --seed 0
python baselines/evaluate.py \
    --run runs/mopo_hopper/seed0
```

<p class="rl-book-more" markdown>[Open the full page](standard/mopo.md)</p>

<p class="rl-book-folio">8</p>
</div>

</section>

<section class="rl-spread" id="book-synther" data-group="standard" data-name="SynthER" data-label="Standard · 4 of 6" markdown>

<div class="rl-page rl-left" markdown>
<p class="rl-book-group">Standard · 4 of 6</p>
<p class="rl-book-name">SynthER</p>
<p class="rl-book-title">Synthetic Experience Replay</p>
<p class="rl-badges"><span class="rl-badge rl-fam-standard">Standard reference</span><span class="rl-badge rl-plain">Base · IQL</span></p>
<p class="rl-book-tagline">A diffusion model enlarges the dataset; the offline learner itself is unchanged.</p>

SynthER fits a diffusion model to logged transitions and trains an unmodified offline learner on a much larger sample from it.

<p class="rl-book-paper" markdown><b>Original paper</b>Lu et al. *Synthetic Experience Replay*. NeurIPS, 2023.</p>

<p class="rl-book-folio">9</p>
</div>

<div class="rl-page rl-right" markdown>
<p class="rl-book-h">Features</p>

| Feature | Value |
|---|---|
| Base algorithm | IQL |
| Training budget | 1M updates, batch 256 |

<p class="rl-book-h">Run the method</p>

```bash
CFG=robustrllib/configs/experiment
python baselines/train.py \
    -c $CFG/synther_hopper.yaml --seed 0
python baselines/evaluate.py \
    --run runs/synther_hopper/seed0
```

<p class="rl-book-more" markdown>[Open the full page](standard/synther.md)</p>

<p class="rl-book-folio">10</p>
</div>

</section>

<section class="rl-spread" id="book-ppo" data-group="standard" data-name="PPO" data-label="Standard · 5 of 6" markdown>

<div class="rl-page rl-left" markdown>
<p class="rl-book-group">Standard · 5 of 6</p>
<p class="rl-book-name">PPO</p>
<p class="rl-book-title">Proximal Policy Optimization</p>
<p class="rl-badges"><span class="rl-badge rl-fam-standard">Standard reference</span></p>
<p class="rl-book-tagline">The on-policy reference: a clipped probability-ratio surrogate with GAE.</p>

PPO is the on-policy reference: a clipped probability-ratio surrogate on trajectories from the current policy, with generalised advantage estimation. The library uses the Stable-Baselines3 implementation.

<p class="rl-book-paper" markdown><b>Original paper</b>Schulman et al. *Proximal Policy Optimization Algorithms*. arXiv:1707.06347, 2017.</p>

<p class="rl-book-folio">11</p>
</div>

<div class="rl-page rl-right" markdown>
<p class="rl-book-h">Features</p>

| Feature | Value |
|---|---|
| Base algorithm | — |
| Training budget | 2M environment steps |

<p class="rl-book-h">Run the method</p>

```bash
CFG=robustrllib/configs/experiment
python baselines/train.py \
    -c $CFG/ppo_hopper.yaml --seed 0
python baselines/evaluate.py \
    --run runs/ppo_hopper/seed0
```

<p class="rl-book-more" markdown>[Open the full page](standard/ppo.md)</p>

<p class="rl-book-folio">12</p>
</div>

</section>

<section class="rl-spread" id="book-sac" data-group="standard" data-name="SAC" data-label="Standard · 6 of 6" markdown>

<div class="rl-page rl-left" markdown>
<p class="rl-book-group">Standard · 6 of 6</p>
<p class="rl-book-name">SAC</p>
<p class="rl-book-title">Soft Actor-Critic</p>
<p class="rl-badges"><span class="rl-badge rl-fam-standard">Standard reference</span></p>
<p class="rl-book-tagline">The off-policy reference: twin critics and an entropy-regularised stochastic actor.</p>

SAC is the off-policy reference: twin critics with a clipped double-Q target and a stochastic actor whose objective adds an entropy bonus with automatically tuned temperature. The library uses the Stable-Baselines3 implementation.

<p class="rl-book-paper" markdown><b>Original paper</b>Haarnoja et al. *Soft Actor-Critic: Off-Policy Maximum Entropy Deep Reinforcement Learning with a Stochastic Actor*. ICML, 2018.</p>

<p class="rl-book-folio">13</p>
</div>

<div class="rl-page rl-right" markdown>
<p class="rl-book-h">Features</p>

| Feature | Value |
|---|---|
| Base algorithm | — |
| Training budget | 1M environment steps |

<p class="rl-book-h">Run the method</p>

```bash
CFG=robustrllib/configs/experiment
python baselines/train.py \
    -c $CFG/sac_hopper.yaml --seed 0
python baselines/evaluate.py \
    --run runs/sac_hopper/seed0
```

<p class="rl-book-more" markdown>[Open the full page](standard/sac.md)</p>

<p class="rl-book-folio">14</p>
</div>

</section>

<section class="rl-spread" id="book-atla" data-group="robust-online" data-name="ATLA" data-label="Robust Online · 1 of 5" markdown>

<div class="rl-page rl-left" markdown>
<p class="rl-book-group">Robust Online · 1 of 5</p>
<p class="rl-book-name">ATLA</p>
<p class="rl-book-title">Alternating Training with Learned Adversaries</p>
<p class="rl-badges"><span class="rl-badge rl-fam-learner">Learner-centric</span><span class="rl-badge rl-plain">Base · PPO</span><span class="rl-badge rl-plain">Claims · observation shift</span></p>
<p class="rl-book-tagline">A policy trained against an observation adversary that is itself an RL agent.</p>

ATLA trains a policy against an *optimal* observation adversary in the state-adversarial MDP.

<p class="rl-book-paper" markdown><b>Original paper</b>Zhang et al. *Robust Reinforcement Learning on State Observations with Learned Optimal Adversary*. ICLR, 2021.</p>

<p class="rl-book-folio">15</p>
</div>

<div class="rl-page rl-right" markdown>
<p class="rl-book-h">Features</p>

| Feature | Value |
|---|---|
| Base algorithm | PPO |
| Shifted-env rollout | No |
| Adversarial network | Yes |
| Learned model | No |
| Training budget | About 5M environment steps (2441 iterations of 2048 steps) |

<p class="rl-book-h">Run the method</p>

```bash
CFG=robustrllib/configs/experiment
python baselines/train.py \
    -c $CFG/atla_hopper.yaml --seed 0
python baselines/evaluate.py \
    --run runs/atla_hopper/seed0
```

<p class="rl-book-more" markdown>[Open the full page](robust-online/atla.md)</p>

<p class="rl-book-folio">16</p>
</div>

</section>

<section class="rl-spread" id="book-atla-sa" data-group="robust-online" data-name="ATLA-SA" data-label="Robust Online · 2 of 5" markdown>

<div class="rl-page rl-left" markdown>
<p class="rl-book-group">Robust Online · 2 of 5</p>
<p class="rl-book-name">ATLA-SA</p>
<p class="rl-book-title">ATLA with state-adversarial regularisation and a recurrent policy</p>
<p class="rl-badges"><span class="rl-badge rl-fam-learner">Learner-centric</span><span class="rl-badge rl-plain">Base · PPO</span><span class="rl-badge rl-plain">Claims · observation shift</span></p>
<p class="rl-book-tagline">ATLA plus a state-adversarial KL regulariser and a 100-step recurrent policy.</p>

ATLA-SA adds the SA-PPO regulariser to ATLA: a KL penalty between the policy at a state and at the worst-case neighbour found by stochastic gradient Langevin dynamics.

<p class="rl-book-paper" markdown><b>Original paper</b>Zhang et al. *Robust Reinforcement Learning on State Observations with Learned Optimal Adversary*. ICLR, 2021.</p>

<p class="rl-book-folio">17</p>
</div>

<div class="rl-page rl-right" markdown>
<p class="rl-book-h">Features</p>

| Feature | Value |
|---|---|
| Base algorithm | PPO (LSTM policy) |
| Shifted-env rollout | No |
| Adversarial network | Yes |
| Learned model | No |
| Training budget | About 5M environment steps (2441 iterations of 2048 steps) |

<p class="rl-book-h">Run the method</p>

```bash
CFG=robustrllib/configs/experiment
python baselines/train.py \
    -c $CFG/atla_sa_hopper.yaml --seed 0
python baselines/evaluate.py \
    --run runs/atla_sa_hopper/seed0
```

<p class="rl-book-more" markdown>[Open the full page](robust-online/atla-sa.md)</p>

<p class="rl-book-folio">18</p>
</div>

</section>

<section class="rl-spread" id="book-rsc" data-group="robust-online" data-name="RSC" data-label="Robust Online · 3 of 5" markdown>

<div class="rl-page rl-left" markdown>
<p class="rl-book-group">Robust Online · 3 of 5</p>
<p class="rl-book-name">RSC</p>
<p class="rl-book-title">Robust RL against Spurious Correlation</p>
<p class="rl-badges"><span class="rl-badge rl-fam-learner">Learner-centric</span><span class="rl-badge rl-plain">Base · SAC</span><span class="rl-badge rl-plain">Claims · semantic shift</span></p>
<p class="rl-book-tagline">Causal counterfactual replay that removes correlations a policy would exploit.</p>

RSC learns a causal graph and a dynamics model over the state variables from replayed experience, then generates counterfactual transitions by intervening on the variables the graph marks as non-causal for the reward.

<p class="rl-book-paper" markdown><b>Original paper</b>Ding et al. *Seeing is not Believing: Robust Reinforcement Learning against Spurious Correlation*. NeurIPS, 2023.</p>

<p class="rl-book-folio">19</p>
</div>

<div class="rl-page rl-right" markdown>
<p class="rl-book-h">Features</p>

| Feature | Value |
|---|---|
| Base algorithm | SAC |
| Shifted-env rollout | No |
| Adversarial network | No |
| Learned model | Yes |
| Training budget | 1M environment steps |

<p class="rl-book-h">Run the method</p>

```bash
CFG=robustrllib/configs/experiment
python baselines/train.py \
    -c $CFG/rsc_hopper.yaml --seed 0
python baselines/evaluate.py \
    --run runs/rsc_hopper/seed0
```

<p class="rl-book-more" markdown>[Open the full page](robust-online/rsc.md)</p>

<p class="rl-book-folio">20</p>
</div>

</section>

<section class="rl-spread" id="book-rarl" data-group="robust-online" data-name="RARL" data-label="Robust Online · 4 of 5" markdown>

<div class="rl-page rl-left" markdown>
<p class="rl-book-group">Robust Online · 4 of 5</p>
<p class="rl-book-name">RARL</p>
<p class="rl-book-title">Robust Adversarial Reinforcement Learning</p>
<p class="rl-badges"><span class="rl-badge rl-fam-environment">Environment-centric</span><span class="rl-badge rl-plain">Base · PPO / TRPO</span><span class="rl-badge rl-plain">Claims · dynamic shift</span></p>
<p class="rl-book-tagline">A two-player zero-sum game against an adversary that applies external forces.</p>

RARL casts robustness as a two-player zero-sum game. An adversary applies bounded external forces to the robot and is trained to minimise the protagonist's return, and the two are updated in alternating blocks.

<p class="rl-book-paper" markdown><b>Original paper</b>Pinto et al. *Robust Adversarial Reinforcement Learning*. ICML, 2017.</p>

<p class="rl-book-folio">21</p>
</div>

<div class="rl-page rl-right" markdown>
<p class="rl-book-h">Features</p>

| Feature | Value |
|---|---|
| Base algorithm | PPO / TRPO |
| Shifted-env rollout | Yes |
| Adversarial network | Yes |
| Learned model | No |
| Training budget | 2M environment steps |

<p class="rl-book-h">Run the method</p>

```bash
CFG=robustrllib/configs/experiment
python baselines/train.py \
    -c $CFG/rarl_ppo_hopper.yaml --seed 0
python baselines/train.py \
    -c $CFG/rarl_trpo_hopper.yaml --seed 0
python baselines/evaluate.py \
    --run runs/rarl_ppo_hopper/seed0
```

<p class="rl-book-more" markdown>[Open the full page](robust-online/rarl.md)</p>

<p class="rl-book-folio">22</p>
</div>

</section>

<section class="rl-spread" id="book-dr" data-group="robust-online" data-name="DR" data-label="Robust Online · 5 of 5" markdown>

<div class="rl-page rl-left" markdown>
<p class="rl-book-group">Robust Online · 5 of 5</p>
<p class="rl-book-name">DR</p>
<p class="rl-book-title">Domain Randomization</p>
<p class="rl-badges"><span class="rl-badge rl-fam-environment">Environment-centric</span><span class="rl-badge rl-plain">Base · SAC / PPO</span><span class="rl-badge rl-plain">Claims · dynamic shift</span></p>
<p class="rl-book-tagline">Simulator parameters resampled every episode from fixed ranges.</p>

Domain randomisation samples simulator parameters from fixed ranges at every episode, so that the policy meets a distribution of dynamics during training.

<p class="rl-book-paper" markdown><b>Original paper</b>Tobin et al. *Domain Randomization for Transferring Deep Neural Networks from Simulation to the Real World*. IROS, 2017.</p>

<p class="rl-book-folio">23</p>
</div>

<div class="rl-page rl-right" markdown>
<p class="rl-book-h">Features</p>

| Feature | Value |
|---|---|
| Base algorithm | SAC / PPO |
| Shifted-env rollout | Yes |
| Adversarial network | No |
| Learned model | No |
| Training budget | 1M environment steps (DR-SAC) |

<p class="rl-book-h">Run the method</p>

```bash
CFG=robustrllib/configs/experiment
python baselines/train.py \
    -c $CFG/dr_sac_hopper.yaml --seed 0
python baselines/evaluate.py \
    --run runs/dr_sac_hopper/seed0
```

<p class="rl-book-more" markdown>[Open the full page](robust-online/dr.md)</p>

<p class="rl-book-folio">24</p>
</div>

</section>

<section class="rl-spread" id="book-rfqi" data-group="robust-offline" data-name="RFQI" data-label="Robust Offline · 1 of 8" markdown>

<div class="rl-page rl-left" markdown>
<p class="rl-book-group">Robust Offline · 1 of 8</p>
<p class="rl-book-name">RFQI</p>
<p class="rl-book-title">Robust Fitted Q-Iteration</p>
<p class="rl-badges"><span class="rl-badge rl-fam-learner">Learner-centric</span><span class="rl-badge rl-plain">Base · FQI</span><span class="rl-badge rl-plain">Claims · dynamic shift</span></p>
<p class="rl-book-tagline">Worst-case Bellman update over a total-variation uncertainty set.</p>

RFQI replaces the fitted-Q target by a worst-case Bellman backup over a total-variation uncertainty set of a fixed radius around the empirical transitions.

<p class="rl-book-paper" markdown><b>Original paper</b>Panaganti et al. *Robust Reinforcement Learning using Offline Data*. NeurIPS, 2022.</p>

<p class="rl-book-folio">25</p>
</div>

<div class="rl-page rl-right" markdown>
<p class="rl-book-h">Features</p>

| Feature | Value |
|---|---|
| Base algorithm | FQI |
| Shifted-env rollout | No |
| Adversarial network | No |
| Learned model | No |
| Training budget | 500k updates, batch 1000 |

<p class="rl-book-h">Run the method</p>

```bash
CFG=robustrllib/configs/experiment
python baselines/train.py \
    -c $CFG/rfqi_hopper.yaml --seed 0
python baselines/evaluate.py \
    --run runs/rfqi_hopper/seed0
```

<p class="rl-book-more" markdown>[Open the full page](robust-offline/rfqi.md)</p>

<p class="rl-book-folio">26</p>
</div>

</section>

<section class="rl-spread" id="book-rorl" data-group="robust-offline" data-name="RORL" data-label="Robust Offline · 2 of 8" markdown>

<div class="rl-page rl-left" markdown>
<p class="rl-book-group">Robust Offline · 2 of 8</p>
<p class="rl-book-name">RORL</p>
<p class="rl-book-title">Robust Offline RL via Conservative Smoothing</p>
<p class="rl-badges"><span class="rl-badge rl-fam-learner">Learner-centric</span><span class="rl-badge rl-plain">Base · SAC</span><span class="rl-badge rl-plain">Claims · observation shift</span></p>
<p class="rl-book-tagline">Local policy and value smoothing, with an ensemble penalty at perturbed states.</p>

RORL makes an SAC learner conservative through smoothing.

<p class="rl-book-paper" markdown><b>Original paper</b>Yang et al. *RORL: Robust Offline Reinforcement Learning via Conservative Smoothing*. NeurIPS, 2022.</p>

<p class="rl-book-folio">27</p>
</div>

<div class="rl-page rl-right" markdown>
<p class="rl-book-h">Features</p>

| Feature | Value |
|---|---|
| Base algorithm | SAC |
| Shifted-env rollout | No |
| Adversarial network | No |
| Learned model | No |
| Training budget | 3M updates on MuJoCo and Door, 1M elsewhere |

<p class="rl-book-h">Run the method</p>

```bash
CFG=robustrllib/configs/experiment
python baselines/train.py \
    -c $CFG/rorl_hopper.yaml --seed 0
python baselines/evaluate.py \
    --run runs/rorl_hopper/seed0
```

<p class="rl-book-more" markdown>[Open the full page](robust-offline/rorl.md)</p>

<p class="rl-book-folio">28</p>
</div>

</section>

<section class="rl-spread" id="book-atla-iql" data-group="robust-offline" data-name="ATLA-IQL" data-label="Robust Offline · 3 of 8" markdown>

<div class="rl-page rl-left" markdown>
<p class="rl-book-group">Robust Offline · 3 of 8</p>
<p class="rl-book-name">ATLA-IQL</p>
<p class="rl-book-title">Offline adaptation of ATLA on an IQL backbone</p>
<p class="rl-badges"><span class="rl-badge rl-fam-learner">Learner-centric</span><span class="rl-badge rl-plain">Base · IQL</span><span class="rl-badge rl-plain">Claims · observation shift</span></p>
<p class="rl-book-tagline">A learned observation adversary, trained through the critic instead of by RL.</p>

The offline adaptation keeps ATLA's principle, a learned observation adversary alternated with the learner.

<p class="rl-book-paper" markdown><b>Original paper</b>Zhang et al. *Robust Reinforcement Learning on State Observations with Learned Optimal Adversary*. ICLR, 2021.</p>

<p class="rl-book-folio">29</p>
</div>

<div class="rl-page rl-right" markdown>
<p class="rl-book-h">Features</p>

| Feature | Value |
|---|---|
| Base algorithm | IQL |
| Shifted-env rollout | No |
| Adversarial network | Yes |
| Learned model | No |
| Training budget | 1M updates, batch 256 |

<p class="rl-book-h">Run the method</p>

```bash
CFG=robustrllib/configs/experiment
python baselines/train.py \
    -c $CFG/atla_iql_hopper.yaml --seed 0
python baselines/evaluate.py \
    --run runs/atla_iql_hopper/seed0
```

<p class="rl-book-more" markdown>[Open the full page](robust-offline/atla-iql.md)</p>

<p class="rl-book-folio">30</p>
</div>

</section>

<section class="rl-spread" id="book-rsc-iql" data-group="robust-offline" data-name="RSC-IQL" data-label="Robust Offline · 4 of 8" markdown>

<div class="rl-page rl-left" markdown>
<p class="rl-book-group">Robust Offline · 4 of 8</p>
<p class="rl-book-name">RSC-IQL</p>
<p class="rl-book-title">Causal counterfactual rewriting on an IQL backbone</p>
<p class="rl-badges"><span class="rl-badge rl-fam-data">Data-centric</span><span class="rl-badge rl-plain">Base · IQL</span><span class="rl-badge rl-plain">Claims · semantic shift</span></p>
<p class="rl-book-tagline">Rewrites logged transitions along the dimensions a causal mask marks as non-causal.</p>

RSC-IQL applies RSC's counterfactual rewriting to logged data. A causal mask over state dimensions is fitted from the dataset, and transitions are rewritten by permuting or perturbing the dimensions the mask marks as non-causal.

<p class="rl-book-paper" markdown><b>Original paper</b>Ding et al. *Seeing is not Believing: Robust Reinforcement Learning against Spurious Correlation*. NeurIPS, 2023.</p>

<p class="rl-book-folio">31</p>
</div>

<div class="rl-page rl-right" markdown>
<p class="rl-book-h">Features</p>

| Feature | Value |
|---|---|
| Base algorithm | IQL |
| Shifted-env rollout | No |
| Adversarial network | No |
| Learned model | Yes |
| Training budget | 1M updates, batch 256 |

<p class="rl-book-h">Run the method</p>

```bash
CFG=robustrllib/configs/experiment
python baselines/train.py \
    -c $CFG/rsc_iql_hopper.yaml --seed 0
python baselines/evaluate.py \
    --run runs/rsc_iql_hopper/seed0
```

<p class="rl-book-more" markdown>[Open the full page](robust-offline/rsc-iql.md)</p>

<p class="rl-book-folio">32</p>
</div>

</section>

<section class="rl-spread" id="book-rambo" data-group="robust-offline" data-name="RAMBO" data-label="Robust Offline · 5 of 8" markdown>

<div class="rl-page rl-left" markdown>
<p class="rl-book-group">Robust Offline · 5 of 8</p>
<p class="rl-book-name">RAMBO</p>
<p class="rl-book-title">Robust Adversarial Model-Based Offline RL</p>
<p class="rl-badges"><span class="rl-badge rl-fam-data">Data-centric</span><span class="rl-badge rl-plain">Base · SAC</span><span class="rl-badge rl-plain">Claims · dynamic shift</span></p>
<p class="rl-book-tagline">Model rollouts from an ensemble that is trained adversarially against the policy.</p>

RAMBO augments the dataset with short rollouts from a learned dynamics ensemble and replaces the uncertainty penalty by adversarial training of the model.

<p class="rl-book-paper" markdown><b>Original paper</b>Rigter et al. *RAMBO-RL: Robust Adversarial Model-Based Offline Reinforcement Learning*. NeurIPS, 2022.</p>

<p class="rl-book-folio">33</p>
</div>

<div class="rl-page rl-right" markdown>
<p class="rl-book-h">Features</p>

| Feature | Value |
|---|---|
| Base algorithm | SAC |
| Shifted-env rollout | No |
| Adversarial network | Yes |
| Learned model | Yes |
| Training budget | 2M updates on MuJoCo and Door, 1M elsewhere |

<p class="rl-book-h">Run the method</p>

```bash
CFG=robustrllib/configs/experiment
python baselines/train.py \
    -c $CFG/rambo_hopper.yaml --seed 0
python baselines/evaluate.py \
    --run runs/rambo_hopper/seed0
```

<p class="rl-book-more" markdown>[Open the full page](robust-offline/rambo.md)</p>

<p class="rl-book-folio">34</p>
</div>

</section>

<section class="rl-spread" id="book-romb" data-group="robust-offline" data-name="ROMB" data-label="Robust Offline · 6 of 8" markdown>

<div class="rl-page rl-left" markdown>
<p class="rl-book-group">Robust Offline · 6 of 8</p>
<p class="rl-book-name">ROMB</p>
<p class="rl-book-title">Policy-driven world-model adaptation</p>
<p class="rl-badges"><span class="rl-badge rl-fam-generative">Data-centric · generative</span><span class="rl-badge rl-plain">Base · IQL</span><span class="rl-badge rl-plain">Claims · dynamic shift</span></p>
<p class="rl-book-tagline">A world model adapted against the policy under a constrained maximin objective.</p>

ROMB adapts a learned world model against the policy under a constrained maximin objective.

<p class="rl-book-paper" markdown><b>Original paper</b>Chen et al. *Policy-Driven World Model Adaptation for Robust Offline Model-based Reinforcement Learning*. arXiv:2505.13709, 2025.</p>

<p class="rl-book-folio">35</p>
</div>

<div class="rl-page rl-right" markdown>
<p class="rl-book-h">Features</p>

| Feature | Value |
|---|---|
| Base algorithm | IQL |
| Shifted-env rollout | No |
| Adversarial network | Yes |
| Learned model | Yes |
| Training budget | 1M updates, batch 256 |

<p class="rl-book-h">Run the method</p>

```bash
CFG=robustrllib/configs/experiment
python baselines/train.py \
    -c $CFG/romb_hopper.yaml --seed 0
python baselines/evaluate.py \
    --run runs/romb_hopper/seed0
```

<p class="rl-book-more" markdown>[Open the full page](robust-offline/romb.md)</p>

<p class="rl-book-folio">36</p>
</div>

</section>

<section class="rl-spread" id="book-fwm" data-group="robust-offline" data-name="FWM" data-label="Robust Offline · 7 of 8" markdown>

<div class="rl-page rl-left" markdown>
<p class="rl-book-group">Robust Offline · 7 of 8</p>
<p class="rl-book-name">FWM</p>
<p class="rl-book-title">Flow-matching World Model</p>
<p class="rl-badges"><span class="rl-badge rl-fam-generative">Data-centric · generative</span><span class="rl-badge rl-plain">Base · IQL</span><span class="rl-badge rl-plain">Claims · dynamic shift</span></p>
<p class="rl-book-tagline">Multi-step critic targets whose future is sampled from a flow-matching world model.</p>

FWM transfers the multi-step future modelling of the Diffusion World Model to a flow-matching world model.

<p class="rl-book-paper" markdown><b>Original paper</b>Ding et al. *Diffusion World Model: Future Modeling Beyond Step-by-Step Rollout for Offline Reinforcement Learning*. arXiv:2402.03570, 2024.</p>

<p class="rl-book-folio">37</p>
</div>

<div class="rl-page rl-right" markdown>
<p class="rl-book-h">Features</p>

| Feature | Value |
|---|---|
| Base algorithm | IQL |
| Shifted-env rollout | No |
| Adversarial network | No |
| Learned model | Yes |
| Training budget | 1M updates, batch 256 |

<p class="rl-book-h">Run the method</p>

```bash
CFG=robustrllib/configs/experiment
python baselines/train.py \
    -c $CFG/fwm_hopper.yaml --seed 0
python baselines/evaluate.py \
    --run runs/fwm_hopper/seed0
```

<p class="rl-book-more" markdown>[Open the full page](robust-offline/fwm.md)</p>

<p class="rl-book-folio">38</p>
</div>

</section>

<section class="rl-spread" id="book-plr-pvl" data-group="robust-offline" data-name="PLR-PVL" data-label="Robust Offline · 8 of 8" markdown>

<div class="rl-page rl-left" markdown>
<p class="rl-book-group">Robust Offline · 8 of 8</p>
<p class="rl-book-name">PLR-PVL</p>
<p class="rl-book-title">Prioritised world-model selection by positive value loss</p>
<p class="rl-badges"><span class="rl-badge rl-fam-generative">Data-centric · generative</span><span class="rl-badge rl-plain">Base · IQL</span><span class="rl-badge rl-plain">Claims · dynamic shift</span></p>
<p class="rl-book-tagline">An ensemble of world models, prioritised per sample by the value loss they induce.</p>

PLR-PVL trains a collection of world models consistent with the offline data, treats each as a level in the sense of unsupervised environment design, and prioritises them during policy learning by the value loss they induce.

<p class="rl-book-paper" markdown><b>Original paper</b>Berdica et al. *Robust Offline Learning via Adversarial World Models*. NeurIPS Workshop on Open-World Agents, 2024.</p>

<p class="rl-book-folio">39</p>
</div>

<div class="rl-page rl-right" markdown>
<p class="rl-book-h">Features</p>

| Feature | Value |
|---|---|
| Base algorithm | IQL |
| Shifted-env rollout | No |
| Adversarial network | No |
| Learned model | Yes |
| Training budget | 1M updates, batch 256 |

<p class="rl-book-h">Run the method</p>

```bash
CFG=robustrllib/configs/experiment
python baselines/train.py \
    -c $CFG/plr_pvl_hopper.yaml --seed 0
python baselines/evaluate.py \
    --run runs/plr_pvl_hopper/seed0
```

<p class="rl-book-more" markdown>[Open the full page](robust-offline/plr-pvl.md)</p>

<p class="rl-book-folio">40</p>
</div>

</section>

<section class="rl-spread" id="book-ramu" data-group="robust-safe" data-name="RAMU" data-label="Robust Safe · 1 of 2" markdown>

<div class="rl-page rl-left" markdown>
<p class="rl-book-group">Robust Safe · 1 of 2</p>
<p class="rl-book-name">RAMU</p>
<p class="rl-book-title">Risk-Averse Model Uncertainty</p>
<p class="rl-badges"><span class="rl-badge rl-fam-safe">Robust safe</span><span class="rl-badge rl-plain">Base · PPO</span><span class="rl-badge rl-plain">Claims · dynamic shift</span></p>
<p class="rl-book-tagline">A risk measure over sampled next-state perturbations, applied to reward and cost targets.</p>

RAMU applies a risk measure over sampled next-state perturbations to both the reward and the cost targets.

<p class="rl-book-paper" markdown><b>Original paper</b>Queeney and Benosman *Risk-Averse Model Uncertainty for Distributionally Robust Safe Reinforcement Learning*. NeurIPS, 2023.</p>

<p class="rl-book-folio">41</p>
</div>

<div class="rl-page rl-right" markdown>
<p class="rl-book-h">Features</p>

| Feature | Value |
|---|---|
| Base algorithm | PPO |
| Shifted-env rollout | No |
| Adversarial network | No |
| Learned model | No |
| Training budget | Isaac Lab recipe |

<p class="rl-book-h">Run the method</p>

```bash
./isaaclab.sh \
    -p isaac/train.py --task g1 \
    --method ramu --seed 0 --headless
./isaaclab.sh \
    -p isaac/evaluate.py --task g1 \
    --checkpoint runs/isaac/g1_ramu/seed0/model_1499.pt \
    --condition all --headless
```

<p class="rl-book-more" markdown>[Open the full page](robust-safe/ramu.md)</p>

<p class="rl-book-folio">42</p>
</div>

</section>

<section class="rl-spread" id="book-spidr" data-group="robust-safe" data-name="SPiDR" data-label="Robust Safe · 2 of 2" markdown>

<div class="rl-page rl-left" markdown>
<p class="rl-book-group">Robust Safe · 2 of 2</p>
<p class="rl-book-name">SPiDR</p>
<p class="rl-book-title">Zero-shot safety under domain randomisation</p>
<p class="rl-badges"><span class="rl-badge rl-fam-safe">Robust safe</span><span class="rl-badge rl-plain">Base · PPO</span><span class="rl-badge rl-plain">Claims · dynamic shift</span></p>
<p class="rl-book-tagline">Constrained learning under domain randomisation with a pessimistic cost penalty.</p>

SPiDR trains a constrained policy under domain randomisation and adds a pessimistic cost penalty proportional to the disagreement of next-state predictions across sampled dynamics.

<p class="rl-book-paper" markdown><b>Original paper</b>As et al. *SPiDR: A Simple Approach for Zero-Shot Safety in Sim-to-Real Transfer*. NeurIPS, 2026.</p>

<p class="rl-book-folio">43</p>
</div>

<div class="rl-page rl-right" markdown>
<p class="rl-book-h">Features</p>

| Feature | Value |
|---|---|
| Base algorithm | PPO |
| Shifted-env rollout | Yes |
| Adversarial network | No |
| Learned model | Yes |
| Training budget | Isaac Lab recipe |

<p class="rl-book-h">Run the method</p>

```bash
./isaaclab.sh \
    -p isaac/train.py --task g1 \
    --method spidr --seed 0 --headless
./isaaclab.sh \
    -p isaac/evaluate.py --task g1 \
    --checkpoint runs/isaac/g1_spidr/seed0/model_899.pt \
    --condition all --headless
```

<p class="rl-book-more" markdown>[Open the full page](robust-safe/spidr.md)</p>

<p class="rl-book-folio">44</p>
</div>

</section>

</div>

<div class="rl-book-controls">
<button type="button" class="rl-prev" aria-label="Previous page">&lsaquo; Previous</button>
<span class="rl-book-status" role="status" aria-live="polite"></span>
<button type="button" class="rl-next" aria-label="Next page">Next &rsaquo;</button>
</div>
<p class="rl-book-hint">Arrow keys turn the page once the book has the focus.</p>

</div>

<script src="../assets/book.js" defer></script>

## Families

<p class="rl-legend"><span class="rl-badge rl-fam-standard">Standard reference</span><span class="rl-badge rl-fam-learner">Learner-centric</span><span class="rl-badge rl-fam-data">Data-centric</span><span class="rl-badge rl-fam-generative">Data-centric · generative</span><span class="rl-badge rl-fam-environment">Environment-centric</span><span class="rl-badge rl-fam-safe">Robust safe</span></p>

## Standard Algorithms

6 methods. See [Standard Algorithms](standard/index.md).

| Method | Family | Setting | Base | Claimed<br>robustness | Shifted-env<br>rollout | Adversarial<br>network | Learned<br>model |
|---|---|---|---|---|:-:|:-:|:-:|
| [**IQL**](standard/iql.md) | <span class="rl-badge rl-fam-standard">Standard reference</span> | Offline | — | — |  |  |  |
| [**TD3+BC**](standard/td3bc.md) | <span class="rl-badge rl-fam-standard">Standard reference</span> | Offline | — | — |  |  |  |
| [**MOPO**](standard/mopo.md) | <span class="rl-badge rl-fam-standard">Standard reference</span> | Offline | SAC | — |  |  |  |
| [**SynthER**](standard/synther.md) | <span class="rl-badge rl-fam-standard">Standard reference</span> | Offline | IQL | — |  |  |  |
| [**PPO**](standard/ppo.md) | <span class="rl-badge rl-fam-standard">Standard reference</span> | Online | — | — |  |  |  |
| [**SAC**](standard/sac.md) | <span class="rl-badge rl-fam-standard">Standard reference</span> | Online | — | — |  |  |  |

## Robust Online Algorithms

5 methods. See [Robust Online Algorithms](robust-online/index.md).

| Method | Family | Base | Claimed<br>robustness | Shifted-env<br>rollout | Adversarial<br>network | Learned<br>model |
|---|---|---|---|:-:|:-:|:-:|
| [**ATLA**](robust-online/atla.md) | <span class="rl-badge rl-fam-learner">Learner-centric</span> | PPO | Observation |  | ✓ |  |
| [**ATLA-SA**](robust-online/atla-sa.md) | <span class="rl-badge rl-fam-learner">Learner-centric</span> | PPO | Observation |  | ✓ |  |
| [**RSC**](robust-online/rsc.md) | <span class="rl-badge rl-fam-learner">Learner-centric</span> | SAC | Semantic |  |  | ✓ |
| [**RARL**](robust-online/rarl.md) | <span class="rl-badge rl-fam-environment">Environment-centric</span> | PPO / TRPO | Dynamic | ✓ | ✓ |  |
| [**DR**](robust-online/dr.md) | <span class="rl-badge rl-fam-environment">Environment-centric</span> | SAC / PPO | Dynamic | ✓ |  |  |

## Robust Offline Algorithms

8 methods. See [Robust Offline Algorithms](robust-offline/index.md).

| Method | Family | Base | Claimed<br>robustness | Shifted-env<br>rollout | Adversarial<br>network | Learned<br>model |
|---|---|---|---|:-:|:-:|:-:|
| [**RFQI**](robust-offline/rfqi.md) | <span class="rl-badge rl-fam-learner">Learner-centric</span> | FQI | Dynamic |  |  |  |
| [**RORL**](robust-offline/rorl.md) | <span class="rl-badge rl-fam-learner">Learner-centric</span> | SAC | Observation |  |  |  |
| [**ATLA-IQL**](robust-offline/atla-iql.md) | <span class="rl-badge rl-fam-learner">Learner-centric</span> | IQL | Observation |  | ✓ |  |
| [**RSC-IQL**](robust-offline/rsc-iql.md) | <span class="rl-badge rl-fam-data">Data-centric</span> | IQL | Semantic |  |  | ✓ |
| [**RAMBO**](robust-offline/rambo.md) | <span class="rl-badge rl-fam-data">Data-centric</span> | SAC | Dynamic |  | ✓ | ✓ |
| [**ROMB**](robust-offline/romb.md) | <span class="rl-badge rl-fam-generative">Generative</span> | IQL | Dynamic |  | ✓ | ✓ |
| [**FWM**](robust-offline/fwm.md) | <span class="rl-badge rl-fam-generative">Generative</span> | IQL | Dynamic |  |  | ✓ |
| [**PLR-PVL**](robust-offline/plr-pvl.md) | <span class="rl-badge rl-fam-generative">Generative</span> | IQL | Dynamic |  |  | ✓ |

## Robust Safe Algorithms

2 methods. See [Robust Safe Algorithms](robust-safe/index.md).

| Method | Family | Base | Claimed<br>robustness | Shifted-env<br>rollout | Adversarial<br>network | Learned<br>model |
|---|---|---|---|:-:|:-:|:-:|
| [**RAMU**](robust-safe/ramu.md) | <span class="rl-badge rl-fam-safe">Robust safe</span> | PPO | Dynamic |  |  |  |
| [**SPiDR**](robust-safe/spidr.md) | <span class="rl-badge rl-fam-safe">Robust safe</span> | PPO | Dynamic | ✓ |  | ✓ |

## How to read the tables

- **Family** says where robustness enters: the learner, the data, a generative model of the data, or the environment that training rollouts come from.
- **Base** is the algorithm a method is built on. A robust method and its base are trained and evaluated under the same protocol.
- **Claimed robustness** is the shift the original paper targets.
- **Shifted-env rollout** marks rollouts collected from a deliberately perturbed environment. Offline methods learn from fixed nominal data, so it is never ticked for them.
- **Adversarial network** marks a learned adversary optimised against the policy.
- **Learned model** marks a trained next-state predictor used by the robustness mechanism.
