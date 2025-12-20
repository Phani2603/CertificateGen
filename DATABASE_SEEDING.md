# Database Organization Seeding Guide

## Overview
College/university data is now stored in MongoDB instead of being loaded from CSV files. This allows you to:
- Search existing colleges from the database
- See newly created organizations immediately in search results
- Better performance and consistency

## Setup Instructions

### 1. Seed the Database with Colleges

Run this command to import all colleges from the CSV into your MongoDB database:

```bash
pnpm seed:colleges
```

or

```bash
npm run seed:colleges
```

This will:
- Read the `nirf_engineering_2025.csv` file
- Import all ~300 colleges into the `organizations` collection
- Skip if colleges already exist (to prevent duplicates)

### 2. Verify the Import

After seeding, you can verify the data:

```bash
# Connect to your MongoDB
mongosh "your_connection_string"

# Check count
use certificategen
db.organizations.countDocuments({ type: 'college' })

# View sample
db.organizations.findOne({ type: 'college' })
```

### 3. How It Works Now

**Before (CSV-based):**
- Frontend loaded CSV file on every page load
- New organizations not searchable
- CSV parsing in browser
- ~300 colleges hardcoded

**After (Database-based):**
- Frontend fetches from `/api/organizations?type=college`
- New organizations appear in search immediately
- Server-side querying with indexing
- Can grow beyond CSV data

### 4. Creating New Organizations

When you create a new organization:
1. It's saved to the database
2. Immediately available in search
3. Persists across refreshes
4. Shared across all users

### API Endpoint

The organizations API supports:
- `GET /api/organizations` - Get user's organization
- `GET /api/organizations?search=term&type=college` - Search organizations
- `POST /api/organizations` - Create or join organization

### Re-seeding

If you need to re-seed (e.g., updated CSV):

```bash
# Delete existing colleges
mongosh "your_connection_string"
use certificategen
db.organizations.deleteMany({ type: 'college', nirfRank: { $exists: true } })

# Re-run seed
pnpm seed:colleges
```

## Benefits

✅ Newly created organizations searchable immediately  
✅ Better performance (database indexes vs CSV parsing)  
✅ Single source of truth  
✅ Can add more fields/metadata easily  
✅ No CSV loading on every page load
