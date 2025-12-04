# 🚀 Deploy ZeroStack to Hostinger

This guide will help you deploy your ZeroStack application to Hostinger with pricing and team management.

## 📋 Prerequisites

1. **Hostinger Account** with Node.js hosting
2. **Supabase Project** (already set up)
3. **Stripe Account** (for payments)
4. **Domain Name** (optional, Hostinger provides one)

## 🔧 Step 1: Prepare Your Application

### 1.1 Update Team Member Email

Edit `supabase/migrations/003_add_subscriptions.sql` and replace:
```sql
('your-email@example.com', 'owner', NULL)
```
With your actual email address. This makes you and your team free forever!

### 1.2 Run the Migration

```bash
# In Supabase Dashboard > SQL Editor, run:
supabase/migrations/003_add_subscriptions.sql
```

Or if using Supabase CLI:
```bash
supabase db push
```

### 1.3 Add Team Members

In Supabase Dashboard > SQL Editor:
```sql
INSERT INTO public.team_members (email, role, added_by)
VALUES 
  ('team-member-1@example.com', 'member', NULL),
  ('team-member-2@example.com', 'member', NULL);
```

## 💳 Step 2: Set Up Stripe (Optional - for paid users)

### 2.1 Create Stripe Account
1. Go to https://stripe.com
2. Create account and get API keys
3. Note your **Publishable Key** and **Secret Key**

### 2.2 Create Products in Stripe
1. Go to Stripe Dashboard > Products
2. Create two products:
   - **Pro Plan**: $29/month
   - **Enterprise Plan**: Custom pricing

### 2.3 Get Price IDs
Note the Price IDs for each product (e.g., `price_xxxxx`)

## 🌐 Step 3: Deploy to Hostinger

### 3.1 Build Your Application

```bash
npm run build
```

### 3.2 Upload to Hostinger

**Option A: Using Git (Recommended)**
1. Push your code to GitHub
2. In Hostinger Panel > Git
3. Connect your repository
4. Set build command: `npm run build`
5. Set start command: `npm start`

**Option B: Using FTP**
1. Build locally: `npm run build`
2. Upload `.next`, `public`, `package.json`, `package-lock.json`
3. SSH into server and run `npm install --production`

### 3.3 Set Environment Variables

In Hostinger Panel > Environment Variables, add:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe (if using payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# App URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Node Environment
NODE_ENV=production
```

### 3.4 Configure Node.js

In Hostinger Panel:
1. Select Node.js version: **18.x or higher**
2. Set entry point: `npm start`
3. Set port: Usually `3000` or auto-assigned

## 🔐 Step 4: Configure Supabase

### 4.1 Update Allowed URLs

In Supabase Dashboard > Authentication > URL Configuration:
- Add your Hostinger domain to **Site URL**
- Add to **Redirect URLs**:
  ```
  https://yourdomain.com/auth/callback
  https://yourdomain.com/dashboard
  ```

### 4.2 Enable Email Auth

In Supabase Dashboard > Authentication > Providers:
- Enable Email provider
- Configure email templates

## 💰 Step 5: Set Up Stripe Webhooks (Optional)

### 5.1 Create Webhook Endpoint

In Stripe Dashboard > Developers > Webhooks:
1. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
2. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 5.2 Get Webhook Secret

Copy the webhook signing secret and add to environment variables.

## 👥 Step 6: Manage Your Team

### 6.1 Add Team Members (Free Access)

```sql
-- In Supabase SQL Editor
INSERT INTO public.team_members (email, role)
VALUES ('new-member@example.com', 'member');
```

### 6.2 Remove Team Members

```sql
DELETE FROM public.team_members 
WHERE email = 'member@example.com';
```

### 6.3 Check Who's on Your Team

```sql
SELECT * FROM public.team_members;
```

## 🎯 How It Works

### For Your Team (FREE):
1. ✅ Add their email to `team_members` table
2. ✅ They sign up normally
3. ✅ System detects they're team members
4. ✅ They get **Enterprise features for FREE**
5. ✅ No limits on datasets, records, or features

### For Paying Customers:
1. They visit `/pricing`
2. Choose a plan (Free, Pro, or Enterprise)
3. Sign up and pay via Stripe
4. Get access based on their plan
5. Limits enforced automatically

## 📊 Plan Limits

### Free Plan (Public Users):
- 3 datasets max
- 1,000 records per dataset
- Basic features only
- No API access

### Pro Plan ($29/month):
- Unlimited datasets
- 100,000 records per dataset
- All features
- Full API access

### Enterprise Plan (Your Team):
- ✅ **Unlimited everything**
- ✅ **No costs**
- ✅ **All features**
- ✅ **Priority support**

## 🔍 Testing

### Test Team Member Access:
1. Add test email to `team_members`
2. Sign up with that email
3. Verify unlimited access

### Test Paid User:
1. Use Stripe test mode
2. Sign up with test card: `4242 4242 4242 4242`
3. Verify plan limits work

## 🚨 Important Notes

1. **Keep your team emails in `team_members` table** - They'll always be free
2. **Use Stripe test mode first** - Don't charge real money until ready
3. **Backup your database** - Before running migrations
4. **Monitor usage** - Check Supabase and Stripe dashboards
5. **Update DNS** - Point your domain to Hostinger

## 📞 Support

If you need help:
- Hostinger Support: https://www.hostinger.com/support
- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs

## ✅ Checklist

- [ ] Updated team member email in migration
- [ ] Ran database migration
- [ ] Added team members to database
- [ ] Set up Stripe account (if using payments)
- [ ] Built application locally
- [ ] Uploaded to Hostinger
- [ ] Set environment variables
- [ ] Configured Supabase URLs
- [ ] Set up Stripe webhooks (if using)
- [ ] Tested team member access
- [ ] Tested paid user signup
- [ ] Pointed domain to Hostinger

## 🎉 You're Done!

Your ZeroStack is now live with:
- ✅ Public pricing page
- ✅ Free access for your team
- ✅ Paid plans for customers
- ✅ Automatic limit enforcement
- ✅ Stripe payment processing

Visit `https://yourdomain.com` and start using it!
