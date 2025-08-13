
// Values passed in via the `DefinePlugin` (see webpack config)
declare const DEFINE_PUBLIC_PATH: string | null;
declare const DEFINE_SETTINGS_PATH: string | null;
declare const DEFINE_BUILD_DATE: string | null;
declare const DEFINE_COMMIT_SHA: string | null;

export const DEFINES = {
  publicPath: DEFINE_PUBLIC_PATH ?? "/",
  settingsPath: DEFINE_SETTINGS_PATH,
  buildDate: DEFINE_BUILD_DATE,
  commitSha: DEFINE_COMMIT_SHA,
};
