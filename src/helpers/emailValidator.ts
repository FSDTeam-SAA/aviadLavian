export const emailValidator = (email: string | undefined) => {
  const allowedDomains = [
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "icloud.com",
  ];

  const domain = email!.split("@")[1];
  if (!allowedDomains.includes(domain!)) {
    throw new Error("Invalid email domain. Allowed domains: " + allowedDomains);
  }
};
