# Start from openjdk and name this stage 'build'
FROM openjdk:8 AS build

ENV SBT_VERSION 1.3.3

RUN \
  curl -L -o sbt-$SBT_VERSION.deb http://dl.bintray.com/sbt/debian/sbt-$SBT_VERSION.deb && \
  dpkg -i sbt-$SBT_VERSION.deb && \
  rm sbt-$SBT_VERSION.deb && \
  apt-get update && \
  apt-get install sbt && \
  sbt sbtVersion

WORKDIR /igalileo

ADD . /igalileo

# Build a regular, slim jar (because sbt assembly has duplicates I can't resolve)
RUN sbt docker:stage

FROM openjdk:8-jre
#ENV VERSION 0.1.4-SNAPSHOT
COPY --from=build igalileo/target/docker/stage .
ENTRYPOINT [ "/opt/docker/bin/igalileo" ]

# This is very painful
# assembly does not work properly, so we are copying all required jars into a jars folder
# then launch java/scala against those jars
#COPY --from=build \
#    /igalileo/libs libs

#COPY --from=build \
#    /igalileo/target/scala-2.13/igalileo_2.13-$VERSION.jar igalileo.jar

#RUN mkdir jars
#RUN find libs -name '*jar' -exec mv '{}' jars \;
#RUN rm -fR libs

# Use ENTRYPOINT instead of CMD since ENTRYPOINT passes through arguments
#ENTRYPOINT [ "java", "-cp jars igalileo.Kernel.main" ] 


