# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copy custom Maven settings configured with Google mirror to prevent 429 rate limiting on Render
COPY settings.xml /root/.m2/settings.xml

# Copy the pom.xml and source code
COPY pom.xml .
COPY src ./src

# Package the application using the settings mirror (skip tests to speed up the build)
RUN mvn clean package -B -s /root/.m2/settings.xml -DskipTests

# Stage 2: Create the runtime image
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Copy the built jar file from the build stage
COPY --from=build /app/target/election-backend-0.0.1-SNAPSHOT.jar app.jar

# Expose port 8080 (Render dynamically assigns a PORT, Spring Boot handles this via application.properties)
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
