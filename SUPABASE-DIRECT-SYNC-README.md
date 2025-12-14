# Supabase Direct Sync - सीधा Supabase में Sync करें

## ✨ Features

यह script निम्नलिखित काम करता है:

1. ✅ **Supabase में Check करता है** - Local files की जगह Supabase database में check करता है
2. 🔄 **Update करता है** - अगर data exist करता है और बदलाव है तो update करता है
3. ➕ **Insert करता है** - अगर नया data है तो Supabase में add करता है
4. 🚫 **Local Save नहीं करता** - `aniVerse1/data` folder में कुछ save नहीं करता

## 🚀 कैसे Use करें

### Step 1: Script Run करें

```bash
cd aniVerse1
npm run sync:direct
```

या सीधा command से:

```bash
cd aniVerse1
node supabase-direct-sync.js
```

### Step 2: Output देखें

Script ये दिखाएगा:

- ✅ **Already saved** - अगर episode पहले से Supabase में है और कोई बदलाव नहीं
- 🔄 **Updated** - अगर episode update हो गया
- ➕ **Added new** - अगर नया episode add हुआ
- ❌ **Error** - अगर कोई problem आई

## 📊 Output Example

```
🚀 Starting Supabase Direct Sync...
📁 Reading from: /path/to/aniVerse1/data
☁️  Syncing to: Supabase (no local saves)

📺 Processing: Hunter-x-Hunter-Hindi-Dub
  ✅ Already up-to-date: Hunter x Hunter Hindi Dub
  🔄 Checking Season 2 for missing episodes...
  ✅ Already saved S2E125 -> Hunter-x-Hunter-Hindi-Dub
  🔄 Updated S2E126 -> Hunter-x-Hunter-Hindi-Dub
  ➕ Added new S2E127 -> Hunter-x-Hunter-Hindi-Dub

✅ Sync Complete!
📊 Summary:
   - Series processed: 150
   - Episodes processed: 5000
   - ☁️  All data synced to Supabase (no local saves)

📈 Supabase Stats:
   - Total series in database: 150
   - Total episodes in database: 5000
```

## 🔧 Environment Variables

Script को ये environment variables चाहिए (आपने पहले से add कर दिए हैं):

- `SUPABASE_URL` - आपका Supabase project URL
- `SUPABASE_ANON_KEY` - आपकी Supabase anon/public key

## 📝 कैसे काम करता है

### Series के लिए:
1. `aniVerse1/data/[series-name]/series.json` या `movie.json` पढ़ता है
2. Supabase में check करता है कि series exist करता है या नहीं
3. अगर exist करता है:
   - Data compare करता है
   - अगर बदलाव है तो **UPDATE** करता है
   - अगर same है तो skip करता है
4. अगर exist नहीं करता तो **INSERT** करता है

### Episodes के लिए:
1. `aniVerse1/data/[series-name]/season-[n]/episode-[n].json` पढ़ता है
2. Supabase में check करता है (series_slug, season, episode से)
3. अगर exist करता है:
   - Data compare करता है
   - अगर बदलाव है तो **UPDATE** करता है
   - अगर same है तो skip करता है
4. अगर exist नहीं करता तो **INSERT** करता है

## 🆚 फर्क पुराने scripts से

### `migrate-to-supabase.js`:
- सभी data को blindly upload करता था
- कोई check नहीं करता था

### `auto-sync-supabase.js`:
- File changes को watch करता था
- Automatic sync करता था
- Local files check करता था

### `supabase-direct-sync.js` (नया):
- ✅ **Supabase में check** करता है (local files में नहीं)
- ✅ **Smart updates** - सिर्फ जरूरत पड़ने पर update करता है
- ✅ **No local saves** - कुछ भी local में save नहीं करता
- ✅ **Efficient** - बेफालतू updates नहीं करता

## 🎯 कब Use करें

इस script को तब use करें जब:

1. आपको `aniVerse1/data` में existing data को Supabase में sync करना है
2. आप local files save नहीं करना चाहते
3. आप Supabase को single source of truth बनाना चाहते हैं
4. आप manual sync करना चाहते हैं (auto-watch के बजाय)

## 💡 Tips

- Script को run करने से पहले ensure करें कि Supabase tables (`series`, `episodes`) create हो चुके हैं
- बड़े datasets के लिए script को terminal में run करें ताकि पूरा output देख सकें
- अगर errors आएं तो Supabase credentials check करें

## 🔍 Troubleshooting

### Error: "Supabase credentials not found"
```bash
# Secrets check करें
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

### Error: "table does not exist"
```bash
# Database schema setup करें
cd aniVerse1
# supabase-schema.sql file को Supabase में run करें
```
