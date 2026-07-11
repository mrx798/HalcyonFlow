# Stage 1 — Build
FROM maven:3.9.5-eclipse-temurin-21-alpine AS build

WORKDIR /app

# Copy pom.xml first for dependency caching
COPY pom.xml .

# Download dependencies (cached if pom.xml unchanged)
RUN mvn dependency:go-offline -q

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests -q

# Stage 2 — Run
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy the built jar
COPY --from=build /app/target/*.jar app.jar

# Install curl for health checks
RUN apk add --no-cache curl

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/actuator/health || exit 1

EXPOSE ${PORT:-8080}

ENTRYPOINT ["java", "-jar", "app.jar"]
