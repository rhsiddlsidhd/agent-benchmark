module.exports = {
  ci: {
    collect: {
      startServerCommand: "cd new_invitation && npm run start",
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/products?category=invitation",
        "http://localhost:3000/reviews",
      ],
      numberOfRuns: 3,
    },
    assert: {
      preset: "lighthouse:recommended",
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
