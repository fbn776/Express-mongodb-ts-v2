import {z} from "zod";
import mongoose from "mongoose";

export const objectIdString = z.string().refine(
    (val) => mongoose.Types.ObjectId.isValid(val),
    { message: "Invalid MongoDB ObjectId" }
);