import fs from 'fs';
import dayjs from 'dayjs';

//functions to return error and success responses
export function success_function({status, data, message}: {
    status: number,
    data?: any,
    message?: string
}) {
    return {
        "success": true,
        "statusCode": status,
        "data": data ?? null,
        "message": message ?? null
    };
}

/**
 *
 * @param api_data {{status: number, data: any, message: string}}
 * @returns {{success: boolean, statusCode, data: (*|null), message: (*|string|null)}}
 */
export function error_function(api_data: {
    status: number,
    data?: any,
    message?: string | object,
}): { success: boolean; statusCode: number | null; data: any; message: string | null} {
    if (process.env.ENVIRONMENT === "development") console.dir(api_data, {depth: null});
    let error_data = {date: dayjs().format("DD/MM/YYYY HH:mm"), error: api_data}
    fs.appendFile('./logs/api-logs.txt', JSON.stringify(error_data) + "\n", (error) => {
        if (error) console.log(error);
    });
    return {
        "success": false,
        "statusCode": api_data.status,
        "data": api_data.data ? api_data.data : null,
        "message": api_data.message ? (typeof api_data.message == "string" ? api_data.message : JSON.stringify(api_data.message)) : null
    };
}