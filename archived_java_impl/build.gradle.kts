plugins {
	java
	id("org.springframework.boot") version "3.4.10"
	id("io.spring.dependency-management") version "1.1.7"
	id("org.flywaydb.flyway") version "9.22.3"
}

buildscript {
	dependencies {
		classpath("com.mysql:mysql-connector-j:8.4.0")
		classpath("org.flywaydb:flyway-mysql:9.22.3")
	}
	repositories {
		mavenCentral()
	}
}

group = "com.phz"
version = "0.0.1-SNAPSHOT"
description = "Demo project for Spring Boot"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(17)
	}
}

configurations {
	compileOnly {
		extendsFrom(configurations.annotationProcessor.get())
	}
}

repositories {
	mavenCentral()
}

flyway {
	url = System.getenv("FLYWAY_URL") ?: "jdbc:mysql://localhost:3306/dada_island?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
	user = System.getenv("FLYWAY_USER") ?: "dada"
	password = System.getenv("FLYWAY_PASSWORD") ?: "dev_password"
	locations = arrayOf("filesystem:src/main/resources/db/migration")
	driver = "com.mysql.cj.jdbc.Driver"
}

dependencies {
	implementation("org.springframework.boot:spring-boot-starter-security")
	implementation("org.springframework.boot:spring-boot-starter-web")
	implementation("org.springframework.boot:spring-boot-starter-validation")
	implementation("org.springframework.boot:spring-boot-starter-data-redis")
	implementation("org.mybatis.spring.boot:mybatis-spring-boot-starter:3.0.5")
	implementation("org.apache.rocketmq:rocketmq-spring-boot-starter:2.3.0")
	implementation("io.jsonwebtoken:jjwt-api:0.12.6")
	compileOnly("org.projectlombok:lombok")
	developmentOnly("org.springframework.boot:spring-boot-docker-compose")
	annotationProcessor("org.projectlombok:lombok")
	runtimeOnly("com.mysql:mysql-connector-j:8.4.0")
	runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
	runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")
	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testImplementation("org.mybatis.spring.boot:mybatis-spring-boot-starter-test:3.0.5")
	testImplementation("org.springframework.security:spring-security-test")
	testImplementation("it.ozimov:embedded-redis:0.7.3") {
		exclude(group = "org.slf4j", module = "slf4j-simple")
	}
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<Test> {
	useJUnitPlatform()
}
