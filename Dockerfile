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

RUN python3 -m venv /opt/jupyter && \
    /opt/jupyter/bin/pip install --no-cache-dir jupyterlab notebook plotly && \
    /opt/jupyter/bin/jupyter labextension disable --level=system "@jupyterlab/apputils-extension:announcements"

COPY kernel /tmp/kernel
RUN /opt/jupyter/bin/pip install --no-cache-dir /tmp/kernel && rm -rf /tmp/kernel

COPY --from=build /usr/local/bin/galileo /usr/local/bin/galileo
COPY docker/kernel.json /usr/local/share/jupyter/kernels/galileo/kernel.json
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY examples /opt/igalileo/examples

RUN useradd -m -u 1000 -s /bin/bash galileo && \
    mkdir -p /home/galileo/notebooks && cp -r /opt/igalileo/examples/. /home/galileo/notebooks/ && rm -rf /home/galileo/notebooks/src && \
    chown -R galileo:galileo /home/galileo && chmod 755 /usr/local/bin/entrypoint.sh

USER galileo
WORKDIR /home/galileo/notebooks
ENV PATH=/opt/jupyter/bin:$PATH
EXPOSE 8888

ENTRYPOINT [ "/usr/bin/tini", "--", "/usr/local/bin/entrypoint.sh" ]
CMD [ "lab" ]
