# Order Intake

Upload a PDF, scan, WhatsApp photo, or CSV of an order. It reads the details,
you check them over, then it writes the order into a Google Sheet — one row
per item.

## What you need before it'll run

**1. A Google Sheet**

Make a new Google Sheet. Name the first tab `Orders`. In row 1, put these
column headers, in this order:

```
Order ID | Customer Name | Address | Phone | Customer ID | Terms | Item Name | Pack | Quantity | Price | Due Date | Total Due
```

**2. A little script living inside that same Sheet**

This is the easy way to let the app write into your Sheet — no Google Cloud
console, no separate accounts, nothing to download.

1. In your Sheet, click **Extensions → Apps Script**. A new tab opens with an editor.
2. Delete anything in that editor, and paste in this:

   ```js
   function doPost(e) {
     var SECRET = "PASTE_YOUR_SECRET_HERE";
     var data = JSON.parse(e.postData.contents);

     if (data.secret !== SECRET) {
       return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "Not authorized" }))
         .setMimeType(ContentService.MimeType.JSON);
     }

     var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Orders");
     data.rows.forEach(function (row) {
       sheet.appendRow(row);
     });

     return ContentService.createTextOutput(JSON.stringify({ ok: true, count: data.rows.length }))
       .setMimeType(ContentService.MimeType.JSON);
   }
   ```

3. Replace `PASTE_YOUR_SECRET_HERE` with this made-up password (it's just to stop strangers from posting fake orders — you can use this one or make up your own):
   `5e5e67650b1aba1c032ddc76bc88cf8b`
4. Click the **Save** icon (looks like a floppy disk).
5. Click the blue **Deploy** button (top right) → **New deployment**.
6. Next to "Select type," click the gear icon and choose **Web app**.
7. Set "Execute as" to **Me**, and "Who has access" to **Anyone**. (This sounds scary, but the secret password from step 3 is what actually protects it — nobody else can guess that.)
8. Click **Deploy**. Google will ask you to authorize it — click through and allow it (it's your own script, on your own Sheet).
9. Copy the **Web app URL** it gives you. That's your `GOOGLE_SCRIPT_URL`.

**3. An Anthropic API key**

Get one at console.anthropic.com under "API Keys." This is separate from
your regular Claude.ai login.

## Setting it up on your computer

```
npm install
cp .env.local.example .env.local
```

Open `.env.local` and fill in:
- `ANTHROPIC_API_KEY` — from step 3 above
- `GOOGLE_SCRIPT_URL` — the Web app URL from step 2 above
- `GOOGLE_SCRIPT_SECRET` — the same secret password you pasted into the script

Then run it locally:

```
npm run dev
```

Open http://localhost:3000 in your browser.

## Putting it on GitHub and Vercel

1. Create a new empty repo on GitHub (don't add a README there, we already have one).
2. In this project folder, run:
   ```
   git init
   git add .
   git commit -m "First version"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
3. Go to vercel.com, click "Add New Project," and pick this repo.
4. Before you click Deploy, open "Environment Variables" and add the same four values from your `.env.local` file.
5. Click Deploy.

Every time you push a change to GitHub after this, Vercel rebuilds and
updates the live site on its own.

## A couple of things worth knowing

- Very large photos (over ~10MB) may fail to upload — worth compressing
  first if your phone camera shoots big files.
- If the AI misreads something on a photo (blurry writing, odd angle), you
  can just fix it in the review boxes before sending it to the sheet —
  nothing is written until you hit "Send to sheet."
