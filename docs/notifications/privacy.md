# Notification Privacy & Data Minimization

## 1. Principles of Notification Privacy

1. **No Full Entity Objects**: Templates receive strictly masked and minimized fields (`vehicleRegMasked`, `orderNumber`, `amountDisplay`). Full `User` or `EmergencyProfile` objects are strictly forbidden.
2. **Minimal Queue Payloads**: Only `intentId` is placed on the queue. Messages traversing Cloudflare infrastructure contain zero customer names, phone numbers, or emails.
3. **Redacting Logger**: The `NotificationLogger` automatically redacts keys like `otp`, `authKey`, `apiKey`, `password`, `medicalNotes`, `bloodGroup`, and `cvv`.
4. **Emergency Scan Alert Privacy**:
   - A QR scan alert must NEVER expose the finder's precise GPS, IP address, device fingerprints, or browser details to the vehicle owner unless explicitly authorized by law/product policy.
   - The alert copy states: "A VaahanSafe QR associated with your vehicle was scanned." It NEVER makes alarming or unverified claims such as "Your vehicle is in an accident."
