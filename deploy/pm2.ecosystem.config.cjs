/**
 * PM2 ecosystem for server34 — separate from ai-helper / HJU-IR processes.
 * Adjust cwd / PORT after placing the folder on the server.
 */
module.exports = {
  apps: [
    {
      name: "hju-websight-monitor",
      cwd: "/opt/hju/hju-websight-monitor", // UPDATE if campus path differs
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3040",
      env: {
        NODE_ENV: "production",
        PORT: "3040",
        // Load secrets from ecosystem.local or systemd EnvironmentFile — do not commit
      },
      max_restarts: 10,
      time: true,
    },
  ],
};
