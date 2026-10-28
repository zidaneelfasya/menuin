#!/usr/bin/env bash
# ==============================================================================
# MENUIN Single-VPS Automated Provisioning Script
# Target: Ubuntu 22.04 / 24.04 LTS (2 vCPU / 4 GB RAM NVMe)
# Usage: sudo bash setup-vps.sh
# ==============================================================================

set -euo pipefail

echo "=========================================================="
echo " Starting MENUIN VPS Provisioning (2 vCPU / 4 GB RAM)"
echo "=========================================================="

# 1. Update OS Packages
echo ">>> [1/7] Updating apt repository..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git ufw htop fail2ban unzip build-essential

# 2. Configure 2 GB Swap File on NVMe
if [ ! -f /swapfile ]; then
    echo ">>> [2/7] Creating 2 GB NVMe Swap file..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    
    # Kernel tuning for memory caching
    sudo sysctl vm.swappiness=10
    sudo sysctl vm.vfs_cache_pressure=50
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf
else
    echo ">>> [2/7] Swap file already exists. Skipping."
fi

# 3. Configure Firewall (UFW)
echo ">>> [3/7] Configuring UFW Firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 4. Install Node.js 20 LTS & pnpm
if ! command -v node &> /dev/null; then
    echo ">>> [4/7] Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

echo ">>> Installing pnpm & PM2..."
sudo npm install -g pnpm pm2

# 5. Install PostgreSQL 16 & Nginx
echo ">>> [5/7] Installing Nginx & PostgreSQL 16..."
sudo apt install -y nginx postgresql postgresql-contrib certbot python3-certbot-nginx

# 6. Setup Application Directories & Logs
echo ">>> [6/7] Creating application and log directories..."
sudo mkdir -p /var/www/menuin
sudo mkdir -p /var/log/menuin
sudo chown -R $USER:$USER /var/www/menuin
sudo chown -R $USER:$USER /var/log/menuin

# 7. Final Instructions
echo "=========================================================="
echo " ✅ MENUIN Base VPS Provisioning Complete!"
echo "=========================================================="
echo ""
echo "Next Steps to deploy MENUIN:"
echo " 1. Clone repository to /var/www/menuin:"
echo "    git clone <YOUR_GIT_REPO> /var/www/menuin"
echo ""
echo " 2. Copy production environment file:"
echo "    cp /var/www/menuin/apps/web/.env.example /var/www/menuin/apps/web/.env.local"
echo ""
echo " 3. Install dependencies & build:"
echo "    cd /var/www/menuin && pnpm install && pnpm build"
echo ""
echo " 4. Apply database composite indexes:"
echo "    sudo -u postgres psql -d menuin_db -f /var/www/menuin/scripts/migrations/20261028_add_capacity_indexes.sql"
echo ""
echo " 5. Start application with PM2 cluster:"
echo "    pm2 start /var/www/menuin/deploy/ecosystem.config.cjs"
echo "    pm2 save && pm2 startup"
echo ""
echo " 6. Setup Nginx reverse proxy:"
echo "    sudo cp /var/www/menuin/deploy/nginx/menuin.conf /etc/nginx/sites-available/menuin"
echo "    sudo ln -s /etc/nginx/sites-available/menuin /etc/nginx/sites-enabled/"
echo "    sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo " 7. Issue SSL Certificate:"
echo "    sudo certbot --nginx -d menuin.id -d app.menuin.id"
echo "=========================================================="
