# 🚀 SkillSwapConnect - Online Deployment Guide

## Overview
This guide will help you deploy SkillSwapConnect to production with TiDB Cloud database. We'll use **Railway** as the primary option (recommended) with **Render** as a backup.

---

## 📋 Prerequisites

### 1. TiDB Cloud Database Setup
1. **Create Account**: Sign up at [https://tidbcloud.com/](https://tidbcloud.com/)
2. **Create Cluster**: 
   - Choose "Serverless" (free tier) or "Dedicated" (paid)
   - Select your preferred region
   - Wait for cluster to be ready
3. **Get Connection String**:
   - Go to your cluster dashboard
   - Click "Connect" → "Standard Connection"
   - Copy the connection string (format below):
   ```
   mysql://[username].[cluster-id]:[password]@[host]:4000/[database]?ssl={"rejectUnauthorized":true}
   ```

### 2. Create Production Environment Variables
You'll need these values for deployment:
- `DATABASE_URL`: Your TiDB Cloud connection string
- `SESSION_SECRET`: A secure random string (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

---

## 🎯 Option 1: Railway Deployment (RECOMMENDED)

Railway offers the best experience with automatic deployments, free tier, and excellent performance.

### Step 1: Prepare for Railway
1. **Install Railway CLI**:
   ```powershell
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```powershell
   railway login
   ```

### Step 2: Deploy to Railway
1. **Initialize Railway Project**:
   ```powershell
   railway init
   ```
   - Choose "Create new project"
   - Enter project name: `skillswapconnect`

2. **Set Environment Variables**:
   ```powershell
   railway variables set DATABASE_URL="your-tidb-connection-string"
   railway variables set SESSION_SECRET="your-secure-session-secret"
   railway variables set NODE_ENV="production"
   ```

3. **Deploy**:
   ```powershell
   railway up
   ```

### Step 3: Custom Domain (Optional)
- Go to Railway dashboard
- Click on your project → Settings → Domains
- Add your custom domain or use the provided railway.app subdomain

---

## 🎯 Option 2: Render Deployment (BACKUP)

Render is another excellent free hosting platform.

### Step 1: Deploy to Render
1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/skillswapconnect.git
   git push -u origin main
   ```

2. **Create Render Service**:
   - Go to [https://render.com/](https://render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: skillswapconnect
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`

3. **Set Environment Variables**:
   - In Render dashboard → Environment
   - Add:
     - `DATABASE_URL`: Your TiDB Cloud connection string
     - `SESSION_SECRET`: Your secure session secret
     - `NODE_ENV`: production

---

## 🎯 Option 3: Vercel Deployment

### Step 1: Install Vercel CLI
```powershell
npm install -g vercel
```

### Step 2: Deploy
```powershell
vercel login
vercel
```

### Step 3: Set Environment Variables
- Go to Vercel dashboard
- Project Settings → Environment Variables
- Add your `DATABASE_URL` and `SESSION_SECRET`

---

## 🎯 Option 4: DigitalOcean App Platform

### Step 1: Create App
1. Go to DigitalOcean → Apps
2. Create App from GitHub repository
3. Configure:
   - **Resource Type**: Web Service
   - **Build Command**: `npm run build`
   - **Run Command**: `npm start`

### Step 2: Set Environment Variables
Add in App Settings → Environment Variables:
- `DATABASE_URL`
- `SESSION_SECRET`
- `NODE_ENV=production`

---

## 🔧 Post-Deployment Steps

### 1. Initialize Database Schema
After deployment, you need to create the database tables:

**For Railway/Render/Vercel:**
```bash
# The postbuild script will automatically run db:push after building
# This is configured in package.json
```

**Manual Database Setup (if needed):**
1. Connect to your TiDB Cloud console
2. Use Chat2Query or SQL Editor
3. Run: `CREATE DATABASE IF NOT EXISTS skillswap; USE skillswap;`

### 2. Test Your Deployment
1. Visit your deployed URL
2. Check health endpoint: `https://your-app-url.com/api/health`
3. Try creating a user account
4. Test core functionality

### 3. Monitor Your Application
- **Railway**: Check logs in Railway dashboard
- **Render**: View logs in Render dashboard  
- **Vercel**: Check function logs in Vercel dashboard

---

## 🔍 Troubleshooting

### Common Issues

#### 1. Database Connection Errors
- ✅ Verify your `DATABASE_URL` is correct
- ✅ Check TiDB Cloud cluster is running
- ✅ Ensure your deployment platform IP isn't blocked

#### 2. Build Failures
- ✅ Check Node.js version (should be 18+)
- ✅ Verify all dependencies are in package.json
- ✅ Check build logs for specific errors

#### 3. Environment Variables
- ✅ Ensure all required env vars are set
- ✅ Check for typos in variable names
- ✅ Verify values don't contain special characters that need escaping

#### 4. SSL/TLS Issues
- ✅ Ensure connection string includes `ssl={"rejectUnauthorized":true}`
- ✅ For development/testing, you can use `ssl={"rejectUnauthorized":false}`

### Debug Commands
```bash
# Check deployment logs
railway logs  # For Railway
# Or check platform-specific dashboards

# Test database connection locally
npm run db:push

# Test health endpoint
curl https://your-app-url.com/api/health
```

---

## 📊 Platform Comparison

| Platform | Free Tier | Custom Domain | Auto Deploy | Database | Ease of Use |
|----------|-----------|---------------|-------------|----------|-------------|
| **Railway** | ✅ $5/month credit | ✅ | ✅ | Bring own | ⭐⭐⭐⭐⭐ |
| **Render** | ✅ 750hrs/month | ✅ | ✅ | Bring own | ⭐⭐⭐⭐ |
| **Vercel** | ✅ Generous | ✅ | ✅ | Bring own | ⭐⭐⭐⭐ |
| **DigitalOcean** | ❌ $5/month | ✅ | ✅ | Optional | ⭐⭐⭐ |

---

## 🎉 Success! 

Once deployed, your SkillSwapConnect app will be live and accessible globally. The app includes:

- ✅ User authentication
- ✅ Skill sharing and discovery
- ✅ Real-time messaging
- ✅ Skill exchange system
- ✅ User ratings and reviews
- ✅ Responsive design for all devices

### Next Steps:
1. Set up monitoring and alerts
2. Configure domain and SSL
3. Set up CI/CD pipeline
4. Monitor performance and optimize
5. Plan for scaling as your user base grows

---

## 🆘 Need Help?

- **TiDB Cloud**: [https://docs.pingcap.com/tidbcloud/](https://docs.pingcap.com/tidbcloud/)
- **Railway**: [https://docs.railway.app/](https://docs.railway.app/)
- **Render**: [https://render.com/docs](https://render.com/docs)
- **Vercel**: [https://vercel.com/docs](https://vercel.com/docs)
