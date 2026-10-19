# Contract Event Tracker -> Twitter Bot

> [!WARNING]
> **The bot is currently paused and has not tweeted since 2026-02-23.**
> TODO before it can run again:
> 1. **The X API app needs updating.** The keys are valid, but X rejects the app with `client-not-enrolled`. Someone with access to the developer account has to enroll the app in a Project.
> 2. **Backfill the missed tweets**: everything from 2026-02-23 up to the shutdown on 2026-10-19, plus anything after.
>
> See **[MAINTENANCE.md](MAINTENANCE.md)** for the full diagnosis, the list of missed events, the infrastructure details and how to restart it.

A fun project to monitor and celebrate Cyfrin Updraft course NFT mints. It posts to [@updraftnfts](https://x.com/updraftnfts).

This project is made up of two main parts:

- **Backend Twitter Bot** ([`bun-fun/`](bun-fun)): listens for `ChallengeSolved` events on the **Foundry** and **Security** course NFT contracts on **Arbitrum** and **zkSync**. When someone mints, it tweets congratulations to their Twitter handle.

- **Frontend Tracker** ([`frontend-vite/`](frontend-vite)): a web app that shows the latest Foundry course mints on Arbitrum in real time.

The project was inspired by a [task](https://github.com/Cyfrin/foundry-full-course-f23/issues/13) proposed by PatrickAlphaC: build a Twitter bot that congratulates people when they mint an NFT, plus a website that shows a real-time list of people minting.

### Contracts

| Course | Arbitrum | zkSync |
|---|---|---|
| Foundry | [`0x39338138414Df90EC67dC2EE046ab78BcD4F56D9`](https://arbiscan.io/address/0x39338138414Df90EC67dC2EE046ab78BcD4F56D9#code) | [`0xBbA202c6DA89646F13C11a63C4aF182E4fFd4c2e`](https://explorer.zksync.io/address/0xBbA202c6DA89646F13C11a63C4aF182E4fFd4c2e) |
| Security | [`0xDe0e797bfAd78F0615d75430C53F8fe3C9e49883`](https://arbiscan.io/address/0xDe0e797bfAd78F0615d75430C53F8fe3C9e49883#code) | [`0x176bB45B13AA90D2CD313d526F14a2F4C6583495`](https://explorer.zksync.io/address/0x176bB45B13AA90D2CD313d526F14a2F4C6583495) |

## Backend Twitter Bot

Built with [Bun](https://bun.sh) and [viem](https://viem.sh). See [`bun-fun/README.md`](bun-fun/README.md) for scripts.

### Installation and Setup

1. `cd bun-fun`
2. `bun install`
3. Copy `.env.example` to `.env` and fill in your Alchemy API key and Twitter (X) API credentials.

### Running the Bot

- `bun run dev`: runs from source. Tweets are only simulated unless `NODE_ENV=production`.
- `bun run build`: compiles a standalone binary to `out/updraft-nfts`.
- `bun run start`: runs the compiled binary. In production it runs under PM2 on EC2 (see [MAINTENANCE.md](MAINTENANCE.md)).

## Frontend Tracker

A React + Vite app that shows mint events in real time.

### Installation and Setup

1. `cd frontend-vite`
2. `yarn install`
3. Copy `.env.example` to `.env` and set `VITE_RPC_PROVIDER_API_KEY` (Alchemy).

### Running the App

- `yarn dev`: runs the app in development mode.

## Dependencies

- Backend: `bun`, `viem`, `oauth-1.0a`, TypeScript.
- Frontend: `react`, `react-dom`, `react-dom-confetti`, `viem`, `vite`, `tailwindcss`, TypeScript.

## Contribute

Feel free to fork this repository, open issues, or submit pull requests with improvements.

## License

[MIT](https://en.wikipedia.org/wiki/MIT_License)

![Frontend Tracker](https://github.com/Cyfrin/foundry-full-course-f23/assets/12901349/84ee315a-98a7-45ec-b35f-ca16bf7b5154)

![Twitter Bot](https://github.com/Markeljan/contract-events-twitter-bot/assets/12901349/4e78f034-7da5-4230-8f99-a9a59602164f)
