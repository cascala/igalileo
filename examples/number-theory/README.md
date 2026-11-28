# Learning path: number theory

Lessons on the whole numbers, from divisibility to the factoring methods and modular arithmetic behind modern
cryptography. Every method is written as a short Galileo function, so you can change it and watch what happens.

| # | Notebook | What you learn |
|---|---|---|
| 0 | [Simplify and eval](00-simplify-and-eval.ipynb) | exact answers, `eval` for digits, and the `calc` setting: work answers out, give digits, or keep input as typed |
| 1 | [Divisibility and primes](01-divisibility-and-primes.ipynb) | division with remainder, Euclid's algorithm, infinitely many primes, the prime number theorem, gaps, the fundamental theorem of arithmetic, perfect numbers |
| 2 | [Prime factoring](02-prime-factoring.ipynb) | trial division, Fermat's method, Pollard's rho and the birthday paradox, Fermat and Miller–Rabin primality tests, Carmichael numbers, record factorizations |
| 3 | [Algebraic factoring](03-algebraic-factoring.ipynb) | the $10^{300} + 1$ mystery, cyclotomic polynomials, which primes divide $\Phi_d(b)$, Sophie Germain's identity, Aurifeuillean factors and the Cunningham Project, hunting for new identities with `factorsearch` |
| 4 | [Modular arithmetic](04-modular-arithmetic.ipynb) | congruences, divisibility tests, fast powers, Fermat's little theorem and Euler's theorem, inverses, the Chinese remainder theorem, orders and primitive roots |
| 5 | [Cryptography](05-cryptography.ipynb) | shift ciphers, the Diffie–Hellman key exchange, RSA keys, encryption and signatures, breaking small keys, the quantum threat |
| 6 | [The factoring lab](06-factoring-lab.ipynb) | RSA-like test numbers, a scoreboard of nine factoring methods with fitted growth laws, scoring your own method, a search for new factoring programs (and why its wins vanish on new numbers), hunting for leaks of $p$ in features of $N$ with corrected p-values |
| 7 | [The number field sieve](07-number-field-sieve.ipynb) | one number in two worlds ($\mathbb{Z}$ and $\mathbb{Z}[\alpha]$), smooth pairs on both sides, sieving, quadratic characters, the square root in a number field, the special number field sieve on $2^{128} + 1$ and $2^{256} + 1$, polynomials that factor, a race against the quadratic sieve |

Prerequisites: the [Numbers](../foundations/01-numbers.ipynb) lesson of the foundations path.

The notebooks are generated from the plain-text sources in [`../src/number-theory`](../src/number-theory) by
`python3 examples/src/build.py`, then executed so that results and plots are stored with them.
