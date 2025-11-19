import Users from "../db/models/users";
import mongoose from "mongoose";

export const fetchUser = async function (user_data: { id: string }) {
    try {
        return await Users.findOne({_id: new mongoose.Types.ObjectId(user_data.id)}, '-secrets')
            .populate('type', '_id title type_id')
            .populate('company', '')
            .populate({
                path: 'subscription',
                select: '-__v',
                populate: {
                    path: 'plan_type',
                    select: '-monthly_polar_product_id -yearly_polar_product_id'
                }
            })
            .populate({
                path: 'added_by', select: '_id name type',
                populate: {path: 'type', select: '_id title'}
            });
    } catch (error) {
        console.error(error);
        throw error;
    }
};