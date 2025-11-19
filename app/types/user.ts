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
    last_active: Date;
    image: {
        title: string;
        path: string;
        mime_type: string;
        size: number;
    };
    designation: string;
    profile_completed: boolean;
    profile_verified: boolean;
    company: mongoose.Types.ObjectId;
    type: {
        _id: mongoose.Types.ObjectId;
        title: string,
        type_id: string,
        added_by: mongoose.Types.ObjectId
    };

    status: 'active' | 'blocked' | 'inactive';
    subscription:  {
        _id: mongoose.Types.ObjectId;
        plan_type: {
            _id: mongoose.Types.ObjectId;
            title: string;
            benefits: string[];
            credits: number;
            max_agents: number;
            price_monthly: number;
            price_yearly: number;
            currency: string;
            monthly_polar_product_id: string;
            yearly_polar_product_id: string;
        };
        billingCycle: 'monthly' | 'yearly';
        status: 'active' | 'canceled' | 'expired' | 'pending';
        creditsRemaining: number;
        agentsRemaining: number;
        startDate: Date;
        endDate: Date;
        renewalDate: Date;
    };
    added_by: mongoose.Types.ObjectId;
    updated_by: mongoose.Types.ObjectId;
    deleted_by: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}