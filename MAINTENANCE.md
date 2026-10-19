# Maintenance & Status

> **Status (2026-10-19): PAUSED.** The bot has not posted successfully since **2026-02-23**. The EC2 instance was stopped on 2026-10-19 to save costs. Read the TODO list below before restarting it.

## TODO before the bot can run again

### 1. Fix X (Twitter) API access — BLOCKER

- Every post since **2026-03-10** has failed. X first returned `503 Service Unavailable`. A read-only check on 2026-10-19 returned:
  ```
  403 Client Forbidden — reason: "client-not-enrolled"
  "When authenticating requests to the X API v2 endpoints, you must use keys and tokens
   from a developer App that is attached to a Project."
  ```
- The keys and tokens in `.env` are still **valid**: authentication succeeds with `x-access-level: read-write`. The problem is that the developer app (**client_id `27317344`**) isn't enrolled in a Project or access tier that X currently accepts.
- **Fix:** log in to [developer.x.com](https://developer.x.com) with the account that owns the app. It's most likely **@soko_eth**, since tweets show "Automated by @soko_eth". Attach the app to a Project and enroll it in a current access level. X's pay-per-use plan may require buying credits.
- If you regenerate keys there, update all four `TWITTER_*` values in `bun-fun/.env` on the server.
- If nobody can reach that developer account, you'll need a new developer app plus new access tokens. That requires logging in as **@updraftnfts**.
- Verify with a read-only request to `GET https://api.twitter.com/2/users/me` (OAuth 1.0a user context). It should return `200` before you post anything.

### 2. Backfill the missed tweets

Window: everything after the last successful tweet (**2026-02-23 06:22 UTC**, Arbitrum Security token #215) up to the shutdown (**2026-10-19 11:42 UTC**; Arbitrum block `516274674`, zkSync block `72558346`).

An on-chain audit on 2026-10-19 found 10 `ChallengeSolved` events in that window, all on the **Security course on Arbitrum** (`0xDe0e797bfAd78F0615d75430C53F8fe3C9e49883`). The Foundry course had none on either chain, and neither did Security on zkSync.

| Time (UTC) | Lesson | Handle | Block | Tx | Action |
|---|---|---|---|---|---|
| 2026-03-09 21:51 | S0 | *(empty)* | 440110595 | `0xc2bd19b8884286a21eff308afb8b478c0541a60c3b8ccae6fbfc8490c85a033d` | skip |
| 2026-03-09 21:55 | S0 | *(empty)* | 440111677 | `0x84242cdd5bbf02f8869eabf0dff05bc063827ed303a5a1a34ba032efbe0310b8` | skip |
| 2026-03-10 14:39 | S0 | @makarenko | 440352677 | `0x19d927ec4fc022cf47c97266999c77b5f7b4723de4cbe43b80620d45c1ada6e1` | **tweet** |
| 2026-03-11 16:10 | S0 | @kazistov | 440719342 | `0x1074a93342c6b9922d57d7ee2d367ecea1bca473282376720e96d4aa9a3dd93d` | **tweet** |
| 2026-03-30 05:20 | S0 | @fredgitonga_ke | 447124074 | `0xa3f433cef684e263b518d37eae19107ac60825ce9c7a34de23b268a25037a3aa` | **tweet** |
| 2026-03-31 12:24 | S2 | @fredgitonga_ke | 447569831 | `0xcfb8e45e80b8d735335ec2a3bdcf8fd96ba3fc3525ecf5de62d674f2c6d822f8` | **tweet** |
| 2026-04-03 11:24 | S0 | "no twitter / Mykhailo Sanin" | 448591309 | `0xf34bdff52e72e44e1ee042a656dfecc560d2e4183a96900e60b01ca1a717fd42` | skip (invalid handle) |
| 2026-04-13 09:51 | S0 | @Dimaster_3 | 452023135 | `0x1f9bd3c919ac669e59e4d3a0e0f40a490059f5a6f0de639e5515f8117bc1d0bc` | **tweet** (bot never saw this one) |
| 2026-04-17 19:14 | S0 | "something" | 453536000 | `0x2eebe3aa806fa582cee4988f9786f5efb6515364cede15133920ea76884f10b8` | review — probably a placeholder, not a real handle |
| 2026-10-06 16:24 | S4 | @Farnad_J | 512298636 | `0xb5393d2effaeaeea7ad5a8c0979be55acea54ae8a718d8a52d23acb6bd36104a` | **tweet** |

**After restarting, also check for events after block `516274674` (Arbitrum) and `72558346` (zkSync).** Those happened while the bot was off.

> ⚠️ `bun run backfillEvents` and `bun run triggerEvent` **no longer work with the current Alchemy key**. Both create one filter that runs from the contract's deployment block, but Alchemy's Free tier now limits `eth_getLogs`/`eth_newFilter` to a **10-block range**. To backfill, do one of these:
> - Change the scripts to query in chunks against a public RPC (`https://arb1.arbitrum.io/rpc` allows 10M-block ranges; `https://mainnet.era.zksync.io` allows the full range).
> - Upgrade the Alchemy plan.
> - Call `handleChallengeSolvedEvent` directly with the tx hashes in the table above.
>
> Live watching still works on the Free tier because it polls recent blocks only.

### 3. Known bugs / hardening (nice to have)

- `src/index.ts` only handles `logs[0]` in `onLogs`. If several mints land in one poll, all but the first are dropped.
- From July 2026 the WebSocket transport often failed with `Failed to connect`, and `eth_getFilterChanges` returned `Requested resource not found` (expired filters). PM2 restarts the bot every hour (`cron_restart: 0 */1 * * *`) to work around this. That's probably why the @Dimaster_3 event was missed. Consider HTTP polling with `getLogs` in chunks plus a persisted "last processed block" cursor. That would also make backfills automatic.
- Twitter errors are only logged, never retried. A failed tweet is lost.
- `viem` is pinned to `2.21.48` and Bun on the server is `1.1.36`. Both are old.

## Infrastructure

| Item | Value |
|---|---|
| AWS account / region | `003853706631` / `us-east-1` (us-east-1b) |
| EC2 instance | `i-0f796f015e0899d50` (Name: `updraft-bot`), `t2.micro`, Amazon Linux 2023 |
| Disk | 8 GB gp3 `vol-0f7bfe2b330c2140d` |
| Public IP | Not an Elastic IP — **it changes on every stop/start** |
| Access | AWS SSM Session Manager (instance profile `AmazonSSMRoleForInstancesQuickSetup`). SSH key pair: `foundry-course-mint-bot-kp` |
| App path | `/home/ec2-user/contract-events-twitter-bot/bun-fun` (runs the compiled binary `out/updraft-nfts`) |
| Process manager | PM2 as `ec2-user`, app `updraft-nfts`, hourly cron restart. Auto-starts on boot via `pm2-ec2-user.service` |
| Logs | `/home/ec2-user/.pm2/logs/updraft-nfts-{out,error}.log`, rotated by `pm2-logrotate` (10 MB, keep 5, compressed) |
| RPC | Alchemy (`RPC_PROVIDER_API_KEY`) — valid as of 2026-10-19, Free tier |

There is also a **root** PM2 daemon (`pm2-root.service`) with a dead legacy app called `mint-bot` from 2023. It does nothing and can be deleted (`sudo pm2 delete mint-bot && sudo pm2 save`).

### Incident log

- **2026-02-23** — Last successful tweet (@sokoclaw, Security S4).
- **2026-03-10** — X API starts rejecting posts (503, later `client-not-enrolled`).
- **~2026-07** — WebSocket connection failures to Alchemy start appearing in the logs.
- **~2026-10-06** — Root disk hit 100%. Cause: a 2.9 GB legacy `/root/.pm2/logs/mint-bot-error.log`, about 800 MB of journald logs, and no log rotation.
- **2026-10-19** — Diagnosed the outage. Freed the disk (now ~58% used), capped journald at 100 MB, and installed `pm2-logrotate`. Stopped the instance.

## Restarting the server

1. Start the instance:
   ```bash
   aws ec2 start-instances --instance-ids i-0f796f015e0899d50 --region us-east-1
   ```
2. PM2 brings `updraft-nfts` back up automatically. To check on it:
   ```bash
   aws ssm start-session --target i-0f796f015e0899d50 --region us-east-1
   sudo -iu ec2-user pm2 ls
   ```
3. Finish TODO 1 (X API) **before** expecting tweets. Then do TODO 2 (backfill).
4. To deploy code changes:
   ```bash
   cd ~/contract-events-twitter-bot && git pull && cd bun-fun && bun i && bun run build && pm2 restart updraft-nfts
   ```
