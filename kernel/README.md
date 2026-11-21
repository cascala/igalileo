# galileo-kernel

The Jupyter kernel for [Galileo](https://github.com/cascala/galileo-rs). It is a thin
[ipykernel](https://github.com/ipython/ipykernel) wrapper: the mathematics happens in the
`galileo` executable, which this package runs as `galileo --kernel` and talks to over a
pipe.

```
cargo install --git https://github.com/cascala/galileo-rs   # the engine
pip install ./kernel                                        # this package
python -m galileo_kernel.install --user                     # the kernel spec
```

The kernel looks for `galileo` on the `PATH`; set `GALILEO_BIN` to use another executable.
