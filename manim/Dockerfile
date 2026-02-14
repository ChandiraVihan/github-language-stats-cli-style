FROM manimcommunity/manim:v0.18.0

# Install Node.js for fetching GitHub data
RUN apt-get update && apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs

WORKDIR /manim

# Copy scene files
COPY . .

# Default: render the scene
ENTRYPOINT ["manim"]
CMD ["-qh", "solar_system.py", "GitHubSolarSystem", "-o", "stats.gif"]