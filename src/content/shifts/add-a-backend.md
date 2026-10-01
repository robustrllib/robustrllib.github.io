# Add a Backend

A backend is a simulator the shift wrappers can reach into. Most shifts act on what passes
through `reset` and `step` and need nothing from it; the shifts that edit the simulator go
through a dynamics adapter.

## Summary

| Aspect | Backend adapter |
|---|---|
| Interface | A subclass of `DynamicsAdapter` with `list_params`, `get_nominal` and `set_param` |
| Selection | `get_adapter(env)` inspects the attributes of `env.unwrapped` |
| Vocabulary | Names of physical parameters, shared across backends |
| Needed for | The Dynamic shift and the Semantic shift |
| Bundled | Adapters for MuJoCo and Box2D, and a template |
| Limits | `push` and the colour mode names use MuJoCo data structures directly |

## The adapter interface

`DynamicsAdapter` is defined in the module `robustrllib.adapters.base`. Three of its methods
are abstract.

```python
from robustrllib.adapters import DynamicsAdapter, get_adapter
```

| Method | Kind | Contract |
|---|---|---|
| `list_params()` | Abstract | The parameter names the adapter understands |
| `get_nominal(param, index=None)` | Abstract | The value of the pristine model, cached at first touch |
| `set_param(param, value, index=None)` | Abstract | Writes the value into the live model |
| `apply(param, *, factor=None, value=None, index=None)` | Provided | Sets `value`, or the nominal value times `factor` |
| `read(param, index=None)` | Optional | The current value in the live model; needed by `translate` |
| `reset_all()` | Optional | Restores every touched parameter |
| `inject_state_noise(rng, q_sigma, v_sigma, scale)` | Optional | Adds noise to the simulator state; needed by the target `transition` |

### Requirements per shift

| Shift | Mode names | Requirement on the backend |
|---|---|---|
| Observation shift, Action shift, Reward/cost shift | All | None |
| Latency shift | `fixed`, `buffer`, `interp`, `delay` | None |
| Latency shift | `substep` | `frame_skip` or `n_substeps`, and `model.opt.timestep` |
| Dynamic shift | All on the target `dynamics` but `push` | An adapter; `read` for `translate` |
| Dynamic shift | `gauss` on the target `transition` | An adapter with `inject_state_noise` |
| Dynamic shift, Semantic shift | `push`; `hue`, `tint`, `swap` | A MuJoCo model |

The wrapper of a Dynamic shift reads the nominal value when it is constructed and calls `apply`
after every `reset`. With a schedule it calls `apply` before every step as well.

### Bundled adapters

| Aspect | Template | MuJoCo adapter |
|---|---|---|
| Parameter table | Name to getter and setter | Name to model attribute, entity kind and default component |
| Parameters | 6 | 21 |
| Names | Compared with `joint.name` | Resolved by the simulator per entity kind |
| `index: all` | One value for all entities | Every entity scaled from its own nominal value |
| Derived quantities | None | Recomputed after edits to mass, inertia, body position or geom size |
| `read`, `inject_state_noise` | Not implemented | Implemented |

The Box2D adapter in `robustrllib.adapters.box2d` uses the getter and setter table of the
template.

## Implement an adapter

The module `robustrllib.adapters.template` is a worked example for a simulator that keeps its
physics in plain attributes and in a list of joint objects. The command prints the location of
the file.

```bash
python -c "import robustrllib.adapters.template as m; print(m.__file__)"
```

Everything specific to the simulator is in one table of getters and setters.

```python
_FIELDS = {
    # --- scalar, whole-scene parameters ---
    "gravity": (
        lambda e, i: e.physics.gravity_z,
        lambda e, i, v: setattr(e.physics, "gravity_z", v),
    ),
    ...
    "actuator_gear": (
        lambda e, i: _resolve(e, i)[0].torque_limit,
        lambda e, i, v: [setattr(j, "torque_limit", v) for j in _resolve(e, i)],
    ),
    ...
}
```

`index` is resolved to entities by position, by name, or as `"all"`.

```python
def _resolve(env, index):
    joints = _joints(env)
    if index == "all" or index is None:
        return joints
    if isinstance(index, str):
        for j in joints:
            if j.name == index:
                return [j]
        raise ValueError(f"no joint named {index!r}")
    return [joints[int(index)]]
```

The class contains no simulator code.

```python
class TemplateDynamicsAdapter(DynamicsAdapter):
    def __init__(self, env):
        self._env = env
        self._nominal: dict = {}

    def list_params(self):
        return tuple(_FIELDS)

    def get_nominal(self, param, index=None):
        key = (param, index)
        if key not in self._nominal:
            self._nominal[key] = float(_FIELDS[param][0](self._env, index))
        return self._nominal[key]

    def set_param(self, param, value, index=None):
        self.get_nominal(param, index)   # cache nominal BEFORE the first write
        _FIELDS[param][1](self._env, index, float(value))

    def reset_all(self):
        for (param, index), nominal in self._nominal.items():
            _FIELDS[param][1](self._env, index, nominal)
```

The adapter runs without a simulator, on an object with the attributes the table expects.

```python
from types import SimpleNamespace
from robustrllib.adapters.template import TemplateDynamicsAdapter


def joint(name, torque):
    return SimpleNamespace(name=name, torque_limit=torque, damping=0.5,
                           static_friction=0.1, link_mass=2.0)


sim = SimpleNamespace(
    physics=SimpleNamespace(gravity_z=-9.81, dt=0.002),
    robot=SimpleNamespace(joints=[joint("shoulder_pan", 10.0), joint("elbow", 6.0)]),
)
adapter = TemplateDynamicsAdapter(sim)

adapter.apply("gravity", factor=1.2)
adapter.apply("actuator_gear", factor=0.8, index="elbow")
adapter.apply("actuator_gear", factor=0.5, index="elbow")
print(round(sim.physics.gravity_z, 3), [j.torque_limit for j in sim.robot.joints])

adapter.reset_all()
print(round(sim.physics.gravity_z, 3), [j.torque_limit for j in sim.robot.joints])
```

```text
-11.772 [10.0, 3.0]
-9.81 [10.0, 6.0]
```

The second `apply` on the elbow gives 0.5 times the nominal 6.0, not 0.5 times the scaled value:
**factors are relative to the nominal value and do not compound**. For `index: all` the template
keeps one nominal value per parameter, taken from the first entity; a model whose entities
differ stores a vector of nominal values, as the MuJoCo adapter does.

!!! note
    The parameter names are the vocabulary of the evaluation grids. A grid that says
    `param: actuator_gear` runs on every backend that defines that name.

## Register an adapter

The shift wrappers obtain their adapter from `get_adapter(env)` in the package
`robustrllib.adapters`. The command prints the file that defines the function.

```bash
python -c "import robustrllib.adapters as m; print(m.__file__)"
```

A new branch recognises the environment by an attribute that only its stack has.

```python
if hasattr(inner, "robot") and hasattr(inner, "physics"):
    from robustrllib.adapters.template import TemplateDynamicsAdapter
    return TemplateDynamicsAdapter(inner)
```

**The branch is placed before the more general ones.** An environment that exposes `model` and
`data` is otherwise taken by the MuJoCo adapter, and one that exposes `world` by the Box2D
adapter.

The environment itself is a subclass of `robustrllib.gym.Env`. A registered id is built with
`make_robust`; an instance is wrapped with `build_pipeline`.

```python
from robustrllib import ShiftSpec, build_pipeline
import robustrllib.gym as gym

base = gym.make("Hopper-v5")
env = build_pipeline(base, [ShiftSpec("observation", "gauss", {"sigma": 0.05})], seed=0)
```

The pipeline passes the plain action to `step`, unless the first parameter of `step` is named
`robust_input`, as in the tasks bundled with the library. **`robustrllib.gym.make` reads the
command line** when a task family is first created and exits on an argument it does not know;
`make_robust` does not.

!!! tip
    If `env.unwrapped` has a `_get_obs()` method, the wrapper of a Dynamic shift calls it after
    the shift is applied at `reset`, so that the first observation describes the shifted model.

## Verify an adapter

An adapter can be wrong without raising an error. The checks read the parameter from the
simulator's own data structure.

```python
from robustrllib import make_robust
from robustrllib.adapters import get_adapter

env = make_robust("Hopper-v5", seed=0)
env.reset(seed=0)
adapter = get_adapter(env)
gear = env.unwrapped.model.actuator_gear

adapter.apply("actuator_gear", factor=0.8, index="all")
print(gear[:, 0])
adapter.apply("actuator_gear", factor=0.5, index="all")
print(gear[:, 0])
adapter.reset_all()
print(gear[:, 0])
```

```text
[160. 160. 160.]
[100. 100. 100.]
[200. 200. 200.]
```

| Check | Catches |
|---|---|
| Apply a factor, then read the parameter from the simulator | A setter that writes to an object read only at construction |
| Apply two factors in sequence; expect the nominal value times the second | A getter that returns the perturbed value, so that factors compound |
| Reset several times under one shift and read the parameter each time | A model that is rebuilt at `reset` without the shift being applied again |

The third check, through the wrapper of a Dynamic shift:

```python
from robustrllib import ShiftSpec

env = make_robust("Hopper-v5", shifts=[
    ShiftSpec("dynamics", "scale", {"param": "actuator_gear", "index": "all", "factor": 0.8}),
], seed=0)
values = []
for seed in range(3):
    env.reset(seed=seed)
    values.append(env.unwrapped.model.actuator_gear[:, 0].tolist())
print(values)
```

```text
[[160.0, 160.0, 160.0], [160.0, 160.0, 160.0], [160.0, 160.0, 160.0]]
```

## Adapter rules

- `get_nominal` returns the value of the pristine model, cached before the first write.
- `set_param` writes into the live model, the one the simulator steps.
- `reset_all` restores every touched parameter exactly.
- A parameter name is reused whenever the physical meaning matches an existing one.
- `index` accepts a position, a name and `"all"`.
- `read` is implemented before `translate` is used, and `inject_state_noise` before the target
  `transition`.
- The branch in `get_adapter` tests an attribute that only the new stack has.
- A new axis is checked on a trained policy before a grid relies on it, because an axis can
  reach the model and still not matter for the task.
