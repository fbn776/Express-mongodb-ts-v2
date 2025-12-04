import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type {Request, Response} from 'express';
import * as userManagers from '../managers/userManagers';
import Users from '../db/models/users';
import UserTypes from "../db/models/user-types";
import {error_function, success_function} from "../utils/response-handler";
import {generateOtp, handleControllerError} from "../utils/utils";
import {updateUserSchema} from "../schemas/users-schemas";
import sendEmail from "../utils/email-manager";


export const fetchUser = async function (req: Request, res: Response) {
    try {
        let id = req.params.id;
        let user = await userManagers.fetchUser({id: id});
        if (user) {
            let response = success_function({"status": 200, data: user});
            res.status(200).send(response);
        } else {
            let response = error_function({"status": 404, "message": "User not found"});
            res.status(404).send(response);
        }
    } catch (error) {
        handleControllerError({error, res});
    }
}

export const fetchProfile = async function (req: Request, res: Response) {
    try {
        let user = await Users.findOne({
            _id: req!.user!._id,
        })
            .select('-secrets')
            .populate('type', '-deleted -__v');

        if (user) {
            let response = success_function({"status": 200, data: user});
            res.status(200).send(response);
        } else {
            let response = error_function({"status": 404, "message": "User not found"});
            res.status(404).send(response);
        }
    } catch (error) {
        handleControllerError({error, res});
    }
}

export const updateProfile = async function (req: Request, res: Response) {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader?.split(' ')[1];
        let decoded = jwt.decode(token!);
        // @ts-ignore
        let id = decoded!.id;
        const userBody = updateUserSchema.partial().safeParse(req.body);
        const data = userBody.data;

        if (!userBody.success || !data) {
            return res.status(400).send(error_function({
                status: 400,
                message: "Invalid data",
                data: userBody.error.issues
            }));
        }

        let user_count = await Users.countDocuments({$and: [{$or: [{email: data?.email}, {phone: data.phone}]}, {_id: {$ne: id}}, {deleted: {$ne: true}}]});

        if (user_count > 0) {
            let response = error_function({"status": 403, "message": "Email or phone already exists"});
            res.status(403).send(response);
            return;
        }

        let result = await Users.updateOne({_id: id}, {$set: data});

        if (result.matchedCount === 1 && result.modifiedCount === 1) {
            let response = success_function({"status": 200, "message": "Profile updated successfully"});
            res.status(200).send(response);
        } else {
            let response = error_function({"status": 404, "message": "Profile update failed or user not found"});
            res.status(404).send(response);
        }
    } catch (error) {
        handleControllerError({error, res});
    }
}

export const fetchType = async function (req: Request, res: Response) {
    try {
        let id = req.params.id;
        let type = await UserTypes.findOne({$and: [{_id: id}, {deleted: {$ne: true}}]});
        if (type) {
            let response = success_function({"status": 200, data: type});
            res.status(200).send(response);
        } else {
            let response = error_function({"status": 404, "message": "Type not found"});
            res.status(404).send(response);
        }
    } catch (error) {
        handleControllerError({error, res});
    }
}

export const fetchTypes = async function (req: Request, res: Response) {
    try {
        let page = req.query.page;
        let limit = req.query.limit;
        //@ts-ignore
        let types_array = await UserTypes.find({deleted: {$ne: true}}).skip((page - 1) * limit).limit(limit);
        let response = success_function({"status": 200, data: types_array});
        res.status(200).send(response);
    } catch (error) {
        handleControllerError({error, res});
    }
}

export const changePassword = async function (req: Request, res: Response) {
    const {new_password, old_password} = req.body;

    try {
        const authHeader = req.headers['authorization']!;
        const token = authHeader!.split(' ')[1];
        let decoded = jwt.decode(token);
        // @ts-ignore
        let user = await Users.findOne({_id: decoded!.id, deleted: {$ne: true}});

        if (user && bcrypt.compareSync(old_password, user?.secrets?.password!)) {
            let salt = bcrypt.genSaltSync(10);
            let new_password_hash = bcrypt.hashSync(new_password, salt);
            // @ts-ignore
            await Users.updateOne({_id: decoded?.id}, {$set: {secrets: {password: new_password_hash}}});
            let response = success_function({"status": 200, "message": "Password changed successfully"});
            res.status(200).send(response);
        } else {
            let response = error_function({"status": 400, "message": "Old password is incorrect"});
            res.status(400).send(response);
        }
    } catch (error) {
        handleControllerError({error, res});
    }
}

export async function sendOtp(req: Request, res: Response) {
    try {
        const otp = generateOtp();

        if (!req.user) {
            return res.status(401).send(error_function({status: 401, message: "Unauthorized"}));
        }

        const user = await Users.findById(req.user._id);

        if (!user) {
            return res.status(404).send(error_function({status: 404, message: "User not found"}));
        }

        if (!user.secrets) {
            user.secrets = {
                otp: {
                    code: '',
                    expires_at: new Date(0),
                    resent_after: new Date(0)
                }
            };
        }
        //
        // if (user.profile_verified) {
        //     return res.status(400).send(error_function({status: 400, message: "Profile already verified"}));
        // }

        if (user!.secrets!.otp && user!.secrets!.otp.resent_after && new Date() < user.secrets.otp.resent_after) {
            return res.status(429).send(error_function({
                status: 429,
                message: "OTP already sent. Please wait before requesting again."
            }));
        }

        await sendEmail(user.email!, 'Your OTP Code', './views/templates/email/otp-template.html', {
            name: user.name,
            otp: otp
        });

        user.secrets.otp = {
            code: otp,
            expires_at: new Date(new Date().getTime() + 10 * 60000), // 10 minutes from now
            resent_after: new Date(new Date().getTime() + 2 * 60000) // 2 minutes from now
        }

        await user.save();

        res.status(200).send(success_function({
            status: 200,
            message: "OTP sent successfully",
            data: process.env.ENVIRONMENT === 'development' ? {otp} : {}
        }));
    } catch (error) {
        handleControllerError({error, res});
    }
}

export async function verifyOtp(req: Request, res: Response) {
    try {
        const otp = req.body?.otp;

        if (!otp) {
            return res.status(400).send(error_function({status: 400, message: "OTP is required"}));
        }

        const user = req.user;

        if (!user) {
            return res.status(401).send(error_function({status: 401, message: "Unauthorized"}));
        }

        if (user.profile_verified) {
            return res.status(400).send(error_function({status: 400, message: "Profile already verified"}));
        }

        if (!user.secrets.otp || !user.secrets.otp.code || !user.secrets.otp.expires_at) {
            return res.status(400).send(error_function({
                status: 400,
                message: "No OTP found. Please request a new one."
            }));
        }

        if (new Date() > user.secrets.otp.expires_at) {
            return res.status(400).send(error_function({
                status: 400,
                message: "OTP has expired. Please request a new one."
            }));
        }

        if (user.secrets.otp.code === otp) {
            await Users.findOneAndUpdate({_id: user._id}, {
                $set: {
                    profile_verified: true,
                    "secrets.otp": {
                        otp: '',
                        expires_at: new Date(0),
                        resent_after: new Date(0)
                    }
                }
            });
            return res.status(200).send(success_function({status: 200, message: "OTP verified successfully"}));
        }

        return res.status(400).send(error_function({status: 400, message: "Invalid OTP"}));
    } catch (error) {
        handleControllerError({error, res});
    }
}