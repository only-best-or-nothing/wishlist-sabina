# sabina-wishlist

Birthday wishlist site for Sabina. Static frontend on GitHub Pages; claim state backed by Cloudflare Worker + KV.

---

## Adding the photo

Drop the photo file as `assets/sabina-photo.jpg`, then commit and push. The polaroid frame is already in place.

---

## Cloudflare Worker setup (one-time)

You need a free Cloudflare account (email only, no card). Then:

### 1. Install Wrangler

```
npm install -g wrangler
```

### 2. Log in

```
wrangler login
```

### 3. Create a KV namespace

```
wrangler kv namespace create CLAIMS
```

Copy the `id` from the output and paste it into `worker/wrangler.toml`, replacing `YOUR_KV_NAMESPACE_ID`.

### 4. Deploy the Worker

```
cd worker
wrangler deploy
```

Wrangler will print the Worker URL, e.g. `https://sabina-wishlist.yourname.workers.dev`.

### 5. Wire up the frontend

Open `app.js` and replace the placeholder at the top:

```js
const WORKER_URL = 'https://sabina-wishlist.yourname.workers.dev';
```

Commit and push — GitHub Pages picks it up automatically.

---

## GitHub Pages

In the repo Settings → Pages, set source to **Deploy from branch → main → / (root)**.  
The live URL will be `https://lovergood05-byte.github.io/sabina-wishlist/`.

---

## Redeploying the Worker after changes

```
cd worker
wrangler deploy
```
