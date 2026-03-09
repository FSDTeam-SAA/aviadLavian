import chalk from "chalk";
import cron from "node-cron";

export const startPingServerCron = (): void => {
    const schedule = "*/8 * * * *";

    const job = cron.schedule(
        schedule,
        async () => {
            try {
                console.log(
                    chalk.cyan(
                        `[PingServer] Sending request at ${new Date().toISOString()}`
                    )
                );

                const res = await fetch(
                    "https://aviadlavian.onrender.com/api/v1/ping"
                );

                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }

                const data = await res.json();

                console.log(
                    chalk.green(
                        `[PingServer] Success | status=${res.status} | message=${data?.message ?? "ok"
                        }`
                    )
                );
            } catch (err) {
                console.error(chalk.red("[PingServer] Request failed:"), err);
            }
        },
        {
            timezone: "UTC",
        }
    );

    console.log(
        chalk.magenta("[PingServer] Cron scheduled — runs every 8 minutes")
    );

    job.start();
};