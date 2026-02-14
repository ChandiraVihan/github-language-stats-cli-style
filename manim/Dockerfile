FROM manimcommunity/manim:v0.18.0

# Install Node.js for fetching GitHub data (optional, since you fetch in CI now)
RUN apt-get update && apt-get install -y curl ffmpeg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /manim

# Copy scene files
COPY . .

# Run as root by default to avoid permission issues with volume mounts
USER root

ENTRYPOINT ["/bin/bash", "-c"]
CMD ["manim -qh solar_system.py GitHubSolarSystem"]