import axios from "axios";
import "dotenv/config";

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const SEVERITY_COLORS = {
    CRITICAL: 10038562, // dark red
    HIGH:     15158332, // red
    MEDIUM:   16776960, // yellow
    LOW:       3066993, // green
};

export async function sendDiscordAlert(alert) {
    try {
        await axios.post(WEBHOOK_URL, {
            embeds: [
                {
                    title: "🚨 " + alert.name,
                    description: alert.description,
                    color: SEVERITY_COLORS[alert.severity] ?? SEVERITY_COLORS.HIGH,
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