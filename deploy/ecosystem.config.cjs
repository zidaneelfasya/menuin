module.exports = {
  apps: [
    {
      name: "menuin-web",
      cwd: "/var/www/menuin/apps/web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 2, // 2 vCPU worker cluster
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "650M", // Restart worker if memory exceeds 650MB
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "/var/log/menuin/err.log",
      out_file: "/var/log/menuin/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      combine_logs: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
  ],
};
