FROM manimcommunity/manim:v0.18.0

# Install Node.js for fetching GitHub data
RUN apt-get update && apt-get install -y curl ffmpeg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /manim

# Copy scene files
COPY . .

# Default: just keep bash as entrypoint for flexibility
ENTRYPOINT ["/bin/bash", "-c"]
CMD ["node fetch-data.js && manim -qh solar_system.py GitHubSolarSystem"]