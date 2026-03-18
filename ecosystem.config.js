module.exports = {
  apps: [
    {
      name: 'ddalkkak-server',
      cwd: './server',
      script: 'dist/index.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        TZ: 'Asia/Seoul',
      },
      max_memory_restart: '512M',
      instances: 1,
      autorestart: true,
    },
  ],
};
