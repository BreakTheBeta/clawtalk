# Deploy Notes

The deck builds to plain static assets in `dist/`, so hosting at `howtoopenclaw.islinuxdown.com` just needs standard static-site deployment.

## What needs to happen

1. Run `npm install` and `npm run build` in this repo.
2. Upload the contents of `dist/` to the web root served for `howtoopenclaw.islinuxdown.com`.
3. Configure DNS so `howtoopenclaw.islinuxdown.com` points at that host.
4. Configure the web server or platform to serve `index.html` for `/`.
5. Enable HTTPS for the domain.

## Hosting options

- Nginx or Caddy serving the `dist/` directory
- Static hosting such as Netlify, Cloudflare Pages, GitHub Pages, or Vercel

## Notes

- Nothing in this repo assumes the domain already exists locally.
- If the site is hosted under the root of the domain, the current Vite config should work without changes.
- On this machine, the nginx Docker container serves `howtoopenclaw.islinuxdown.com` from `/Users/will/server/blog/howtoopenclaw-dist`.
- To publish the current deck to that live location, run `npm run publish:local`.
