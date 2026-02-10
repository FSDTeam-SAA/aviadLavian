// import redis from "../config/redis";
// import jwt from "jsonwebtoken";

// export const redisTokenService = {
//   /**
//    * Blacklist an access token
//    * @param token - The access token to blacklist
//    */
//   async blacklistToken(token: string): Promise<void> {
//     try {
//       // Decode token to get expiry time (without verifying, since it might be called during logout)
//       const decoded = jwt.decode(token) as jwt.JwtPayload;

//       if (!decoded || !decoded.exp) {
//         throw new Error("Invalid token format");
//       }

//       // Calculate remaining TTL (time to live) in seconds
//       const currentTime = Math.floor(Date.now() / 1000);
//       const ttl = decoded.exp - currentTime;

//       // Only blacklist if token hasn't expired yet
//       if (ttl > 0) {
//         // Store token in Redis with key prefix "blacklist:"
//         await redis.setex(`blacklist:${token}`, ttl, "revoked");
//       }
//     } catch (error) {
//       console.error("Error blacklisting token:", error);
//       throw error;
//     }
//   },

//   /**
//    * Check if a token is blacklisted
//    * @param token - The access token to check
//    * @returns true if blacklisted, false otherwise
//    */
//   async isTokenBlacklisted(token: string): Promise<boolean> {
//     try {
//       const result = await redis.get(`blacklist:${token}`);
//       return result !== null;
//     } catch (error) {
//       console.error("Error checking token blacklist:", error);
//       // In case of Redis error, allow the request to proceed
//       // (fail open) but log the error
//       return false;
//     }
//   },

//   /**
//    * Remove a token from blacklist (optional - mainly for testing)
//    * @param token - The access token to remove from blacklist
//    */
//   async removeFromBlacklist(token: string): Promise<void> {
//     try {
//       await redis.del(`blacklist:${token}`);
//     } catch (error) {
//       console.error("Error removing token from blacklist:", error);
//       throw error;
//     }
//   },
// };
