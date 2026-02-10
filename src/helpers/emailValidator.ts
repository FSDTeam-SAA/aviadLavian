export const emailValidator = (email: string | undefined) => {
  const allowedDomains = [
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "live.com",
    "aol.com",
    "icloud.com",
    "mail.com",
    "gmx.com",
    "zoho.com",
    "protonmail.com",
    "yandex.com",
    "fastmail.com",
    "inbox.com",
    "me.com",
    "msn.com",
    "verizon.net",
    "att.net",
    "sbcglobal.net",
    "bellsouth.net",
  ];

  const domain = email!.split("@")[1];
  if (!allowedDomains.includes(domain!)) {
    throw new Error("Invalid email domain. Allowed domains: " + allowedDomains);
  }
};
