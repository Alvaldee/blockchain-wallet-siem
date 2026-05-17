import { Client } from "@elastic/elasticsearch";

export const esClient = new Client({
    node: "http://localhost:9200"
});

export async function checkESConnection() {
    try {
        await esClient.ping();
        console.log("✅ Elasticsearch reachable at http://localhost:9200");
    } catch (err) {
        console.error("❌ Elasticsearch NOT reachable — make sure Docker is running (docker compose up -d)");
        console.error("   Error:", err.message);
    }
}