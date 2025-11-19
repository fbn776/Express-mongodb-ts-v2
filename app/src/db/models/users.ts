import mongoose from 'mongoose';
import mongoose_delete from 'mongoose-delete';

const userSchema = new mongoose.Schema({
    name: String,
    phone: String,
    email: String,
    secrets: {
        password: String,
        otp: {
            code: String,
            expires_at: Date,
            resent_after: Date
        }
    },
    type: { type: mongoose.Schema.Types.ObjectId, ref: 'user_types' },
    added_by: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    deleted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
},
    { timestamps: true })

userSchema.plugin(mongoose_delete, { deletedAt: true });


const Users = mongoose.model('users', userSchema);

export default  Users;