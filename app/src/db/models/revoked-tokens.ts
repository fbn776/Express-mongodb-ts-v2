import mongoose from 'mongoose';

const revokedTokens = new mongoose.Schema({
    token: { type: String, required: true },
});

const RevokedTokens = mongoose.model('revoked_tokens', revokedTokens);
export default RevokedTokens;