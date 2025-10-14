FROM gradle:8.10.2-jdk17 AS builder
WORKDIR /workspace/app

ENV GRADLE_USER_HOME=/home/gradle/.gradle

COPY gradle gradle
COPY gradlew gradlew
COPY gradlew.bat gradlew.bat
COPY build.gradle.kts settings.gradle.kts gradle.properties ./

RUN chmod +x gradlew

RUN --mount=type=cache,target=/home/gradle/.gradle ./gradlew --no-daemon dependencies

COPY src src

RUN --mount=type=cache,target=/home/gradle/.gradle ./gradlew --no-daemon bootJar -x test

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /workspace/app/build/libs/*-SNAPSHOT.jar app.jar
EXPOSE 8082
ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
