import mongoose from "mongoose";

export default interface IUser {
    _id: mongoose.Types.ObjectId;
    name: string;
    phone: string;
    email: string;
    secrets: {
        password: string;
        otp: {
            code: string;
            expires_at: Date;
            resent_after: Date;
        }
    };

    type: {
        _id: mongoose.Types.ObjectId;
        title: string,
        type_id: number,
        added_by: mongoose.Types.ObjectId
    };

    added_by: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}