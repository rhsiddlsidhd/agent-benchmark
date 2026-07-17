module.exports = {
  ci: {
    collect: {
      startServerCommand: "cd new_invitation && npm run start",
      url: [
        "http://localhost:3000/admin/dashboard",
        "http://localhost:3000/admin/orders",
        "http://localhost:3000/admin/premium-features",
        "http://localhost:3000/admin/products",
        "http://localhost:3000/admin/settings",
        "http://localhost:3000/admin/users",
      ],
      numberOfRuns: 3,
      puppeteerScript: "new_invitation/lighthouse/login.js",
      puppeteerLaunchOptions: {
        headless: true,
        args: ["--no-sandbox"],
      },
    },
    assert: {
      preset: "lighthouse:recommended",
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
