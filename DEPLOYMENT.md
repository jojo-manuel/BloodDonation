# Deployment Guide

This project is configured for deployment using **Docker**. It works seamlessly with **Render** for production hosting and can also be run locally for testing.

## 1. Automated Deployment (Render)

The project is set up with a `render.yaml` Blueprint file, which automates the deployment process.

**To trigger a new deployment:**
1.  Make your changes to the code.
2.  Commit your changes:
    ```bash
    git add .
    git commit -m "Description of changes"
    ```
3.  Push to the `main` branch:
    ```bash
    git push origin main
    ```

Render will automatically detect the push, build the Docker image, and deploy the new version.

## 2. Local Docker Deployment (Manual)

To build and run the application locally using Docker:

**Prerequisites:**
-   Ensure [Docker Desktop](https://www.docker.com/products/docker-desktop/) is installed and running.

**Steps:**

1.  **Build the Docker Image:**
    Run this command from the root directory (`d:\BloodDonation`):
    ```bash
    docker build -t blood-donation-app .
    ```

2.  **Run the Container:**
    ```bash
    docker run -p 5000:5000 -e PORT=5000 -e NODE_ENV=production --env-file backend/.env blood-donation-app
    ```
    *Note: The `--env-file backend/.env` flag injects your local environment variables into the container.*

3.  **Access the Application:**
    Open [http://localhost:5000](http://localhost:5000) in your browser.

## 3. Environment Variables

Ensure your production environment (Render) has the same environment variables defined as your local `.env`. See `render.yaml` for the list of expected variables.
