# Use the Bun image as the base image
FROM oven/bun:latest

# Install the dependencies
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y git

# Add Configurations
RUN git config --global user.email "docs-update@auto.com"
RUN git config --global user.name "Docs Update Bot"
RUN git config --global push.autoSetupRemote true

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . .

# Expose the port on which the API will listen
EXPOSE 3000

# Run the server when the container launches
CMD ["bun", "main.ts"]