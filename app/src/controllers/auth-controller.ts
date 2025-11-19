import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendOtp from "../utils/otp-sender";
import {error_function, success_function} from "../utils/response-handler";
import Users from "../db/models/users";
import type {Request, Response} from "express";
import RevokedTokens from "../db/models/revoked-tokens";
import {handleControllerError} from "../utils/utils";

export async function register(req: Request, res: Response) {
    let email = req.body.email;
    let password = req.body.password;
    let name = req.body.name;

    if (!email || !password || !name) {
        let response = error_function({"status": 400, "message": "Email, password and name are required"});
        return res.status(400).send(response);
    }

    try {
        let existingUser = await Users.findOne({email: email});
        if (existingUser) {
            let response = error_function({"status": 400, "message": "User already exists"});
            return res.status(400).send(response);
        }

        let hashedPassword = bcrypt.hashSync(password, 10);
        let newUser = new Users({
            email: email,
            name: name,
            secrets: {
                password: hashedPassword
            },
            type: '63592f9e29fa6431e563fe03' // Defaults to user type 3 (agent)
        });
        let access_token = jwt.sign({"id": newUser._id}, process.env.PRIVATE_KEY!, {expiresIn: '10d'});

        await newUser.save();
        let response = success_function({
            "status": 201, "message": "User registered successfully", data: access_token
        });
        res.status(201).send(response);
    } catch (error) {
        handleControllerError({error, res});
    }
}

export async function login(req: Request, res: Response) {
    const {email, password} = req.body;

    if (!email || !password) {
        let response = error_function({"status": 400, "message": "Email and password are required"});
        return res.status(400).send(response);
    }

    try {
        let user = await Users.findOne({$and: [{email: email}, {deleted: {$ne: true}}]});

        if (user) {
            if (!user.secrets?.password) {
                let response = error_function({"status": 401, "message": "Invalid credentials"});
                return res.status(401).send(response);
            }

            bcrypt.compare(password, user.secrets?.password, async (error: any, auth: any) => {
                if (auth === true) {
                    //valid credentials
                    let access_token = jwt.sign({"id": user._id}, process.env.PRIVATE_KEY!, {expiresIn: '10d'});
                    let response = success_function({
                        "status": 200,
                        "data": access_token,
                        "message": "Login successful"
                    });
                    res.status(200).send(response);
                } else {
                    let response = error_function({"status": 401, "message": "Invalid credentials"});
                    res.status(401).send(response);
                }
            });
        } else {
            let response = error_function({"status": 401, "message": "Invalid credentials"});
            res.status(401).send(response);
        }
    } catch (error) {
        handleControllerError({error, res});
    }
}

export function logout(req: Request, res: Response) {
    try {
        const authHeader = req.headers['authorization'];
        // @ts-ignore
        const token = authHeader.split(' ')[1];

        if (token == null || token == "null" || token == "" || token == "undefined") {
            let response = error_function({"status": 400, "message": "Invalid access token"});
            res.status(400).send(response);
        } else {
            RevokedTokens.findOneAndUpdate({token: token}, {token: token}, {upsert: true})
                .then((data) => {
                    let response = success_function({"status": 200, "message": "Logout successful"});
                    res.status(200).send(response);
                }).catch((error) => {
                let response = error_function({"status": 400, "message": "Logout failed"});
                res.status(400).send(response);
            })
        }
    } catch (error) {
        handleControllerError({error, res});
    }
}

export function checkRevoked(data: { token: string }) {
    return new Promise(async (resolve, reject) => {
        try {
            let revoked = await RevokedTokens.findOne({token: data.token});
            if (revoked) resolve(true);
            resolve(false);
        } catch (error) {
            reject(error);
        }
    })
}

export async function forgotPassword(req: Request, res: Response) {
    let email = req.body.email;

    if (!email) {
        return res.status(404).json(error_function({"status": 400, "message": "Email is required"}));
    }

    try {
        let user = await Users.findOne({$and: [{email: email}, {deleted: {$ne: true}}]});

        if (!user) {
            return res.status(404).json(error_function({"status": 404, "message": "User not found"}));
        }

        // @ts-ignore
        if (!(user?.secrets?.otp?.code) || new Date() > user?.secrets?.otp?.expires_at || new Date() > user?.secrets?.otp?.resent_after) {
            let code = Math.floor(1000 + Math.random() * 9000);
            let expires_at = new Date(new Date().getTime() + 5 * 60000);
            let resent_after = new Date(new Date().getTime() + 60000);

            const otpSent = await sendOtp(user.email as string, "Password Reset OTP", code);

            if (!otpSent) {
                return res.status(500).json(error_function({"status": 500, "message": "Failed to send OTP"}));
            }

            await Users.updateOne({_id: user._id}, {
                $set: {
                    "secrets.otp.code": code,
                    "secrets.otp.expires_at": expires_at,
                    "secrets.otp.resent_after": resent_after
                }
            });

            let response = success_function({"status": 200, "message": `OTP sent to email`});
            res.status(200).send(response);
        } else {
            let response = error_function({"status": 404, "message": "OTP already sent, please wait for the next OTP"});
            res.status(404).send(response);
        }
    } catch (error) {
        handleControllerError({error, res});
    }
}

export async function resetPassword(req: Request, res: Response) {
    let email = req.body.email;
    let password = req.body.password;
    let otp = req.body.otp;

    if (!email || !password || !otp) {
        let response = error_function({"status": 400, "message": "Email, password and OTP are required"});
        return res.status(400).send(response);
    }

    try {
        let user = await Users.findOne({$and: [{email: email}, {deleted: {$ne: true}}]});

        if (!user) {
            let response = error_function({"status": 404, "message": "User not found"});
            return res.status(404).send(response);
        }

        if (Number(user?.secrets?.otp?.code) === Number(otp)) {
            //@ts-ignore
            if (user.secrets.otp.expires_at > new Date()) {
                //@ts-ignore
                user.secrets.password = bcrypt.hashSync(password, 10);
                //@ts-ignore
                user.secrets.otp = undefined;
                await user.save();
                let response = success_function({"status": 200, "message": "Password reset successfully"});
                res.status(200).send(response);
            } else {
                let response = error_function({"status": 400, "message": "OTP expired"});
                return res.status(400).send(response);
            }
        } else {
            let response = error_function({"status": 400, "message": "Invalid OTP"});
            return res.status(400).send(response);
        }
    } catch (error) {
        handleControllerError({error, res});
    }
}