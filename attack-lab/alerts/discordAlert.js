import axios from "axios";
import "dotenv/config";

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

export async function sendDiscordAlert(alert) {
    try {
        await axios.post(WEBHOOK_URL, {
            embeds: [
                {
                    title: "🚨 REENTRANCY ATTACK DETECTED",
                    description: alert.description,
                    color: 15158332,
                    fields: [
                        {
                            name: "Severity",
                            value: alert.severity,
                            inline: true
                        },
                        {
                            name: "Withdraw Count",
                            value: String(alert.withdrawCount),
                            inline: true
                        },
                        {
                            name: "Attacker",
                            value: alert.withdrawer
                        },
                        {
                            name: "Transaction",
                            value: alert.txHash
                        }
                    ],
                    timestamp: new Date().toISOString()
                }
            ]
        });

        console.log("✅ Discord alert sent");

    } catch (error) {
        console.error("❌ Failed to send Discord alert");
        console.error(error.message);
    }
}