import type { Abi } from "viem";
import { arbitrum, zksync } from "viem/chains";

import { publicClientArbitrum, publicClientZkSync } from "@/clients";
import { FOUNDRY_COURSE_CONFIG, SECURITY_COURSE_CONFIG } from "@/constants";
import { handleChallengeSolvedEvent } from "@/handleChallengeSolved";
import type { ChainId, ChallengeEventLog, CourseName } from "@/types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const backfillEvents = async (
	startId: number,
	endId: number,
	courseName: CourseName,
	chainId: ChainId,
	shouldSendTweet = false,
) => {
	const publicClient =
		chainId === arbitrum.id ? publicClientArbitrum : publicClientZkSync;
	const courseConfig =
		courseName === "foundry" ? FOUNDRY_COURSE_CONFIG : SECURITY_COURSE_CONFIG;

	const challengeSolvedFilter = await publicClient.createContractEventFilter({
		abi: courseConfig.abi as Abi,
		address: courseConfig.address[chainId],
		eventName: "ChallengeSolved",
		// TODO(2026-10-19): Alchemy Free tier caps eth_newFilter/eth_getLogs at 10 blocks, so this full-range
		// filter fails. Query in chunks (e.g. public RPC) before backfilling. See MAINTENANCE.md.
		fromBlock: chainId === arbitrum.id ? 97795932n : 34760049n,
	});

	const logs = await publicClient.getFilterLogs({
		filter: challengeSolvedFilter,
	});

	for (let i = startId; i <= endId; i++) {
		if (i >= logs.length) {
			console.log(`Event index ${i} is out of range. Stopping backfill.`);
			break;
		}

		const log = logs[i] as ChallengeEventLog;
		const { twitterHandle, challenge } = log.args;
		const transactionHash = log.transactionHash;

		console.log(
			`Processing event ${i}: `,
			twitterHandle,
			challenge,
			transactionHash,
			courseName,
		);

		try {
			await handleChallengeSolvedEvent({
				twitterHandle,
				challenge,
				transactionHash,
				courseName,
				chainId,
				shouldSendTweet,
			});

			console.log(`Processed event ${i} successfully.`);

			if (i < endId) {
				console.log("Waiting 5 seconds before processing next event...");
				if (shouldSendTweet) await delay(5000);
			}
		} catch (e) {
			console.error(`Error processing event ${i}:`, e);
		}
	}
};

// Usage: bun backfillEvents 183 186 security arbitrum false
const main = async () => {
	const args = process.argv.slice(2);
	if (args.length < 4 || args.length > 5) {
		console.error(
			"Usage: bun run backfillEvents <startId: number> <endId: number> <courseName: foundry | security> <chain: arbitrum | zksync> <shouldSendTweet?: boolean>",
		);
		process.exit(1);
	}

	const startId = Number.parseInt(args[0], 10);
	const endId = Number.parseInt(args[1], 10);
	const courseName = args[2] as CourseName;
	const chain = args[3];
	const shouldSendTweet = args.length === 5 ? args[4] === "true" : false; // Default to false if not provided

	if (Number.isNaN(startId) || Number.isNaN(endId) || startId > endId) {
		console.error(
			"Invalid start or end ID: must be numbers, and startId must be less than or equal to endId.",
		);
		process.exit(1);
	}

	if (courseName !== "foundry" && courseName !== "security") {
		console.error(
			"Invalid course name: must be either 'foundry' or 'security'.",
		);
		process.exit(1);
	}

	if (chain !== "arbitrum" && chain !== "zksync") {
		console.error("Invalid chain name: must be either 'arbitrum' or 'zksync'.");
		process.exit(1);
	}

	const chainId = chain === "arbitrum" ? arbitrum.id : zksync.id;

	try {
		await backfillEvents(startId, endId, courseName, chainId, shouldSendTweet);
	} catch (error) {
		console.error("Error during backfill:", error);
		process.exit(1);
	}
};

main();
