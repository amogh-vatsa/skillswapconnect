# Manual Docker Deployment Commands

## Prerequisites
1. Install Docker Desktop for Windows
2. Ensure Docker Desktop is running (whale icon in system tray)
3. Configure your .env file with TiDB Cloud credentials

## Step-by-Step Commands

### 1. Build the Docker Image
```powershell
docker build -t skillswapconnect:latest .
```

### 2. Run the Container
```powershell
docker run -d --name skillswapconnect --env-file .env -p 3000:3000 --restart unless-stopped skillswapconnect:latest
```

### 3. Check Container Status
```powershell
docker ps
```

### 4. View Application Logs
```powershell
docker logs skillswapconnect
```

### 5. Access Your Application
Open browser and go to: http://localhost:3000

## Container Management Commands

### Stop the container
```powershell
docker stop skillswapconnect
```

### Start the container
```powershell
docker start skillswapconnect
```

### Remove the container
```powershell
docker stop skillswapconnect
docker rm skillswapconnect
```

### Remove the image
```powershell
docker rmi skillswapconnect:latest
```

### View container logs (live)
```powershell
docker logs -f skillswapconnect
```

### Execute commands inside the container
```powershell
docker exec -it skillswapconnect /bin/sh
```

## Automated Deployment Script

For easier deployment, use the automated script:
```powershell
./deploy-docker.ps1
```

## Troubleshooting

If you encounter issues:
1. Check Docker Desktop is running
2. Verify your .env file has correct TiDB Cloud credentials
3. Check container logs: `docker logs skillswapconnect`
4. Ensure port 3000 is not being used by another application
