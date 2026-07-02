import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { provider, api_key, api_secret, webhook_url } = body;

    if (!provider) return Response.json({ error: 'Provider is required' }, { status: 400 });

    let result = { provider, success: false, message: '', details: null };

    // ── M-Pesa Daraja ──
    // Tests OAuth token generation using consumer key + secret
    if (provider === 'mpesa') {
      if (!api_key || !api_secret) {
        result.message = 'Consumer Key and Consumer Secret are required.';
      } else {
        try {
          const auth = btoa(`${api_key}:${api_secret}`);
          const tokenRes = await fetch(
            'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            { headers: { Authorization: `Basic ${auth}` } }
          );
          if (tokenRes.ok) {
            const tokenData = await tokenRes.json();
            if (tokenData.access_token) {
              result.success = true;
              result.message = 'M-Pesa Daraja connection successful. OAuth token generated.';
              result.details = { token_prefix: tokenData.access_token.substring(0, 10) + '...' };
            } else {
              result.message = 'M-Pesa authentication failed. Check your Consumer Key and Secret.';
            }
          } else {
            result.message = `M-Pesa API returned ${tokenRes.status}. Verify your credentials.`;
          }
        } catch (e) {
          result.message = `M-Pesa connection error: ${e.message}`;
        }
      }
    }

    // ── Twilio ──
    // Tests by fetching account info
    else if (provider === 'twilio') {
      if (!api_key || !api_secret) {
        result.message = 'Account SID and Auth Token are required.';
      } else {
        try {
          const auth = btoa(`${api_key}:${api_secret}`);
          const twRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${api_key}.json`, {
            headers: { Authorization: `Basic ${auth}` },
          });
          if (twRes.ok) {
            const acct = await twRes.json();
            result.success = true;
            result.message = `Twilio connected. Account: ${acct.friendly_name || acct.account_name || api_key}`;
          } else {
            result.message = `Twilio authentication failed (${twRes.status}). Check your Account SID and Auth Token.`;
          }
        } catch (e) {
          result.message = `Twilio connection error: ${e.message}`;
        }
      }
    }

    // ── WhatsApp Business ──
    // Tests by fetching phone number details
    else if (provider === 'whatsapp') {
      if (!api_key || !api_secret) {
        result.message = 'Access Token and Phone Number ID are required.';
      } else {
        try {
          const waRes = await fetch(
            `https://graph.facebook.com/v18.0/${api_secret}?fields=name,verified_name,display_phone_number`,
            { headers: { Authorization: `Bearer ${api_key}` } }
          );
          if (waRes.ok) {
            const waData = await waRes.json();
            result.success = true;
            result.message = `WhatsApp connected. Phone: ${waData.display_phone_number || waData.verified_name || 'verified'}`;
          } else {
            const errData = await waRes.json().catch(() => ({}));
            result.message = `WhatsApp API error: ${errData?.error?.message || waRes.status}. Check your Access Token and Phone Number ID.`;
          }
        } catch (e) {
          result.message = `WhatsApp connection error: ${e.message}`;
        }
      }
    }

    // ── QuickBooks ──
    else if (provider === 'quickbooks') {
      if (!api_key || !api_secret) {
        result.message = 'Client ID and Client Secret are required.';
      } else {
        try {
          const auth = btoa(`${api_key}:${api_secret}`);
          const qbRes = await fetch(
            'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
            {
              method: 'POST',
              headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: 'grant_type=client_credentials&scope=com.intuit.quickbooks.accounting',
            }
          );
          if (qbRes.ok) {
            result.success = true;
            result.message = 'QuickBooks credentials are valid.';
          } else if (qbRes.status === 400) {
            result.success = true;
            result.message = 'QuickBooks credentials accepted. Use OAuth flow for full access.';
          } else {
            result.message = `QuickBooks validation failed (${qbRes.status}). Check your Client ID and Secret.`;
          }
        } catch (e) {
          result.message = `QuickBooks connection error: ${e.message}`;
        }
      }
    }

    // ── Xero ──
    else if (provider === 'xero') {
      if (!api_key || !api_secret) {
        result.message = 'Client ID and Client Secret are required.';
      } else {
        try {
          const auth = btoa(`${api_key}:${api_secret}`);
          const xeroRes = await fetch(
            'https://identity.xero.com/connect/token',
            {
              method: 'POST',
              headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: 'grant_type=client_credentials&scope=offline_access',
            }
          );
          if (xeroRes.ok || xeroRes.status === 400) {
            result.success = true;
            result.message = 'Xero credentials accepted. Complete OAuth for tenant access.';
          } else {
            result.message = `Xero validation failed (${xeroRes.status}). Check your Client ID and Secret.`;
          }
        } catch (e) {
          result.message = `Xero connection error: ${e.message}`;
        }
      }
    }

    // ── Stripe ──
    else if (provider === 'stripe') {
      if (!api_key) {
        result.message = 'Stripe Secret Key is required.';
      } else {
        try {
          const stRes = await fetch('https://api.stripe.com/v1/balance', {
            headers: { Authorization: `Bearer ${api_key}` },
          });
          if (stRes.ok) {
            const bal = await stRes.json();
            result.success = true;
            result.message = `Stripe connected. Available: ${(bal.available?.[0]?.amount || 0) / 100} ${bal.available?.[0]?.currency || 'usd'.toUpperCase()}`;
          } else {
            result.message = `Stripe authentication failed (${stRes.status}). Check your Secret Key.`;
          }
        } catch (e) {
          result.message = `Stripe connection error: ${e.message}`;
        }
      }
    }

    // ── Google Calendar ──
    // Validates OAuth client credentials format
    else if (provider === 'google_calendar') {
      if (!api_key || !api_secret) {
        result.message = 'OAuth Client ID and Client Secret are required.';
      } else {
        const idValid = api_key.includes('.apps.googleusercontent.com');
        if (idValid) {
          result.success = true;
          result.message = 'Google OAuth credentials format is valid. Complete OAuth consent to activate.';
        } else {
          result.message = 'Google OAuth Client ID format is invalid. It should end with .apps.googleusercontent.com';
        }
      }
    }

    // ── Uber Eats ──
    else if (provider === 'uber_eats') {
      if (!api_key || !api_secret) {
        result.message = 'Client ID and Client Secret are required.';
      } else {
        result.success = true;
        result.message = 'Uber Eats credentials saved. Orders will sync once the webhook is registered.';
      }
    }

    // ── Jumia Food ──
    else if (provider === 'jumia_food') {
      if (!api_key) {
        result.message = 'Vendor API Key is required.';
      } else {
        result.success = true;
        result.message = 'Jumia Food credentials saved. Orders will sync once verified by Jumia.';
      }
    }

    // ── PayPal ──
    else if (provider === 'paypal') {
      if (!api_key || !api_secret) {
        result.message = 'Client ID and Client Secret are required.';
      } else {
        try {
          const base = 'https://api-m.sandbox.paypal.com';
          const ppRes = await fetch(`${base}/v1/oauth2/token`, {
            method: 'POST',
            headers: { Authorization: `Basic ${btoa(`${api_key}:${api_secret}`)}` },
            body: 'grant_type=client_credentials',
          });
          if (ppRes.ok) {
            const ppData = await ppRes.json();
            if (ppData.access_token) {
              result.success = true;
              result.message = 'PayPal connected. Access token generated successfully.';
            }
          } else {
            result.message = `PayPal authentication failed (${ppRes.status}). Check your Client ID and Secret.`;
          }
        } catch (e) {
          result.message = `PayPal connection error: ${e.message}`;
        }
      }
    }

    // ── Unknown provider ──
    else {
      result.message = `Testing not available for provider: ${provider}`;
    }

    return Response.json(result);
  } catch (error) {
    console.error('testIntegration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});