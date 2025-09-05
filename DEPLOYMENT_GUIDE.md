# SkillSwapConnect - TiDB Cloud Deployment Guide

## Overview

This guide will help you deploy SkillSwapConnect with TiDB Cloud as your database backend. The application has been configured to work with TiDB Cloud's MySQL-compatible database.

## Prerequisites

1. **TiDB Cloud Account**: Sign up at [https://tidbcloud.com/](https://tidbcloud.com/)
2. **Node.js 18+** installed locally
3. **Git** for version control

## Step 1: Set Up TiDB Cloud Database

### Create a TiDB Cluster
1. Log in to TiDB Cloud Console
2. Click "Create Cluster"
3. Choose your preferred configuration:
   - **Serverless Tier** (Free): Good for development/testing
   - **Dedicated Tier** (Paid): Better for production

### Get Connection Details
1. Once your cluster is created, go to "Connect"
2. Choose "Standard Connection"
3. Copy the connection string format:
   ```
   mysql://[username].[cluster-id]:[password]@[host]:[port]/[database]?ssl={"rejectUnauthorized":true}
   ```

### Create Database Tables
1. In TiDB Cloud Console, go to "Chat2Query" or use the SQL Editor
2. Create your database:
   ```sql
   CREATE DATABASE IF NOT EXISTS skillswap;
   USE skillswap;
   ```

## Step 2: Configure Environment Variables

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your TiDB Cloud credentials:
   ```env
   DATABASE_URL=mysql://your_username:your_password@your_host:4000/skillswap?ssl={"rejectUnauthorized":true}
   SESSION_SECRET=your-secure-random-string-here
   NODE_ENV=production
   PORT=3000
   ```

## Step 3: Set Up Database Schema

Run the database migration to create all tables:

```bash
npm run db:push
```

This will create all the necessary tables in your TiDB Cloud database.

## Step 4: Deploy Your Application

### Option A: Deploy to Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Set environment variables in Vercel Dashboard:
   - Go to your project settings
   - Add environment variables:
     - `DATABASE_URL`: Your TiDB Cloud connection string
     - `SESSION_SECRET`: A secure random string

### Option B: Deploy to Railway

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login and deploy:
   ```bash
   railway login
   railway init
   railway up
   ```

3. Set environment variables:
   ```bash
   railway variables set DATABASE_URL="your_tidb_connection_string"
   railway variables set SESSION_SECRET="your_secure_secret"
   ```

### Option C: Deploy with Docker

1. Build the Docker image:
   ```bash
   docker build -t skillswapconnect .
   ```

2. Run the container:
   ```bash
   docker run -e DATABASE_URL="your_connection_string" -e SESSION_SECRET="your_secret" -p 3000:3000 skillswapconnect
   ```

### Option D: Deploy to Any Platform

1. Build the application:
   ```bash
   npm run build
   ```

2. The built files will be in the `dist/` directory
3. Upload these files to your hosting platform
4. Set the environment variables on your platform
5. Run `npm start` or `node dist/index.js`

## Step 5: Verify Deployment

1. Visit your deployed application URL
2. Check that the application loads correctly
3. Try creating a user account to test database connectivity
4. Monitor the application logs for any errors

## Database Management

### View Data
- Use TiDB Cloud Console's "Chat2Query" feature
- Connect with any MySQL-compatible client using your connection string

### Backup
- TiDB Cloud automatically handles backups
- You can create manual backups from the Console

### Scaling
- Serverless tier auto-scales
- Dedicated tier can be scaled through the Console

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Verify your connection string is correct
   - Check if your deployment platform's IP is whitelisted in TiDB Cloud

2. **SSL Certificate Issues**
   - Ensure `ssl={"rejectUnauthorized":true}` is in your connection string
   - For development, you can use `ssl={"rejectUnauthorized":false}`

3. **Schema Errors**
   - Run `npm run db:push` to update database schema
   - Check TiDB Cloud Console for table creation status

4. **Environment Variables**
   - Verify all required env vars are set on your deployment platform
   - Check env var names match exactly (case-sensitive)

### Connection String Format Examples

```bash
# TiDB Cloud Serverless
DATABASE_URL="mysql://username.clusterId.tidbcloud.com:password@gateway01.region.prod.aws.tidbcloud.com:4000/skillswap?ssl={\"rejectUnauthorized\":true}"

# TiDB Cloud Dedicated
DATABASE_URL="mysql://root:password@tidb.cluster-id.region.tidbcloud.com:4000/skillswap?ssl={\"rejectUnauthorized\":true}"
```

## Performance Optimization

1. **Connection Pooling**: Already configured with mysql2 connection pool
2. **SSL Configuration**: Optimized for TiDB Cloud
3. **Query Optimization**: Use TiDB Cloud's query analyzer to identify slow queries

## Security Best Practices

1. Use strong, unique passwords for database users
2. Restrict database access to your application's IP addresses
3. Keep your TiDB Cloud credentials secure and rotate them regularly
4. Use environment variables for all sensitive configuration
5. Enable TiDB Cloud's audit logging for production

## Support

- **TiDB Cloud Documentation**: [https://docs.pingcap.com/tidbcloud/](https://docs.pingcap.com/tidbcloud/)
- **TiDB Community**: [https://ask.pingcap.com/](https://ask.pingcap.com/)
- **Application Issues**: Check the application logs and database connectivity

## Next Steps

1. Set up monitoring and alerting
2. Configure automatic backups
3. Set up CI/CD pipeline for automatic deployments
4. Monitor database performance and optimize queries
5. Consider setting up a staging environment
