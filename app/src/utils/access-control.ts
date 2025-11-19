import jwt from 'jsonwebtoken';
import type {Request, Response} from "express";
import {checkRevoked} from "../controllers/auth-controller";
import {error_function} from "./response-handler";
import Users from "../db/models/users";

export async function accessControl(access_types: string, req: Request, res: Response, next: Function) {
    try {
        //middleware to check JWT
        if (access_types === "*") {
            next();
        } else {
            const authHeader = req.headers['authorization'];
            const token = authHeader ? authHeader.split(' ')[1] : null;

            if (token == null || token == "null" || token == "" || token == "undefined") {
                let response = error_function({"status": 401, "message": "Invalid Access Token"})
                res.status(401).send(response);
            } else {
                //verifying token
                jwt.verify(token, process.env.PRIVATE_KEY!, async function (err, decoded) {
                    if (err) {
                        let response = error_function({"status": 401, "message": err.message})
                        res.status(401).send(response);
                    } else {
                        //@ts-ignore
                        let user = await Users.findById(decoded.id)
                            .populate('type', '-__v -createdAt -updatedAt -deletedAt -added_by -updated_by -deleted_by')
                            .populate('company', '-__v -createdAt -updatedAt -deletedAt -added_by -updated_by -deleted_by')
                            .populate({
                                path: "subscription",
                                populate: { path: "plan_type" },
                                select: '-__v -createdAt -updatedAt -deletedAt -added_by -updated_by -deleted_by'
                            });

                        // @ts-ignore
                        if (!user?.type?.type_id) {
                            return res.status(403).send(error_function({
                                "status": 403,
                                "message": "User type not defined. Access forbidden"
                            }));
                        }

                        if (user) {
                            //checking access control
                            let allowed = access_types.split(',');

                            //@ts-ignore
                            if (allowed && allowed.includes(String(user?.type?.type_id))) {
                                let revoked = await checkRevoked({token: token})
                                if (revoked === false) {
                                    // @ts-ignore
                                    req.user = user;
                                    //token not in revoked list
                                    next();
                                } else if (revoked === true) {
                                    //token is in revoked list
                                    let response = error_function({"status": 401, "message": "Revoked Access Token"})
                                    res.status(401).send(response);
                                } else {
                                    let response = error_function({"status": 400, "message": "Something Went Wrong"})
                                    res.status(400).send(response);
                                }
                            } else {
                                let response = error_function({
                                    "status": 403,
                                    "message": "Not allowed to access the route"
                                })
                                res.status(403).send(response);
                            }
                        } else {
                            let response = error_function({"status": 403, "message": "Access forbidden"})
                            res.status(403).send(response);
                        }
                    }
                });
            }
        }
    } catch (error) {
        // @ts-ignore
        let response = error_function(error)
        res.status(400).send(response);
    }
}