# bun-fun (Updraft NFTs Twitter bot)

> [!WARNING]
> **Paused since 2026-10-19 and hasn't tweeted since 2026-02-23.** TODO: update the X API app enrollment (`client-not-enrolled`), then backfill the missed tweets. The backfill scripts below don't currently work on Alchemy's Free tier. See [../MAINTENANCE.md](../MAINTENANCE.md).

Setup:

```bash
bun install
cp .env.example .env # fill in RPC_PROVIDER_API_KEY and the TWITTER_* credentials

# development (tweets are simulated)
bun run dev

# production build
bun run build
bun run start
```

Simulate or trigger past events. `eventIndex` is the index of the `ChallengeSolved` event since the contract was deployed:

```bash
# trigger one event and simulate the tweet
bun run triggerEvent <eventIndex> <foundry|security> <arbitrum|zksync>

# trigger and send the tweet (pass true as the last argument)
bun run triggerEvent <eventIndex> <foundry|security> <arbitrum|zksync> true

# backfill a range of events (pass true to actually tweet)
bun run backfillEvents <startId> <endId> <foundry|security> <arbitrum|zksync> [true]
```

> ⚠️ Both scripts create one log filter that starts at the deployment block. Alchemy's Free tier now limits `eth_getLogs`/`eth_newFilter` to 10 blocks, so they fail with the current key. Use a chunked query against a public RPC, or upgrade Alchemy, until they're fixed. See [../MAINTENANCE.md](../MAINTENANCE.md#2-backfill-the-missed-tweets).

This project was created using `bun init` in bun v1.0.14. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
