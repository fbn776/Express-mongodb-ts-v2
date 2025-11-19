import mongoose from 'mongoose';
import mongoose_delete from 'mongoose-delete';

const user_types_schema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    type_id: { type: Number, required: true, unique: true },
    added_by: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
},
    { timestamps: true })

user_types_schema.plugin(mongoose_delete, { deletedAt: true });

const UserTypes = mongoose.model('user_types', user_types_schema);

export default UserTypes;