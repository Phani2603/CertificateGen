# User Migration Guide

## Converting Existing Academic Users to Individual Users

All existing users in the system need to be migrated to use the new user type system. This is a one-time migration that will set all existing academic users to "individual" type.

## Why This Migration?

The system now has three distinct user types:
- **Individual**: View and manage certificates you've received
- **Corporate**: Create organizations and generate certificates
- **Academic**: Coming soon (currently disabled)

All existing users were academic users, but they need to be migrated to the new system.

## Migration Options

### Option 1: Using the API Endpoint (Recommended)

Simply make a POST request to the migration endpoint:

```bash
curl -X POST http://localhost:3000/api/migrate-users
```

This will:
- Find all users without a `userType` field
- Set their `userType` to `'individual'`
- Return the count of migrated users

### Option 2: Using the Migration Script

Run the TypeScript migration script:

```bash
npx tsx scripts/migrate-academic-to-individual.ts
```

## After Migration

Once migrated:
- **Existing users**: Will see the individual dashboard when they log in
- **New signups**: Must select Corporate or Individual during signup
- **OAuth users**: Will be prompted to select their type on first login

## What Happens to Existing Data?

- All historical data is preserved (organizations, clubs, certificates)
- Users retain access to their certificate history
- The academic dashboard is replaced with "Coming Soon" message
- Individual users can still view all their received certificates

## Rollback (If Needed)

If you need to revert users back, you can run:

```javascript
// Revert all individual users back to null userType
db.users.updateMany(
  { userType: 'individual' },
  { $set: { userType: null } }
)
```

## Verification

After migration, verify by:
1. Check user counts: `db.users.countDocuments({ userType: 'individual' })`
2. Log in as an existing user - should see individual dashboard
3. Sign up as new user - should see type selection
4. OAuth login - should prompt for type selection
