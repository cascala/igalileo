organization := "com.github.cascala"

name := "igalileo"
version := "0.1.3"
scalaVersion := "2.13.1"

scalacOptions ++= Seq( "-deprecation", "-feature" )

libraryDependencies += "com.github.cascala" %% "galileo" % "0.1.3"
libraryDependencies += "com.fasterxml.jackson.module" %% "jackson-module-scala" % "2.10.1"
libraryDependencies += "org.zeromq" % "jeromq" % "0.5.1"

//managedDirectory := baseDirectory.value / "libs"
//useCoursier := false
//retrieveManaged := true
enablePlugins(JavaAppPackaging)
enablePlugins(DockerPlugin)

//mainClass in Compile := Some("igalileo.Kernel")