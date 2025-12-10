# Share Functionality Setup Guide

## Overview
The share functionality allows users to collaborate on datasets by inviting team members via email with view or edit permissions.

## Database Setup

### 1. Run the Migration
Execute the migration file to create the `table_shares` table:

```bash
# If using Supabase CLI
supabase db push

# Or manually run the SQL in Supabase Dashboard
# Go to SQL Editor and run: supabase/migrations/004_add_table_shares.sql
```

### 2. Verify Table Creation
Check that the `table_shares` table was created with these columns:
- `id` (UUID, primary key)
- `table_id` (UUID, references tables)
- `shared_with_email` (TEXT)
- `permission` (TEXT: 'view' or 'edit')
- `shared_by` (UUID, references auth.users)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

## How It Works

### 1. **Copy Link Sharing**
- Click the "Share" button in the sidebar
- Copy the dataset link
- Anyone with the link can view the dataset (if they have access)

### 2. **Email Invitations**
- Enter team member's email
- Select permission level:
  - **Can view**: Read-only access
  - **Can edit**: Full edit permissions
- Click "Add" to add to invite list
- Click "Send Invites" to save to database

### 3. **Database Storage**
When you send invites:
- Records are created in `table_shares` table
- Each record links the dataset to the invited email
- Permission level is stored
- Your user ID is recorded as the sharer

### 4. **Access Control**
Row Level Security (RLS) policies ensure:
- You can only share datasets you own
- You can view shares you created or received
- You can delete/update shares you created
- Invited users can access shared datasets

## Features

✅ **Copy shareable link**
✅ **Invite by email**
✅ **Set view/edit permissions**
✅ **Multiple invites at once**
✅ **Remove pending invites**
✅ **Loading states**
✅ **Error handling**
✅ **Database persistence**
✅ **Row-level security**

## Future Enhancements

🔜 **Email notifications** - Send actual emails to invited users
🔜 **Accept/reject invites** - Let users accept or decline invitations
🔜 **Manage shared users** - View and remove existing shares
🔜 **Share analytics** - Track who accessed shared datasets
🔜 **Public/private toggle** - Make datasets public or private

## Troubleshooting

### Error: "table_shares does not exist"
**Solution:** Run the migration file in Supabase SQL Editor

### Error: "You must be logged in to share datasets"
**Solution:** Ensure user is authenticated before sharing

### Error: "Failed to share dataset"
**Solution:** Check:
1. User owns the dataset
2. Email format is valid
3. Supabase connection is working
4. RLS policies are enabled

## Testing

1. **Test Copy Link:**
   - Click Share button
   - Click Copy button
   - Verify link is copied to clipboard

2. **Test Email Invite:**
   - Enter valid email
   - Select permission
   - Click Add
   - Verify email appears in pending list
   - Click Send Invites
   - Check database for new record

3. **Test Permissions:**
   - Try sharing dataset you don't own (should fail)
   - Try viewing shares for other users (should fail)
   - Try deleting shares you didn't create (should fail)
