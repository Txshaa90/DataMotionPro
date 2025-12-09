# PayMongo Integration Setup Guide

This guide will help you set up PayMongo payment integration for DataMotionPro.

## 📋 Prerequisites

1. A PayMongo account ([Sign up here](https://dashboard.paymongo.com/signup))
2. Your PayMongo API keys (Public and Secret keys)
3. Access to your Vercel dashboard

## 🔑 Step 1: Get Your PayMongo API Keys

1. Log in to your [PayMongo Dashboard](https://dashboard.paymongo.com/)
2. Go to **Settings → API Keys**
3. Copy your keys:
   - **Public Key** (starts with `pk_live_` or `pk_test_`)
   - **Secret Key** (starts with `sk_live_` or `sk_test_`)

## ⚙️ Step 2: Add Environment Variables to Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your DataMotionPro project
3. Go to **Settings → Environment Variables**
4. Add the following variables:

### Production Environment

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `PAYMONGO_PUBLIC_KEY` | `pk_live_YOUR_PUBLIC_KEY` | Production |
| `PAYMONGO_SECRET_KEY` | `sk_live_YOUR_SECRET_KEY` | Production |

### Development/Preview Environment

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `PAYMONGO_PUBLIC_KEY_TEST` | `pk_test_YOUR_TEST_PUBLIC_KEY` | Development, Preview |
| `PAYMONGO_SECRET_KEY_TEST` | `sk_test_YOUR_TEST_SECRET_KEY` | Development, Preview |

**⚠️ Important:** Never commit your secret keys to Git!

## 🔗 Step 3: Configure Webhooks

1. In your PayMongo Dashboard, go to **Webhooks**
2. Click **Add Webhook**
3. Set the webhook URL to:
   ```
   https://yourdomain.com/api/paymongo/webhook
   ```
4. Select the following events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.processing`
5. Save the webhook

## 🧪 Step 4: Test the Integration

### Test Mode (Development)

1. Make sure you're using test keys in development
2. Go to `/pricing` page
3. Click "Subscribe Now" on the Plus plan
4. Use PayMongo's test card numbers:
   - **Success:** `4343434343434345`
   - **Failed:** `4571736000000075`
   - **CVV:** Any 3 digits
   - **Expiry:** Any future date

### Live Mode (Production)

1. Switch to live keys in Vercel production environment
2. Test with a real card (small amount)
3. Verify payment appears in PayMongo Dashboard
4. Check that subscription is updated in Supabase

## 📁 Files Created

- `/app/api/paymongo/create-payment-intent/route.ts` - Creates payment intents
- `/app/api/paymongo/webhook/route.ts` - Handles payment webhooks
- `/app/payment/success/page.tsx` - Payment success page
- `/app/pricing/page.tsx` - Updated with payment integration

## 💳 Supported Payment Methods

- Credit/Debit Cards (Visa, Mastercard, JCB)
- GCash
- PayMaya

## 🔄 How It Works

1. **User clicks "Subscribe Now"** → Creates payment intent via API
2. **Redirects to PayMongo** → User enters payment details securely
3. **Payment processed** → PayMongo sends webhook to your server
4. **Subscription updated** → Supabase subscription table is updated
5. **User redirected** → Success page → Dashboard

## 🛠️ Customization

### Change Pricing

Edit `/app/pricing/page.tsx`:

```typescript
handlePayment('plus', 1200) // Amount in PHP (1200 = ₱12.00)
```

### Update Subscription Logic

Edit `/app/api/paymongo/webhook/route.ts`:

```typescript
async function handlePaymentSuccess(paymentData: any) {
  // Your custom logic here
}
```

## 🐛 Troubleshooting

### Payment Intent Creation Fails

- Check that secret key is set in Vercel environment variables
- Verify amount is at least 100 centavos (₱1.00)
- Check Vercel logs for error details

### Webhook Not Receiving Events

- Verify webhook URL is correct in PayMongo Dashboard
- Check that webhook URL is publicly accessible
- Review webhook logs in PayMongo Dashboard

### Subscription Not Updating

- Check Supabase connection
- Verify `user_id` is passed in payment metadata
- Review webhook handler logs

## 📞 Support

- **PayMongo Docs:** https://developers.paymongo.com/docs
- **PayMongo Support:** support@paymongo.com
- **Vercel Docs:** https://vercel.com/docs

## ✅ Checklist

- [ ] PayMongo account created
- [ ] API keys obtained
- [ ] Environment variables added to Vercel
- [ ] Webhook configured in PayMongo Dashboard
- [ ] Test payment completed successfully
- [ ] Live payment tested (optional)
- [ ] Subscription updates verified in Supabase

---

**🎉 You're all set! Your PayMongo integration is ready to accept payments!**
