export const enviroment = {
  version: {
    tag: "v0.4.0", //this string has to match the release tag name when released
    production: true, //set to true in release version
  },
  port: 3001,
  skipGenerateGcode: false,
  removeBGSettings: {
    enableApi: true,
    type: "person",
    scale: "original",
  },
};
