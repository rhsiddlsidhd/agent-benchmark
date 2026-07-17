module.exports = {
  ci: {
    collect: {
      startServerCommand: "cd new_invitation && npm run start",
      url: [
        "http://localhost:3000/profile",
        "http://localhost:3000/order",
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
