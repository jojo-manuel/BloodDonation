# Deployment Guide - Blood Bank Management System

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB disk space

## Quick Start

### 1. Clone and Navigate
```bash
cd blood-system
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Edit `.env`:
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMS_API_KEY=your-sms-api-key
```

### 3. Start Core Services

```bash
docker-compose up -d
```

This starts:
- API Gateway (port 3000)
- Auth Service (port 3001)
- Donor Service (port 3002)
- Inventory Service (port 3003)
- Request Service (port 3004)
- MongoDB instances for each service

### 4. Start with Optional Services

```bash
docker-compose --profile optional up -d
```

This additionally starts:
- Notification Service (port 3005)
- IoT Service (port 3006)
- Ledger Service (port 3007)

### 5. Verify Services

```bash
# Check all containers are running
docker-compose ps

# Check gateway health
curl http://localhost:3000/health

# Check individual services
curl http://localhost:3001/health  # Auth
curl http://localhost:3002/health  # Donor
curl http://localhost:3003/health  # Inventory
curl http://localhost:3004/health  # Request
```

## Production Deployment

### Security Checklist

1. **Change JWT Secret**
   ```env
   JWT_SECRET=$(openssl rand -base64 32)
   ```

2. **Use Strong MongoDB Passwords**
   - Update docker-compose.yml to add authentication
   - Set MONGO_INITDB_ROOT_USERNAME and MONGO_INITDB_ROOT_PASSWORD

3. **Enable HTTPS**
   - Use reverse proxy (nginx/traefik)
   - Configure SSL certificates (Let's Encrypt)

4. **Environment Variables**
   - Never commit .env files
   - Use secrets management (Docker Secrets, Vault)

5. **Network Security**
   - Expose only gateway port (3000) to public
   - Keep service ports internal
   - Use firewall rules

### Reverse Proxy Setup (Nginx)

```nginx
server {
    listen 80;
    server_name bloodbank.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Docker Compose Production Override

Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  gateway:
    restart: always
    environment:
      - NODE_ENV=production
    
  auth:
    restart: always
    environment:
      - NODE_ENV=production
    
  # ... repeat for all services
```

Deploy:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Scaling

### Horizontal Scaling

Scale specific services:
```bash
docker-compose up -d --scale request=3
docker-compose up -d --scale inventory=2
```

### Load Balancing

Use nginx or traefik for load balancing:
```yaml
# docker-compose.lb.yml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - gateway
```

## Monitoring

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f gateway

# Last 100 lines
docker-compose logs --tail=100 auth
```

### Health Checks

All services have built-in health checks:
```bash
docker inspect --format='{{json .State.Health}}' blood-gateway
```

### Monitoring Stack (Optional)

Add Prometheus + Grafana:
```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    depends_on:
      - prometheus
```

## Backup & Recovery

### Database Backup

```bash
# Backup all MongoDB databases
docker exec blood-auth-db mongodump --out /backup
docker exec blood-donor-db mongodump --out /backup
docker exec blood-inventory-db mongodump --out /backup
docker exec blood-request-db mongodump --out /backup

# Copy backups to host
docker cp blood-auth-db:/backup ./backups/auth
docker cp blood-donor-db:/backup ./backups/donor
docker cp blood-inventory-db:/backup ./backups/inventory
docker cp blood-request-db:/backup ./backups/request
```

### Automated Backup Script

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/$DATE"

mkdir -p $BACKUP_DIR

docker exec blood-auth-db mongodump --out /backup
docker cp blood-auth-db:/backup $BACKUP_DIR/auth

docker exec blood-donor-db mongodump --out /backup
docker cp blood-donor-db:/backup $BACKUP_DIR/donor

docker exec blood-inventory-db mongodump --out /backup
docker cp blood-inventory-db:/backup $BACKUP_DIR/inventory

docker exec blood-request-db mongodump --out /backup
docker cp blood-request-db:/backup $BACKUP_DIR/request

echo "Backup completed: $BACKUP_DIR"
```

### Restore

```bash
# Restore from backup
docker cp ./backups/20241215/auth blood-auth-db:/restore
docker exec blood-auth-db mongorestore /restore
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Rebuild images
docker-compose build --no-cache

# Remove volumes and restart
docker-compose down -v
docker-compose up -d
```

### Database Connection Issues

```bash
# Check MongoDB containers
docker-compose ps | grep db

# Test connection
docker exec -it blood-auth-db mongosh
```

### Port Conflicts

```bash
# Check what's using port 3000
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Linux/Mac

# Change ports in docker-compose.yml
```

### Memory Issues

```bash
# Check resource usage
docker stats

# Limit memory per service in docker-compose.yml
services:
  gateway:
    mem_limit: 512m
```

## Maintenance

### Update Services

```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d
```

### Clean Up

```bash
# Remove stopped containers
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Clean unused images
docker image prune -a
```

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /app/blood-system
            git pull
            docker-compose down
            docker-compose up -d --build
```

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review API documentation: `API_DOCUMENTATION.md`
- Check service health: `curl http://localhost:3000/health`

---

**Production Checklist:**
- [ ] Changed JWT_SECRET
- [ ] Configured MongoDB authentication
- [ ] Set up HTTPS/SSL
- [ ] Configured firewall
- [ ] Set up monitoring
- [ ] Configured automated backups
- [ ] Tested disaster recovery
- [ ] Set up logging aggregation
- [ ] Configured rate limiting
- [ ] Reviewed security headers
