# Learning path: group theory

Four lessons on symmetry and the groups that describe it, computed with permutations. Lessons 1 to 3 build groups with `generate` from a few elements; lesson 4 treats groups as values (`sym(4)`, `quotient(G, N)`, ...).

| # | Notebook | What you learn |
|---|---|---|
| 1 | [Symmetry](01-symmetry.ipynb) | symmetries of a triangle and a square as permutations, composing, the group axioms, group tables, orders |
| 2 | [Cyclic groups](02-cyclic-groups.ipynb) | rotations and addition mod $n$, isomorphism, generators and orders, subgroups, multiplication mod $n$, the Klein four-group, roots of unity |
| 3 | [Permutations and Lagrange's theorem](03-permutations-and-lagrange.ipynb) | the symmetric group, cycles and orders, perfect card shuffles, even and odd permutations, the 15 puzzle, cosets, Lagrange's theorem, Fermat's little theorem |
| 4 | [Groups as objects](04-groups-as-objects.ipynb) | groups by name and by presentation, Cayley graphs, normal subgroups and quotients, conjugacy classes, isomorphism and kernels, Sylow subgroups, solvable groups and the quintic, abelian groups |

Prerequisites: the [foundations](../foundations/README.md) up to complex numbers. Lesson 2 links up with
[number theory](../number-theory/README.md) lesson 3 (modular arithmetic).

The notebooks are generated from the plain-text sources in [`../src/group-theory`](../src/group-theory) by
`python3 examples/src/build.py`, then executed so that results and plots are stored with them.
