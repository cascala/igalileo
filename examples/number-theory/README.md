# Learning path: number theory

Lessons on the whole numbers, from divisibility to the factoring methods and modular arithmetic behind modern
cryptography. Every method is written as a short Galileo function, so you can change it and watch what happens.

| # | Notebook | What you learn |
|---|---|---|
| 1 | [Divisibility and primes](01-divisibility-and-primes.ipynb) | division with remainder, Euclid's algorithm, infinitely many primes, the prime number theorem, gaps, the fundamental theorem of arithmetic, perfect numbers |
| 2 | [Prime factoring](02-prime-factoring.ipynb) | trial division, Fermat's method, Pollard's rho and the birthday paradox, Fermat and Miller–Rabin primality tests, Carmichael numbers, record factorizations |
| 3 | [Modular arithmetic](03-modular-arithmetic.ipynb) | congruences, divisibility tests, fast powers, Fermat's little theorem and Euler's theorem, inverses, the Chinese remainder theorem, orders and primitive roots |
| 4 | [Cryptography](04-cryptography.ipynb) | shift ciphers, the Diffie–Hellman key exchange, RSA keys, encryption and signatures, breaking small keys, the quantum threat |

Prerequisites: the [Numbers](../foundations/01-numbers.ipynb) lesson of the foundations path.

The notebooks are generated from the plain-text sources in [`../src/number-theory`](../src/number-theory) by
`python3 examples/src/build.py`, then executed so that results and plots are stored with them.
