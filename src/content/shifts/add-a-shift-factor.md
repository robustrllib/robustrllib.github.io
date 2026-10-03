# Add a new shift factor

A shift factor is one quantity of a task that an evaluation grid perturbs at several scales:
gravity, limb length and actuator gear on the MuJoCo locomotion tasks, friction, gear and
morphology on CarRacing, engine power, gravity and wind on LunarLander. The benchmark's grids
use three factors per task, but a factor is only a parameter name the simulator adapter
understands plus the scales to evaluate it at, so any quantity the simulator exposes can become
one. This page adds contact friction to Hopper and then a field the adapter does not list yet.

## Summary

| Aspect | Shift factor |
|---|---|
| What it is | One parameter name, evaluated at several scales of its nominal value |
| Declared in | The `grid` of an eval card, one condition per scale: `axis` names the factor, `severity` records the scale and `quartile` groups the scales |
| Code needed | None when the adapter already knows the parameter name; one row in the adapter's table for another field of the same simulator; an adapter for another simulator |
| Evaluation | `baselines/evaluate.py --run <run> --eval <card>`; the result file carries the factor of every condition |
| Bundled names | 21 parameter names on MuJoCo, 5 on Box2D |

## Three cases

| Case | Example | What to write |
|---|---|---|
| The adapter lists the parameter | Contact friction on Hopper: `geom_friction` | An eval card |
| The simulator has the field, the adapter does not list it | Joint armature on Hopper: `dof_armature` | One row in the adapter's table, then the eval card |
| Another simulator | A new physics engine | An adapter; see [Add a physics simulation](add-a-backend.md) |

## A parameter the adapter lists

The adapter of a built environment reports the names it understands.

```python
from robustrllib import make_robust
from robustrllib.adapters import get_adapter

env = make_robust("Hopper-v5", seed=0)
env.reset(seed=0)
names = get_adapter(env).list_params()
print(len(names), "parameter names")
print(", ".join(names))
```

```text
21 parameter names
gravity, wind, body_mass, dof_damping, dof_frictionloss, geom_friction, actuator_gear, geom_size, geom_size_xyz, body_pos, body_inertia, body_pos_xyz, geom_rgba, mat_rgba, light_diffuse, light_ambient, light_pos, cam_pos, cam_quat, cam_fovy, freejoint_pos
```

The MuJoCo adapter addresses global vectors (`gravity`, `wind`), per-entity scalars
(`body_mass`, `dof_damping`, `dof_frictionloss`) and per-entity vectors (`geom_friction`,
`actuator_gear`, `geom_size`, `body_pos`), each by position, by name or with `index: all`.
A Hopper factor on contact friction is therefore the name `geom_friction` on every geom.

### The scales

A factor is evaluated at a set of scales of its nominal value, one condition per scale, on the
Parametric mode name `scale`. The benchmark's grids use eight scales symmetric around 1,
grouped into four quartiles by displacement: `0.9 / 1.1` in Q1, `0.8 / 1.2` in Q2,
`0.7 / 1.3` in Q3, `0.6 / 1.4` in Q4. The `axis` key names the factor and `severity` records
the scale; the result file and the website group by them.

```yaml title="hopper_friction.yaml"
episodes: 20
seed: 10000
grid:
- {name: nominal, shifts: []}
- {name: friction_0.9, axis: friction, quartile: 1, severity: 0.9, shifts: [{target: dynamics, mode: scale, params: {param: geom_friction, index: all, factor: 0.9}}]}
- {name: friction_1.1, axis: friction, quartile: 1, severity: 1.1, shifts: [{target: dynamics, mode: scale, params: {param: geom_friction, index: all, factor: 1.1}}]}
- {name: friction_0.8, axis: friction, quartile: 2, severity: 0.8, shifts: [{target: dynamics, mode: scale, params: {param: geom_friction, index: all, factor: 0.8}}]}
- {name: friction_1.2, axis: friction, quartile: 2, severity: 1.2, shifts: [{target: dynamics, mode: scale, params: {param: geom_friction, index: all, factor: 1.2}}]}
- {name: friction_0.7, axis: friction, quartile: 3, severity: 0.7, shifts: [{target: dynamics, mode: scale, params: {param: geom_friction, index: all, factor: 0.7}}]}
- {name: friction_1.3, axis: friction, quartile: 3, severity: 1.3, shifts: [{target: dynamics, mode: scale, params: {param: geom_friction, index: all, factor: 1.3}}]}
- {name: friction_0.6, axis: friction, quartile: 4, severity: 0.6, shifts: [{target: dynamics, mode: scale, params: {param: geom_friction, index: all, factor: 0.6}}]}
- {name: friction_1.4, axis: friction, quartile: 4, severity: 1.4, shifts: [{target: dynamics, mode: scale, params: {param: geom_friction, index: all, factor: 1.4}}]}
```

Another factor differs only in `param`, `index` and the names. A factor that an environment
reads at construction, such as the friction scale of CarRacing, is written with `env_kwargs`
and an empty `shifts` list instead, as in `part1_carracing.yaml`.

### Check that the factor reaches the model

A parameter can be accepted by name and still not change what the simulator steps. The check
reads the quantity from the simulator's own data structure, once through the adapter and once
through the wrapper of a Dynamic shift across several resets.

```python
adapter = get_adapter(env)
friction = env.unwrapped.model.geom_friction
print(friction[:, 0])
adapter.apply("geom_friction", factor=0.6, index="all")
print(friction[:, 0])
adapter.reset_all()
print(friction[:, 0])
```

```text
[1.  0.9 0.9 0.9 2. ]
[0.6  0.54 0.54 0.54 1.2 ]
[1.  0.9 0.9 0.9 2. ]
```

```python
from robustrllib import ShiftSpec

env = make_robust("Hopper-v5", shifts=[
    ShiftSpec("dynamics", "scale", {"param": "geom_friction", "index": "all", "factor": 0.6}),
], seed=0)
values = []
for seed in range(3):
    env.reset(seed=seed)
    values.append(env.unwrapped.model.geom_friction[:, 0].round(3).tolist())
print(values)
```

```text
[[0.6, 0.54, 0.54, 0.54, 1.2], [0.6, 0.54, 0.54, 0.54, 1.2], [0.6, 0.54, 0.54, 0.54, 1.2]]
```

### Evaluate on the new factor

The evaluator takes the card like any other grid and writes `eval/hopper_friction.json` into
the run directory; every condition carries its `axis`, `quartile` and `severity`.

```bash
python baselines/evaluate.py --run runs/iql_hopper/seed0 --eval hopper_friction.yaml
```

The run below is a short smoke run of IQL, so the scores are low; the format is what matters.

```text
[eval] iql_hopper  checkpoint rule last: ckpt/update_300.pt  9 conditions x 20 episodes, seed 10000
  nominal                return     151.60 +-     0.60  score     5.3
  friction_0.9           return     148.65 +-     0.58  score     5.2
  friction_1.1           return     151.43 +-     0.61  score     5.3
  friction_0.8           return     145.69 +-     0.60  score     5.1
  friction_1.2           return     151.18 +-     0.61  score     5.3
  friction_0.7           return     144.34 +-     2.13  score     5.1
  friction_1.3           return     153.89 +-     0.65  score     5.4
  friction_0.6           return     142.94 +-     0.61  score     5.0
  friction_1.4           return     158.04 +-     0.94  score     5.5
[eval] wrote runs/iql_hopper/seed0/eval/hopper_friction.json
```

The per-factor number of the benchmark is the mean score over the conditions of the factor.

```python
import json

result = json.load(open("runs/iql_hopper/seed0/eval/hopper_friction.json"))
by_factor = {}
for condition in result["conditions"].values():
    if "axis" in condition:
        by_factor.setdefault(condition["axis"], []).append(condition["score"])
for factor, scores in by_factor.items():
    print(factor, round(sum(scores) / len(scores), 1), "over", len(scores), "conditions")
```

```text
friction 5.2 over 8 conditions
```

Several factors go in one card, one set of scales after another, and the same loop gives one
number per factor; the Part 1 cards are exactly this with three factors at eight scales.

## A field the adapter does not list

The adapter is a translation table. On one side is a parameter name a shift can use, such as
`gravity` or `geom_friction`; on the other side is the place in the compiled MuJoCo model where
that quantity lives. The model has many more fields than the 21 names the table knows, and
every one of them is already a valid shift factor except for the missing name. Adding the name
is one line.

The example here is joint armature, the extra rotor inertia MuJoCo adds to each joint. In the
model it is the array `dof_armature`, with one entry per degree of freedom. The adapter does
not list it, so `param: dof_armature` is rejected until a row is added to `_FIELDS` in
`robustrllib/adapters/mujoco.py`.

```python
_FIELDS = {
    "gravity":       ("opt.gravity", "vec", 2),
    "body_mass":     ("body_mass", "body", None),
    "dof_damping":   ("dof_damping", "dof", None),
    "geom_friction": ("geom_friction", "geom", 0),
    ...
    "dof_armature":  ("dof_armature", "dof", None),   # the new row
}
```

A row has three parts.

| Part | In the new row | Meaning |
|---|---|---|
| Model attribute | `"dof_armature"` | Where the array is in the model; a dotted path such as `opt.gravity` reaches a sub-object |
| Kind | `"dof"` | What one entry of the array belongs to, so that `index` can be resolved: a body, a geom, an actuator, a degree of freedom, a light, a camera, a material, or `vec` for one global vector |
| Column | `None` | For a 1D array nothing; for a 2D array the component to perturb, for example column 0 of `geom_friction` is sliding friction and column 2 of `opt.gravity` the vertical component |

The kind decides how `index` in a shift is understood. For `dof`, `index: thigh_joint` is
turned into the position of that joint's degree of freedom with `mujoco.mj_name2id`, an integer
is used as a position, and `index: all` selects every entry.

Once the row exists the name behaves like any built-in one: in `apply`, in a `ShiftSpec` and in
the `param` field of an eval card, so the friction card above becomes an armature card by
changing `param` and the names.

```python
env = make_robust("Hopper-v5", seed=0)
env.reset(seed=0)
adapter = get_adapter(env)
armature = env.unwrapped.model.dof_armature
print(armature)
adapter.apply("dof_armature", factor=2.0, index="all")
print(armature)
adapter.apply("dof_armature", factor=3.0, index="all")
print(armature)
adapter.reset_all()
print(armature)
adapter.apply("dof_armature", factor=3.0, index="thigh_joint")
print(armature)
```

```text
[0. 0. 0. 1. 1. 1.]
[0. 0. 0. 2. 2. 2.]
[0. 0. 0. 3. 3. 3.]
[0. 0. 0. 1. 1. 1.]
[0. 0. 0. 3. 1. 1.]
```

Hopper has six degrees of freedom: the first three are the root (free to move, armature 0) and
the last three are the thigh, leg and foot joints. Two things to read off the output:

- **Scales are relative to the nominal value and do not compound.** The second `apply` gives
  3.0 times the nominal armature, not 3.0 times the doubled one, because the adapter remembers
  the nominal value of a parameter the first time it touches it and always scales from there.
- **Address one parameter with one index convention.** The nominal value is remembered per
  parameter and index, so `all` and a joint name are two separate memories. Mixing them in one
  run, for example `all` first and `thigh_joint` afterwards, would make the name's memory start
  from an already scaled value. The last line above is safe because `reset_all` restored the
  model first.

Two kinds of field need one more step, and the existing rows show how:

- A field whose per-entity value is a whole vector to be scaled together, such as a body's 3D
  offset `body_pos_xyz`, is also added to the set `_VEC_PER_ENTITY`.
- A field that changes what the policy sees rather than how the world moves, such as a colour
  or a light, is perturbed through the target `appearance` and belongs to the
  [Semantic shift](sources/semantic.md), not to a Dynamic shift.

Mass and inertia are already handled: after an edit to them the adapter recomputes the derived
quantities of the model, so no extra step is needed for a new row that touches them.

## Another simulator

A quantity of a simulator the library does not reach yet needs an adapter: a table of getters
and setters and a branch in `get_adapter`. [Add a physics simulation](add-a-backend.md) walks
through the template. Once the adapter exists, a factor on that simulator is again only an eval
card.

## Factor rules

- The `axis` key names the factor, and the same name means the same physical quantity on every
  task: `gear` is `actuator_gear` on every MuJoCo task and the engine scale on CarRacing.
- The scales of a factor use a Parametric mode name, are symmetric around 1 and are grouped by
  displacement; a stochastic mode name adds variance of its own to every condition.
- A new factor is checked twice before a grid relies on it: that it reaches the simulator's own
  data structure, and that it changes the return of a trained policy, because a factor can
  reach the model and still not matter for the task.
- The benchmark's cards are not edited; a new factor is a new card, and its results are reported
  next to the benchmark's, not inside them.
- A field is reused under an existing parameter name whenever the physical meaning matches; a
  new row is added only for a new quantity.
- One parameter is addressed with one index convention within a run, because nominal values
  are cached per parameter and index at the first touch.
