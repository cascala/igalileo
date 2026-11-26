# Galileo examples and learning paths

Interactive lessons for Galileo, a computer algebra system. Each path is a series of notebooks; every cell can be
edited and re-run, every plot is labelled and explained. Run them in the browser at
[cascala.github.io/igalileo](https://cascala.github.io/igalileo/), in JupyterLab with `docker run -p 8888:8888
cascala/igalileo`, or open them on GitHub to read them with their results.

## Start here

* [Galileo tour](galileo-tour.ipynb): the language in ten minutes.
* [Foundations](foundations/README.md): nine lessons from arithmetic through algebra, trigonometry, complex numbers
  and calculus to differential equations and conic sections. No background needed.

## Mathematics

* [Multivariable calculus](multivariable/README.md): contour maps, partial derivatives and the gradient,
  optimization, Lagrange multipliers, multiple integrals and the bell curve, vector fields and line integrals,
  and the theorems of Green, Stokes and Gauss. For students in a first multivariable course.
* [Linear algebra](linear-algebra/README.md): nine lessons for a first course, from vectors and elimination to least squares, eigenvalues, the SVD and the matrix exponential.
* [Differential equations](differential-equations/README.md): eight lessons for a first course, from slope fields
  and the logistic equation through oscillations, Laplace transforms and the phase plane to Fourier series and the
  heat and wave equations.
* [Number theory](number-theory/README.md): primes, prime factoring (trial division, Fermat, Pollard rho,
  Miller–Rabin), algebraic factoring (cyclotomic polynomials, Aurifeuillean factors, hunting for identities),
  modular arithmetic, cryptography (Diffie–Hellman, RSA), a factoring lab (scoreboard, algorithm search,
  leak hunt) and the number field sieve.
* [Group theory](group-theory/README.md): symmetry, cyclic groups, permutations, Lagrange's theorem.
* [Chaos and fractals](chaos/README.md): the logistic map, bifurcations, the Lorenz attractor, the Mandelbrot set.
* [Differential geometry](differential-geometry/README.md): curves, surfaces, curvature, geodesics, the Riemann tensor.
  There is also a short [differential geometry tour](differential-geometry-tour.ipynb).

## Physics

* [General relativity](general-relativity/README.md): spacetime, black holes, orbits, light bending, GPS,
  gravitational waves, cosmology.
* [Discovering physical laws](discovery/README.md): find Kepler's and Newton's laws in planet data, then the term
  Einstein added for Mercury.

## How the notebooks are made

The notebooks are generated from plain-text sources in [`src/`](src): cells are separated by lines that are exactly
`%md` or `%code`. `python3 examples/src/build.py <source>` writes the notebook, and
`python3 examples/src/run.py <notebook>` executes it with the Galileo kernel so the results are stored.
