# Learning path: linear algebra

Two lessons on vectors, matrices and eigenvalues, with every transformation drawn.

| # | Notebook | What you learn |
|---|---|---|
| 1 | [Vectors and matrices](01-vectors-and-matrices.ipynb) | vectors, length, dot product and angles, matrices as transformations, products, the determinant, inverses, systems of equations, row reduction, rank and null space |
| 2 | [Eigenvalues](02-eigenvalues.ipynb) | eigenvectors and eigenvalues, the characteristic equation, diagonalising and powers, Fibonacci and the golden ratio, a Markov chain, rotations and symmetric matrices |

Prerequisites: the [foundations](../foundations/README.md) up to trigonometry (lesson 2 also uses complex numbers).
Afterwards, [differential geometry](../differential-geometry/README.md) uses matrices as metrics.

The notebooks are generated from the plain-text sources in [`../src/linear-algebra`](../src/linear-algebra) by
`python3 examples/src/build.py`, then executed so that results and plots are stored with them.
