// Uses global fetch natively supported in Node 18+
export async function syncToGoogleSheet(payload) {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('ℹ️ GOOGLE_SHEET_WEBHOOK_URL is not set in environment. Skipping sheet sync.');
    return { success: false, message: 'Webhook URL not set' };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log(`✅ Google Sheet Webhook triggered successfully (${response.status})`);
    return { success: true, status: response.status };
  } catch (err) {
    console.error('❌ Error syncing to Google Sheet Webhook:', err.message);
    return { success: false, error: err.message };
  }
}
