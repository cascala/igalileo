# iGalileo: JupyterLab with the Galileo kernel, in one image.
#
# Galileo itself is built from source, passed in as a named build context:
#   docker build --build-context galileo=../galileo -t cascala/igalileo .
#   docker build --build-context galileo=https://github.com/cascala/galileo.git -t cascala/igalileo .

# ---- Build stage: JDK 21 + sbt ----
# The build stage runs on the build machine's own platform: the jars it makes run anywhere
FROM --platform=$BUILDPLATFORM eclipse-temurin:21-jdk AS build

ARG SBT_VERSION=1.10.7
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && \
    curl -fsSL "https://github.com/sbt/sbt/releases/download/v${SBT_VERSION}/sbt-${SBT_VERSION}.tgz" | tar xz -C /opt && \
    ln -s /opt/sbt/bin/sbt /usr/local/bin/sbt && \
    rm -rf /var/lib/apt/lists/*

# Galileo, published to the local ivy repository so iGalileo can depend on it
COPY --from=galileo . /src/galileo
RUN cd /src/galileo && sbt -batch publishLocal

WORKDIR /src/igalileo
COPY build.sbt ./
COPY project/build.properties project/native-packager.sbt project/
RUN sbt -batch update
COPY src src
RUN sbt -batch stage

# ---- Run stage: JRE + JupyterLab ----
FROM eclipse-temurin:21-jre

RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv tini && \
    rm -rf /var/lib/apt/lists/* && \
    python3 -m venv /opt/jupyter && \
    /opt/jupyter/bin/pip install --no-cache-dir jupyterlab notebook plotly && \
    /opt/jupyter/bin/jupyter labextension disable --level=system "@jupyterlab/apputils-extension:announcements"

COPY --from=build /src/igalileo/target/universal/stage /opt/igalileo
COPY docker/kernel.json /usr/local/share/jupyter/kernels/galileo/kernel.json
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY examples /opt/igalileo/examples

# The base image already has a user with uid 1000 (ubuntu); rename it for clarity
RUN usermod -l galileo -d /home/galileo -m ubuntu && groupmod -n galileo ubuntu && \
    mkdir -p /home/galileo/notebooks && cp -r /opt/igalileo/examples/. /home/galileo/notebooks/ && rm -rf /home/galileo/notebooks/src && \
    chown -R galileo:galileo /home/galileo && chmod 755 /usr/local/bin/entrypoint.sh /opt/igalileo/bin/igalileo

USER galileo
WORKDIR /home/galileo/notebooks
ENV PATH=/opt/jupyter/bin:$PATH
EXPOSE 8888

ENTRYPOINT [ "/usr/bin/tini", "--", "/usr/local/bin/entrypoint.sh" ]
CMD [ "lab" ]
