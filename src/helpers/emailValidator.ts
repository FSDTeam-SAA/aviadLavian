import disposableDomains from "disposable-email-domains";
import CustomError from "./CustomError";

export const emailValidator = {
  /**
   * Check if email is from a disposable email provider
   * @param email - Email address to check
   * @returns true if disposable, false otherwise
   */
  isDisposableEmail(email: string): boolean {
    const domain = email.split("@")[1]?.toLowerCase();

    if (!domain) {
      return false;
    }
    // console.log(disposableDomains);
    return disposableDomains.includes(domain);
  },

  /**
   * Validate email is not disposable (throws error if it is)
   * @param email - Email address to validate
   */
  validateNotDisposable(email: string): void {
    if (this.isDisposableEmail(email)) {
      throw new CustomError(
        400,
        "Disposable email addresses are not allowed. Please use a valid email address.",
      );
    }
  },
};
