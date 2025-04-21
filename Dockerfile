# Use an official Python runtime as the base image
FROM gcr.io/distroless/python3-debian11

# Set the working directory in the container
WORKDIR /app

# Copy all project files to the container
COPY . .

# Install Python dependencies
RUN pip install requests pandas

# Install a simple HTTP server to serve your files
RUN apt-get update && apt-get install -y python3-httpie

# Expose port 8000 for the web server
EXPOSE 8000

# Command to run when the container starts
CMD ["python3", "-m", "http.server", "8000"]