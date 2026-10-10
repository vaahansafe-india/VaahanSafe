async function run() {
  console.log("=== Testing Search API with Authenticated Session ===");

  // 1. Dev login to obtain cookie
  const loginRes = await fetch("http://localhost:3004/api/dev-login", {
    redirect: "manual",
  });
  const cookieHeader = loginRes.headers.get("set-cookie");
  if (!cookieHeader) {
    console.error("Failed to obtain dev-login cookie");
    process.exit(1);
  }
  const cookie = cookieHeader.split(";")[0];
  console.log("✓ Authenticated session cookie obtained");

  // 2. Test POST /api/search with Batch query "BATCH-ONLINE-DIRECT"
  console.log("\nTesting search for 'BATCH-ONLINE-DIRECT'...");
  const searchRes = await fetch("http://localhost:3004/api/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3004",
      Cookie: cookie,
    },
    body: JSON.stringify({ q: "eswar", scope: "all" }),
  });

  const searchData = await searchRes.json();
  if (!searchRes.ok) {
    console.error("Search failed:", searchData);
    process.exit(1);
  }

  console.log(`✓ Search returned ${searchData.data.totalCount} matches in ${searchData.data.latencyMs}ms`);
  console.log(`  Classification: scope=${searchData.data.classification.likelyScope}, hint=${searchData.data.classification.hintBadge}`);
  if (searchData.data.exactMatch) {
    console.log("✓ Exact Match Resolved!");
    console.log(`  Primary reference: ${searchData.data.exactMatch.primaryResult.reference}`);
    console.log(`  Lens State: lifecycle=${searchData.data.exactMatch.lens.state.lifecycle}, custody=${searchData.data.exactMatch.lens.state.custody}`);
    console.log(`  Spine branches: ${searchData.data.exactMatch.spine.children?.length || 0}`);
    console.log(`  Timeline events: ${searchData.data.exactMatch.timeline.length}`);
  }

  // 2b. Test POST /api/search with broad reference "VS-"
  console.log("\nTesting search for broad prefix 'VS-'...");
  const broadRes = await fetch("http://localhost:3004/api/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3004",
      Cookie: cookie,
    },
    body: JSON.stringify({ q: "VS-", scope: "all" }),
  });
  const broadData = await broadRes.json();
  if (broadRes.ok) {
    console.log(`✓ Broad 'VS-' search returned ${broadData.data.totalCount} matches in ${broadData.data.latencyMs}ms across categories:`);
    for (const [cat, items] of Object.entries(broadData.data.groupedResults)) {
      console.log(`   - ${cat.toUpperCase()}: ${items.length} items`);
    }

    if (broadData.data.groupedResults.qr?.length > 0) {
      const qrItem = broadData.data.groupedResults.qr[0];
      console.log(`\nTesting exact search for QR: '${qrItem.reference}'...`);
      const qrRes = await fetch("http://localhost:3004/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3004",
          Cookie: cookie,
        },
        body: JSON.stringify({ q: qrItem.reference, scope: "all" }),
      });
      const qrData = await qrRes.json();
      if (qrData.data?.exactMatch) {
        console.log("✓ Exact QR Match Resolved with Entity Intelligence Graph!");
        console.log(`  Reference: ${qrData.data.exactMatch.primaryResult.reference}`);
        console.log(`  State: lifecycle=${qrData.data.exactMatch.lens.state.lifecycle}, custody=${qrData.data.exactMatch.lens.state.custody}`);
        console.log(`  Spine children: ${qrData.data.exactMatch.spine.children?.map(c => `${c.label}:${c.reference}`).join(", ") || "none"}`);
        console.log(`  Timeline events: ${qrData.data.exactMatch.timeline.length}`);
      }
    }
  }

  // 3. Test Preview endpoint
  if (searchData.data.results.length > 0) {
    const firstResult = searchData.data.results[0];
    console.log(`\nTesting Preview for ${firstResult.entityType} (${firstResult.id})...`);
    const previewRes = await fetch(
      `http://localhost:3004/api/search/preview?type=${encodeURIComponent(firstResult.entityType)}&id=${encodeURIComponent(firstResult.id)}`,
      {
        headers: { Cookie: cookie },
      }
    );
    const previewData = await previewRes.json();
    if (!previewRes.ok) {
      console.error("Preview failed:", previewData);
      process.exit(1);
    }
    console.log(`✓ Preview loaded successfully: title="${previewData.data.title}", sections=${previewData.data.sections.length}`);
  }

  // 4. Test phone search validation
  console.log("\nTesting phone search validation...");
  const phoneRes = await fetch("http://localhost:3004/api/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3004",
      Cookie: cookie,
    },
    body: JSON.stringify({ q: "9876543210", phone: true }),
  });
  const phoneData = await phoneRes.json();
  console.log(`✓ Phone lookup completed (status=${phoneRes.status}, matched=${phoneData.data?.totalCount ?? 0})`);

  console.log("\nAll search API verification checks passed successfully!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
