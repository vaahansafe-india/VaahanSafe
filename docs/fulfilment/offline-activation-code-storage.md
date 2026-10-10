Offline batch activation codes are generated once by the authenticated admin service.
Each sticker gets a unique 16-character private code. Existing salted PBKDF2 v1
verification hashes are stored in `qr_activation_secrets` and the canonical
`qr_stickers.activation_secret_hash` column. Provisioning leaves all stickers in
`INVENTORY`, without owner bindings or service entitlements.

The original codes are preserved only in an AES-256-GCM encrypted manufacturing
manifest in the existing private Cloudflare R2 bucket. The service checks that
public access and custom domains are disabled, uploads the encrypted object,
downloads and decrypts it for verification, then atomically commits the hashes,
export metadata and an audit event. Retrying does not replace existing codes.
Plaintext codes and hashes are never returned by the customer or admin JSON APIs.

`ACTIVATION_EXPORT_ENCRYPTION_KEY_V1` is a dedicated 256-bit server-only key in the
ignored admin environment files. Back it up securely and include it when deploying
the admin server. Do not rotate or remove it while v1 manufacturing manifests are
needed. `QR_ACTIVATION_EXPORT_BUCKET` selects the already configured private R2
bucket; it must never point to a public assets bucket.

Package printing must use a trusted server-side manufacturing process to decrypt
the manifest, pair each code with its original batch serial, and print it inside
sealed packaging or under a scratch panel. Never put the code in the public QR,
resolver URL, public exports, logs, browser state, or customer profile.
