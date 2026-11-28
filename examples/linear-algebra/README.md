# Learning path: linear algebra

Nine lessons for a first undergraduate course in linear algebra, from vectors to the singular value decomposition and
the matrix exponential. Each lesson opens with a question, builds the idea with small examples you work by hand, and
uses Galileo to check, to draw and to take on the bigger computations. Every section ends with a **Try this**;
exercises with hints and answers close each lesson.

| # | Notebook | What you learn |
|---|---|---|
| 0 | [Simplify and eval](00-simplify-and-eval.ipynb) | exact answers, `eval` for digits, and the `calc` setting: work answers out, give digits, or keep input as typed |
| 1 | [Vectors and matrices](01-vectors-and-matrices.ipynb) | vectors, linear combinations, length, dot product and angles, matrices as transformations, rotations, reflections, shears, products, the inverse |
| 2 | [Linear systems and elimination](02-linear-systems.ipynb) | row and column pictures, elimination matrices, back substitution, reduced row echelon form, free variables, balancing chemical equations, $A = LU$ |
| 3 | [Vector spaces, bases and dimension](03-vector-spaces.ipynb) | span, subspaces, linear independence, basis, coordinates, dimension, the four fundamental subspaces, rank–nullity, polynomials and matrices as vectors, the Kronecker product |
| 4 | [Determinants](04-determinants.ipynb) | area and volume, orientation, the three rules, product of pivots, cofactors, the Vandermonde determinant, Cramer's rule, triangle areas, the Jacobian |
| 5 | [Orthogonality, projections and least squares](05-orthogonality.ipynb) | projections onto lines and subspaces, the normal equations, fitting lines to data, orthonormal bases, Gram–Schmidt, $A = QR$ |
| 6 | [Eigenvalues and eigenvectors](06-eigenvalues.ipynb) | the characteristic equation, trace and determinant, diagonalization and powers, Fibonacci and the golden ratio, a Markov chain, complex eigenvalues, a missing eigenvector |
| 7 | [Symmetric matrices and positive definiteness](07-symmetric-matrices.ipynb) | the spectral theorem, quadratic forms and tilted ellipses, five tests for positive definiteness, Cholesky $S = LL^T$, minimum, maximum or saddle |
| 8 | [The singular value decomposition](08-svd.ipynb) | circles to ellipses, $A = U\Sigma V^T$ from $A^TA$, rank, norm and condition number, low-rank approximation (Eckart–Young), principal component analysis |
| 9 | [Linear differential equations, the matrix exponential and the Jordan form](09-jordan-and-matrix-exponential.ipynb) | $x' = Ax$ with eigenvectors, $e^{At}$, stability and phase portraits, critical damping and $t\,e^{\lambda t}$, Jordan blocks and generalized eigenvectors |

Prerequisites: the [foundations](../foundations/README.md) up to trigonometry; complex numbers
([foundations 6](../foundations/06-complex-numbers.ipynb)) for lessons 6 and 9. Afterwards, the
[multivariable calculus](../multivariable/README.md) path uses gradients, Hessians and Jacobians, and
[differential geometry](../differential-geometry/README.md) uses matrices as metrics.

Commands introduced: `dot`, `cross`, `norm`, `inv`, `det`, `transpose`, `A\b` (also least squares), `rref`, `rank`,
`null`, `lu`, `kron`, `gramschmidt`, `qr`, `eig`, `eigvec`, `charpoly`, `trace`, `posdef`, `chol`, `svd`, `cond`,
`expm`, `jordan`. `help(name)` describes each one, and `explain = "teach"` gives longer explanations.

The notebooks are generated from the plain-text sources in [`../src/linear-algebra`](../src/linear-algebra) by
`python3 examples/src/build.py`, then executed so that results and plots are stored with them.
