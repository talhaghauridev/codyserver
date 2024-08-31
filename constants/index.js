const UserRoles = Object.freeze({
  ADMIN: "ADMIN",
  USER: "USER",
  INSTRUCTOR: "INSTRUCTOR",
});

const LoginProviders = Object.freeze({
  EMAIL_PASSWORD: "EMAIL_PASSWORD",
  GOOGLE: "GOOGLE",
  FACEBOOK: "FACEBOOK",
  GITHUB: "GITHUB",
});

const OtpPorposes = Object.freeze({
  VERFICATIION: "VERFICATIION",
  PASSWORD_RESET: "PASSWORD_RESET",
});

const AvailableOtpPurposes = Object.freeze(Object.values(OtpPorposes));
const AvailableUserRoles = Object.freeze(Object.values(UserRoles));
const AvailableLoginProviders = Object.freeze(Object.values(LoginProviders));

const isValidUserRole = (role) => AvailableUserRoles.includes(role);
const isValidLoginProvider = (provider) =>
  AvailableLoginProviders.includes(provider);

module.exports = {
  UserRoles,
  LoginProviders,
  OtpPorposes,
  AvailableUserRoles,
  AvailableLoginProviders,
  AvailableOtpPurposes,
  isValidUserRole,
  isValidLoginProvider,
};
