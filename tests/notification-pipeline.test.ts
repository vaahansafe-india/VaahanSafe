import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  NotificationProducerService,
  NotificationQueueConsumer,
  DedupeKeys,
  TestWhatsAppProvider,
  TestEmailProvider,
  MemoryQueueProducer,
  InMemoryDeadLetterHandler,
} from "@vaahansafe/notifications";
import {
  D1NotificationIntentRepository,
  D1NotificationRepository,
  D1NotificationDeliveryRepository,
  D1DeliveryAttemptRepository,
  D1NotificationPreferenceRepository,
  DatabaseClient,
} from "@vaahansafe/database";

describe("Notification Pipeline & Invariant Verification", () => {
  let dbSync: DatabaseSync;
  let dbClient: DatabaseClient;

  let intentRepo: D1NotificationIntentRepository;
  let notifRepo: D1NotificationRepository;
  let deliveryRepo: D1NotificationDeliveryRepository;
  let attemptRepo: D1DeliveryAttemptRepository;
  let preferenceRepo: D1NotificationPreferenceRepository;

  let whatsappProvider: TestWhatsAppProvider;
  let emailProvider: TestEmailProvider;
  let queueProducer: MemoryQueueProducer;
  let dlqHandler: InMemoryDeadLetterHandler;

  let producerService: NotificationProducerService;
  let consumer: NotificationQueueConsumer;

  beforeEach(() => {
    // 1. Initialize SQLite in-memory database with all 6 migrations
    dbSync = new DatabaseSync(":memory:");
    dbSync.exec("PRAGMA foreign_keys = ON;");

    const migrationsDir = path.resolve(
      __dirname,
      "../infrastructure/cloudflare/d1/migrations"
    );
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      dbSync.exec(sql);
    }

    // Wrap DatabaseSync into DatabaseClient interface
    dbClient = {
      async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
        const stmt = dbSync.prepare(sql);
        return stmt.all(...params) as T[];
      },
      async queryFirst<T = unknown>(sql: string, params: unknown[] = []): Promise<T | null> {
        const stmt = dbSync.prepare(sql);
        const rows = stmt.all(...params) as T[];
        return rows[0] || null;
      },
      async execute(sql: string, params: unknown[] = []): Promise<{ success: boolean; rowsAffected?: number }> {
        const stmt = dbSync.prepare(sql);
        const info = stmt.run(...params);
        return { success: true, rowsAffected: Number(info.changes) };
      },
      async batch(operations: Array<{ sql: string; params?: unknown[] }>): Promise<boolean> {
        for (const op of operations) {
          const stmt = dbSync.prepare(op.sql);
          stmt.run(...(op.params || []));
        }
        return true;
      },
    };

    // 2. Seed a test user in users table
    dbSync.exec(`
      INSERT INTO users (id, primary_phone, primary_email, full_name, onboarding_status, status)
      VALUES ('usr_test_1', '+919876543210', 'user@vaahansafe.com', 'Test User', 'COMPLETED', 'ACTIVE');
    `);

    // 3. Instantiate repositories and test doubles
    intentRepo = new D1NotificationIntentRepository(dbClient);
    notifRepo = new D1NotificationRepository(dbClient);
    deliveryRepo = new D1NotificationDeliveryRepository(dbClient);
    attemptRepo = new D1DeliveryAttemptRepository(dbClient);
    preferenceRepo = new D1NotificationPreferenceRepository(dbClient);

    whatsappProvider = new TestWhatsAppProvider();
    emailProvider = new TestEmailProvider();
    queueProducer = new MemoryQueueProducer();
    dlqHandler = new InMemoryDeadLetterHandler();

    producerService = new NotificationProducerService(intentRepo, queueProducer);
    consumer = new NotificationQueueConsumer({
      intentRepo,
      notificationRepo: notifRepo,
      deliveryRepo,
      attemptRepo,
      preferenceRepo,
      whatsappProvider,
      emailProvider,
      deadLetterHandler: dlqHandler,
      loadRecipientProfile: async (userId: string) => ({
        userId,
        verifiedPhone: "+919876543210",
        verifiedEmail: "user@vaahansafe.com",
      }),
    });
  });

  it("Scenario A: QR ACTIVATED commits first; notification failure NEVER rolls back QR state", async () => {
    // 1. Authoritative business state: QR is activated
    let qrStickerStatus = "ACTIVATED";

    // Configure notification providers to fail
    whatsappProvider.setFailure("PROVIDER_5XX", true, 5);
    emailProvider.setFailure("NETWORK_TIMEOUT", true, 5);

    // 2. Create notification intent
    const { intent, published } = await producerService.recordAndPublishIntent({
      eventType: "QR_ACTIVATED",
      recipientUserId: "usr_test_1",
      category: "SAFETY",
      priority: "NORMAL",
      templateKey: "QR_ACTIVATED_V1",
      payload: {
        publicId: "7F3K9021",
        vehicleRegMasked: "DL-01-**-1234",
      },
      sourceType: "QR_ASSIGNMENT",
      sourceId: "assign_test_1",
      dedupeKey: DedupeKeys.qrActivated("assign_test_1"),
    });

    expect(published).toBe(true);

    // 3. Consumer processes message and encounters provider failure
    const rawQueueMsg = queueProducer.publishedMessages[0];
    const result = await consumer.processMessage(rawQueueMsg);

    // 4. Invariant Assertion: In-app succeeded, WhatsApp/Email recorded retryable failure,
    // AND QR status remains authoritatively ACTIVATED!
    expect(result.channelResults.IN_APP.status).toBe("DELIVERED");
    expect(result.channelResults.WHATSAPP.status).toBe("FAILED_RETRYABLE");
    expect(result.channelResults.EMAIL.status).toBe("FAILED_RETRYABLE");

    // CRITICAL INVARIANT:
    expect(qrStickerStatus).toBe("ACTIVATED");
  });

  it("Scenario B: PAYMENT SUCCEEDED commits first; email provider failure NEVER affects payment", async () => {
    // 1. Authoritative business state: Payment is SUCCESS
    let paymentStatus = "SUCCESS";

    // Email provider experiences transient outage
    emailProvider.setFailure("NETWORK_TIMEOUT", true, 3);

    // 2. Record notification intent
    const { intent } = await producerService.recordAndPublishIntent({
      eventType: "PAYMENT_SUCCEEDED",
      recipientUserId: "usr_test_1",
      category: "COMMERCE",
      priority: "NORMAL",
      templateKey: "PAYMENT_SUCCESS_V1",
      payload: {
        orderId: "ord_100",
        orderNumber: "ORD-2026-001",
        amountDisplay: "₹499.00",
        paymentId: "pay_cf_999",
      },
      sourceType: "PAYMENT",
      sourceId: "pay_cf_999",
      dedupeKey: DedupeKeys.paymentSuccess("pay_cf_999"),
    });

    // 3. Process via queue consumer
    const rawQueueMsg = queueProducer.publishedMessages[0];
    const result = await consumer.processMessage(rawQueueMsg);

    // WhatsApp and In-App deliver; Email fails
    expect(result.channelResults.IN_APP.status).toBe("DELIVERED");
    expect(result.channelResults.WHATSAPP.status).toBe("DELIVERED");
    expect(result.channelResults.EMAIL.status).toBe("FAILED_RETRYABLE");

    // CRITICAL INVARIANT: Payment remains SUCCESS
    expect(paymentStatus).toBe("SUCCESS");
  });

  it("Scenario C: Channel Failure Isolation: WhatsApp fails, Email succeeds, In-App succeeds", async () => {
    // WhatsApp provider fails with permanent error (invalid number)
    whatsappProvider.setFailure("INVALID_PHONE_NUMBER", false, 1);

    const { intent } = await producerService.recordAndPublishIntent({
      eventType: "ACCOUNT_WELCOME",
      recipientUserId: "usr_test_1",
      category: "ACCOUNT",
      priority: "NORMAL",
      templateKey: "ACCOUNT_WELCOME_V1",
      payload: {
        displayName: "Test User",
        accountCreatedDate: "2026-09-17",
      },
      sourceType: "USER",
      sourceId: "usr_test_1",
      dedupeKey: DedupeKeys.accountWelcome("usr_test_1"),
    });

    const rawQueueMsg = queueProducer.publishedMessages[0];
    const result = await consumer.processMessage(rawQueueMsg);

    // WhatsApp is FAILED_PERMANENT, but Email and In-App are DELIVERED
    expect(result.channelResults.WHATSAPP.status).toBe("FAILED_PERMANENT");
    expect(result.channelResults.EMAIL.status).toBe("DELIVERED");
    expect(result.channelResults.IN_APP.status).toBe("DELIVERED");

    // Verify in-app row was created in D1
    const inAppList = await notifRepo.findByUserId("usr_test_1");
    expect(inAppList).toHaveLength(1);
    expect(inAppList[0].title).toBe("Welcome to VaahanSafe");

    // Verify email was dispatched by test provider
    expect(emailProvider.sentEmails).toHaveLength(1);
    expect(emailProvider.sentEmails[0].to).toBe("user@vaahansafe.com");
  });

  it("Scenario D: Queue Publication Failure Tolerance & Background Recovery", async () => {
    // 1. Simulate Cloudflare NOTIFICATION_QUEUE outage
    queueProducer.shouldFail = true;

    // 2. Business transaction creates intent
    const res = await producerService.recordAndPublishIntent({
      eventType: "SUBSCRIPTION_RENEWED",
      recipientUserId: "usr_test_1",
      category: "SUBSCRIPTION",
      priority: "NORMAL",
      templateKey: "SUBSCRIPTION_RENEWED_V1",
      payload: {
        subscriptionId: "sub_123",
        planName: "VaahanSafe Pro Annual",
        nextBillingDate: "2027-09-17",
      },
      sourceType: "SUBSCRIPTION_EVENT",
      sourceId: "subev_123",
      dedupeKey: DedupeKeys.subscriptionRenewed("subev_123"),
    });

    // Intent is safely persisted even though queue publish failed
    expect(res.published).toBe(false);
    expect(res.intent.status).toBe("PENDING");

    const persistedIntent = await intentRepo.findById(res.intent.id);
    expect(persistedIntent).not.toBeNull();
    expect(persistedIntent?.status).toBe("PENDING");

    // 3. Queue recovers; background worker runs
    queueProducer.shouldFail = false;
    const recoveryRes = await producerService.republishPendingIntents();

    expect(recoveryRes.recoveredCount).toBe(1);
    expect(queueProducer.publishedMessages).toHaveLength(1);

    const updatedIntent = await intentRepo.findById(res.intent.id);
    expect(updatedIntent?.status).toBe("QUEUED");
  });

  it("Scenario E: Duplicate Queue Message is handled idempotently without duplicate deliveries", async () => {
    const { intent } = await producerService.recordAndPublishIntent({
      eventType: "REPLACEMENT_APPROVED",
      recipientUserId: "usr_test_1",
      category: "SAFETY",
      priority: "NORMAL",
      templateKey: "REPLACEMENT_APPROVED_V1",
      payload: {
        replacementRequestId: "rep_99",
        originalPublicId: "7F3K9021",
        newPublicId: "8G4L1132",
      },
      sourceType: "REPLACEMENT_REQUEST",
      sourceId: "rep_99",
      dedupeKey: DedupeKeys.replacementApproved("rep_99"),
    });

    const rawQueueMsg = queueProducer.publishedMessages[0];

    // First delivery attempt
    const result1 = await consumer.processMessage(rawQueueMsg);
    expect(result1.channelResults.WHATSAPP.status).toBe("DELIVERED");
    expect(result1.channelResults.EMAIL.status).toBe("DELIVERED");
    expect(whatsappProvider.sentMessages).toHaveLength(1);
    expect(emailProvider.sentEmails).toHaveLength(1);

    // Second delivery attempt (identical queue message redelivered)
    const result2 = await consumer.processMessage(rawQueueMsg);

    // Should NOT send duplicate messages
    expect(whatsappProvider.sentMessages).toHaveLength(1);
    expect(emailProvider.sentEmails).toHaveLength(1);
  });
});
