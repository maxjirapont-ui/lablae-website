This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Admin data and deployment

The admin dashboard stores its writable database and new uploads outside Git.

- Locally, runtime data lives in `.data/` and is initialized from `database/seed.db`.
- On Railway, attach a persistent volume to the web service (recommended mount path: `/data`). The app automatically uses `RAILWAY_VOLUME_MOUNT_PATH`.
- Set `ADMIN_PASSWORD` to a strong value of at least 12 characters before the first production login. The first successful login migrates it to a salted password hash in the database.
- `ADMIN_SESSION_SECRET` is optional but recommended. It must be a long, private random value.

Do not commit `.data/`, `database/restaurant.db`, or newly uploaded files. Existing files in `public/uploads/` are legacy seed assets and remain available as read-only fallbacks.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
