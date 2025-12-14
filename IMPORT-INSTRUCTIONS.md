# How to Import Data to Supabase

## Issue: "Row violates row-level security policy"

This error happens because Supabase has Row Level Security (RLS) enabled on tables.

## Solution: Disable RLS Temporarily

### Steps:

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your project

2. **Disable RLS on Tables**
   - Go to **Table Editor** (left sidebar)
   - Click on `series` table
   - Top right corner: Click **"Enable RLS"** button to **disable** it (button turns grey)
   - Repeat for `episodes` table
   - Repeat for `movies` table (if exists)

3. **Run Import**
   ```bash
   cd aniVerse1
   npm run import
   ```

4. **Wait for Import to Complete**
   - The script will import all series and episodes
   - This may take a few minutes

5. **(Optional) Re-enable RLS**
   - After import is complete
   - Go back to Table Editor
   - Click "Enable RLS" button for each table
   - Configure policies if needed (or keep disabled for development)

## Verify Import

After import, check:
```bash
npm run check-schema
```

## Access Your Site

Once data is imported:
1. Restart the frontend: Refresh your browser
2. Navigate to any series
3. You should see the **banner_image background** with blur effect!

## Example Series with Banner Images

If your aniVerse2 data has banner images, they will automatically show up as blurred backgrounds on series/movie pages.
