plugins {
    kotlin("jvm") version "1.9.22"
    application
}

repositories {
    mavenCentral()
    maven { url = uri("https://jitpack.io") }
}

dependencies {
    implementation("de.fraunhofer.aisec:cpg-core:7.1.0")
    implementation("de.fraunhofer.aisec:cpg-language-llvm:7.1.0")
    implementation("com.fasterxml.jackson.core:jackson-databind:2.16.1")
}

application {
    mainClass.set("MainKt")
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
    kotlinOptions.jvmTarget = "17"
}
