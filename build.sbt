organization := "com.github.cascala"

name := "igalileo"
version := "0.1.4"
scalaVersion := "2.13.16"

scalacOptions ++= Seq( "-deprecation", "-feature" )

// Galileo 0.1.4 (with plotting) is not on Maven Central yet:
// run `sbt publishLocal` in a checkout of https://github.com/cascala/galileo first.
// The Dockerfile does this for you.
libraryDependencies += "com.github.cascala" %% "galileo" % "0.1.4"
libraryDependencies += "com.fasterxml.jackson.module" %% "jackson-module-scala" % "2.17.2"
libraryDependencies += "org.zeromq" % "jeromq" % "0.6.0"
libraryDependencies += "org.scalatest" %% "scalatest" % "3.2.19" % Test

Compile / mainClass := Some( "igalileo.Kernel" )

enablePlugins(JavaAppPackaging)
