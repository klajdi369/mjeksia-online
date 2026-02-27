export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      showDevSettings: process.env.ENVIRONMENT === "dev",
    },
  };
};
