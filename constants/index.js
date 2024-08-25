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

const AvailableUserRoles = Object.freeze(Object.values(UserRoles));
const AvailableLoginProviders = Object.freeze(Object.values(LoginProviders));

const isValidUserRole = (role) => AvailableUserRoles.includes(role);
const isValidLoginProvider = (provider) =>
  AvailableLoginProviders.includes(provider);

module.exports = {
  UserRoles,
  LoginProviders,
  AvailableUserRoles,
  AvailableLoginProviders,
  isValidUserRole,
  isValidLoginProvider,
};
