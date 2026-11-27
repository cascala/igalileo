# Learning path: group theory

Ten lessons on symmetry and the structures that describe it. Lessons 1 to 3 build groups with `generate` from a few elements; lesson 4 treats groups as values (`sym(4)`, `quotient(G, N)`, ...); lesson 5 adds rings and fields (`zmod(12)`, `gf(9)`, `numfield(x^2 - 2)`); lesson 6 brings groups and fields together in Galois theory, quaternions and Lie algebras. Lessons 7 to 10 put them to work: counting with symmetry, polynomials over finite fields, ruler-and-compass constructions, and the codes that protect data.

| # | Notebook | What you learn |
|---|---|---|
| 1 | [Symmetry](01-symmetry.ipynb) | symmetries of a triangle and a square as permutations, composing, the group axioms, group tables, orders |
| 2 | [Cyclic groups](02-cyclic-groups.ipynb) | rotations and addition mod $n$, isomorphism, generators and orders, subgroups, multiplication mod $n$, the Klein four-group, roots of unity |
| 3 | [Permutations and Lagrange's theorem](03-permutations-and-lagrange.ipynb) | the symmetric group, cycles and orders, perfect card shuffles, even and odd permutations, the 15 puzzle, cosets, Lagrange's theorem, Fermat's little theorem |
| 4 | [Groups as objects](04-groups-as-objects.ipynb) | groups by name and by presentation, Cayley graphs, normal subgroups and quotients, conjugacy classes, isomorphism and kernels, Sylow subgroups, solvable groups and the quintic, abelian groups |
| 5 | [Rings and fields](05-rings-and-fields.ipynb) | integers mod $n$, zero divisors and units, finite fields and generators, discrete logarithms and Diffie–Hellman, fields with $p^k$ elements, quotient rings and number fields, norm and minimal polynomial, ideals and Gröbner bases |
| 6 | [Galois and symmetry](06-galois-and-symmetry.ipynb) | Cardano and Ferrari, the Galois group of a polynomial, discriminants and Frobenius, solvability by radicals and the quintic, quaternions, rotations and the double cover SU(2) → SO(3), Lie algebras and the Killing form |
| 7 | [Group actions and counting](07-group-actions-and-counting.ipynb) | orbits and stabilizers, the rotations of a cube, Burnside's lemma, necklaces and bracelets, colouring a cube, counting isomers |
| 8 | [Polynomials over fields](08-polynomials-over-fields.ipynb) | division with remainder, gcd and repeated roots, irreducibility tests and Eisenstein, factoring mod $p$, counting irreducible polynomials, CRC checksums |
| 9 | [Ruler and compass](09-ruler-and-compass.ipynb) | constructible numbers and towers of square roots, field degrees, doubling the cube and trisecting the angle, regular polygons and Fermat primes, Gauss's 17-gon |
| 10 | [Error-correcting codes](10-error-correcting-codes.ipynb) | parity checks, the Hamming code and syndromes, failure rates, Reed–Solomon codes over $GF(8)$, decoding by interpolation |

Prerequisites: the [foundations](../foundations/README.md) up to complex numbers. Lesson 2 links up with
[number theory](../number-theory/README.md) lesson 3 (modular arithmetic).

The notebooks are generated from the plain-text sources in [`../src/group-theory`](../src/group-theory) by
`python3 examples/src/build.py`, then executed so that results and plots are stored with them.
