import type { Abi } from "viem";
import { arbitrum, zksync } from "viem/chains";

import { publicClientArbitrum, publicClientZkSync } from "@/clients";
import { FOUNDRY_COURSE_CONFIG, SECURITY_COURSE_CONFIG } from "@/constants";
import { handleChallengeSolvedEvent } from "@/handleChallengeSolved";
import type { ChainId, ChallengeEventLog, CourseName } from "@/types";

/////////////////////////////////
//  Manually trigger an event  //
/////////////////////////////////

const triggerPastEvent = async (
	eventIndex: number,
	courseName: CourseName,
	chainId: ChainId,
	shouldSendTweet = false,
) => {
	// Create a filter for the ChallengeSolved event
	const publicClient =
		chainId === arbitrum.id ? publicClientArbitrum : publicClientZkSync;
	const challengeSolvedFilter = await publicClient.createContractEventFilter({
		abi: (courseName === "foundry"
			? FOUNDRY_COURSE_CONFIG.abi
			: SECURITY_COURSE_CONFIG.abi) as Abi,
		address:
			courseName === "foundry"
				? FOUNDRY_COURSE_CONFIG.address[chainId]
				: SECURITY_COURSE_CONFIG.address[chainId],
		eventName: "ChallengeSolved",
		// TODO(2026-10-19): Alchemy Free tier caps eth_newFilter/eth_getLogs at 10 blocks, so this full-range
		// filter fails. Query in chunks (e.g. public RPC) before backfilling. See MAINTENANCE.md.
		fromBlock: chainId === arbitrum.id ? 97795932n : 34760049n,
	});
	// Get the logs for the filter
	const logs = await publicClient.getFilterLogs({
		filter: challengeSolvedFilter,
	});
	const transactionHash = logs[eventIndex].transactionHash;
	const { twitterHandle, challenge } = (logs[eventIndex] as ChallengeEventLog)
		.args;
	console.log(
		"Found event: ",
		twitterHandle,
		challenge,
		transactionHash,
		courseName,
	);
	try {
		// Call handleChallengeSolvedEvent to send or simulate a tweet
		handleChallengeSolvedEvent({
			twitterHandle,
			challenge,
			transactionHash,
			courseName,
			chainId,
			shouldSendTweet,
		});
	} catch (e) {
		console.log(e);
	}
};

//////////////////////////////
//  CLI for manual testing  //
/////////////////////////////

// Usage: bun triggerEvent 182 security arbitrum false
const main = async () => {
	const args = process.argv.slice(2);
	if (args.length < 3 || args.length > 4) {
		console.error(
			"Usage: bun run triggerEvent <eventIndex: number> <courseName: foundry | security> chain: arbitrum | zksync <shouldSendTweet?: boolean>",
		);
		process.exit(1);
	}

	const eventIndex = Number.parseInt(args[0], 10);
	const courseName = args[1];
	const chain = args[2];
	const shouldSendTweet = args.length === 4 ? args[3] === "true" : false; // Default to false if not provided

	if (Number.isNaN(eventIndex)) {
		console.error("Invalid event index: must be a number.");
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
		await triggerPastEvent(eventIndex, courseName, chainId, shouldSendTweet);
	} catch (error) {
		console.error("Error triggering event:", error);
		process.exit(1);
	}
};

main();

//////////////////////////////////
//  Tests with expected outputs //
/////////////////////////////////

// bun run triggerEvent 2 security
// Found event:  ljjeth 0x89edc4c74810bedbd53d7dA677eB420DC0154B0b 0xca749e5b94e8acc75d09b6f910a29ee4ec9d56ce1d0613b215ebcc6e98f95cca security
// Simulating tweet:  Congrats @ljjeth for minting Lesson S3 of the Security course!
// You can view the NFT on Opensea here
// https://opensea.io/assets/arbitrum/0xDe0e797bfAd78F0615d75430C53F8fe3C9e49883/2

// bun run triggerEvent 605 foundry true
// Found event:  gabr1sr 0xdeB8d8eFeF7049E280Af1d5FE3a380F3BE93B648 0xa4972cea06b5fddc2f945dd24c5fcfb1072dc6a7bb369de793c0c681466b2b02 foundry
// Sending tweet: Congrats @gabr1sr for minting Lesson 6 of the Foundry course!
// You can view the NFT on Opensea here
// https://opensea.io/assets/arbitrum/0x39338138414Df90EC67dC2EE046ab78BcD4F56D9/605
// {
//   data: {
//     edit_history_tweet_ids: [ "1734694821863026716" ],
//     id: "1734694821863026716",
//     text: "Congrats @gabr1sr for minting Lesson 6 of the Foundry course!\n\nYou can view the NFT on Opensea here\nhttps://t.co/tMqBeYmPZC",
//   },
// }
