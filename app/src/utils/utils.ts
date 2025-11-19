import {accessControl} from "./access-control";
import jwt from "jsonwebtoken";
import currencyCodes from 'currency-codes';
import type {Request, Response} from "express";
import {error_function} from "./response-handler";

/**
 * Utility function to handle errors in controllers.
 * @param error {Error} - The error object caught in the controller.
 * @param res {Response} - The Express response object to send the error response.
 * @param statusCode {number} - The HTTP status code to return (default is 400).
 * @param customMsg {string} - Custom error message to return (default is "Something went wrong").
 */
export function handleControllerError({error, res, statusCode = 400, customMsg = "Something went wrong"}: {
    error: any,
    res: any,
    statusCode?: number,
    customMsg?: string
}) {
    if (process.env.ENVIRONMENT === 'development') {
        console.error(error);
    }

    res.status(statusCode).send(error_function({
        "status": statusCode, "message": error ? (error.message ? error.message : error) : customMsg
    }));
}

/**
 * Utility function to set access control for routes.
 * @param access_type {string} - The access type string, e.g., '1,2,3' for read access for each user type; 1 - Admin, 2 - Staff, 3 - Regular User, '*' for full access.
 */
export function setAccessControl(access_type: string) {
    return (req: Request, res: Response, next: () => void) => {
        accessControl(access_type, req, res, next)
    }
}

/**
 * Decodes JWT and returns it
 * @param req {Express.Request}
 */
export function decodeJWT(req: Request): {
    id: string;
} {
    const authHeader = req.headers['authorization'];
    const token = authHeader!.split(' ')[1];
    return jwt.decode(token) as { id: string };
}

/**
 * removes all spaces (\s) and hyphens (-) from a given phone number string.
 * @param phone
 */
export const normalizePhone = (phone: string) => phone.replace(/\s|-/g, '');

/**
 * Checks if the provided phone number is in E.164 format (+[country code][subscriber number including area code])
 * @param phone
 */
export const isE164Phone = (phone: string) => {
    // E.164 format: +[country code][subscriber number including area code]
    const e164Regex = /^\+[1-9]\d{1,14}$/;

    return e164Regex.test(phone);
}

/**
 * Checks if the provided currency code is valid.
 * @param currency {string} - The currency code to validate.
 */
export const isValidCurrency = (currency: string) => {
    if (!currency) return false;
    const code = currency.toUpperCase();
    return !!currencyCodes.code(code);
}

/**
 * Runs the given function and returns a 2 - tuple (<result, error>)
 * If function executed successfully return [result, null]
 * else returns [null, error]
 */
export const expectErrorAsync = async (func: () => Promise<any>) => {
    try {
        return [await func(), null];
    } catch (error) {
        return [null, error];
    }
}

/**
 Runs the given function and returns a 2 - tuple (<result, error>)
 If function executed successfully return [result, null]
 else returns [null, error]
 * @param func {() => any}
 * @returns {[any, null]|[null,error]}
 */
export const expectError = (func: () => any): [any, null] | [null, unknown] => {
    try {
        return [func(), null];
    } catch (error) {
        return [null, error];
    }
}

/**
 * Generates a numeric OTP of specified length (default is 6).
 * @param length
 */
export function generateOtp(length: number = 6): string {
    let otp = "";
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10); // digits 0–9
    }
    return otp;
}