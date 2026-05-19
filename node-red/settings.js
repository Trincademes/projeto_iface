module.exports = {
  uiPort: Number(process.env.NODE_RED_PORT || 1880),
  userDir: __dirname,
  flowFile: "file.json",
  credentialSecret: false,
  httpAdminRoot: "/",
  httpNodeRoot: "/api",
  functionExternalModules: false,
  logging: {
    console: {
      level: "info",
      metrics: false,
      audit: false,
    },
  },
  editorTheme: {
    projects: {
      enabled: false,
    },
  },
};
