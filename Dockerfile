# iGalileo: JupyterLab with the Galileo kernel, in one image.
#
# The engine, galileo, is built from source, passed in as a named build context:
#   docker build --build-context galileo=../galileo -t cascala/igalileo .
#   docker build --build-context galileo=https://github.com/cascala/galileo.git -t cascala/igalileo .

# ---- Build stage: the galileo executable (Rust, no dependencies) ----
FROM rust:1-slim AS build
COPY --from=galileo . /src/galileo
RUN cd /src/galileo && cargo build --release --locked --bin galileo && \
    cp target/release/galileo /usr/local/bin/galileo

# ---- Run stage: Python + JupyterLab + the kernel wrapper ----
FROM python:3.12-slim

# tini reaps the kernel processes Jupyter starts
ARG TARGETARCH
ARG TINI_VERSION=v0.19.0
ADD --chmod=755 https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini-${TARGETARCH} /usr/bin/tini

# The kernel sends plots as Plotly JSON, so JupyterLab only needs plotly's renderer extension,
# not the plotly Python package. Keep the extension, then drop what the image never uses
# (plotly, jedi completion, the debugger, pip, locale data for languages other than English)
# to keep the image small.
COPY kernel /tmp/kernel
RUN python3 -m venv /opt/jupyter && \
    /opt/jupyter/bin/pip install --no-cache-dir jupyterlab notebook plotly /tmp/kernel && \
    /opt/jupyter/bin/jupyter labextension disable --level=system "@jupyterlab/apputils-extension:announcements" && \
    ext=/opt/jupyter/share/jupyter/labextensions/jupyterlab-plotly && cp -r $ext /tmp/jupyterlab-plotly && \
    /opt/jupyter/bin/pip uninstall -y -q plotly narwhals jedi parso debugpy && \
    mv /tmp/jupyterlab-plotly $ext && \
    /opt/jupyter/bin/pip uninstall -y -q pip && \
    find /opt/jupyter/lib/python3*/site-packages/babel/locale-data -type f ! -name 'en*' ! -name root.dat -delete && \
    rm -rf /tmp/kernel /root/.cache

COPY --from=build /usr/local/bin/galileo /usr/local/bin/galileo
COPY docker/kernel.json /usr/local/share/jupyter/kernels/galileo/kernel.json
COPY --chmod=755 docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN useradd -m -u 1000 -s /bin/bash galileo
COPY --chown=galileo:galileo examples /home/galileo/notebooks

USER galileo
WORKDIR /home/galileo/notebooks
ENV PATH=/opt/jupyter/bin:$PATH
EXPOSE 8888

ENTRYPOINT [ "/usr/bin/tini", "--", "/usr/local/bin/entrypoint.sh" ]
CMD [ "lab" ]
