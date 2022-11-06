# EC Rate Limiting Nullifier

This is a simple rate limiting nullifier mechanism using Shamir Secret Sharing and an elliptic curve pairings.

Using this scheme, you don't need to generate zkp for every signaling. 
You can use ZKP only when you create a session and then send Elliptic Curve points instead of ZKP. 
This is much faster than and also pretty affordable for consensus layer too.

For more information, 
https://github.com/rate-limiting-nullifier
