import ErrorLogs from "../db/models/error-logs";


/**
 * General-purpose logger for capturing unexpected issues, errors, and debug information.
 * Logs to console and stores in DB.
 */
export default async function LogError({
                                           data,
                                           userID,
                                           place,
                                           reason,
                                           error
                                       }: {
    data?: any;
    userID?: string;
    place?: 'number webhook' | 'subscription webhook' | string;
    reason?: string;
    error?: any;
}) {
    const serializedError = error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name
        }
        : error;

    console.error(
        `\n❌[${new Date().toISOString()}] ${reason || "Unknown reason"}`
    );
    console.error(`At: ${place || "Unknown place"}`);
    console.error("Error:", serializedError);

    try {
        await new ErrorLogs({
            reason,
            data,
            user: userID,
            occurred_place: place,
            error: serializedError
        }).save();
    } catch (dbErr) {
        console.error("Failed to save error log:", dbErr);
    }
}