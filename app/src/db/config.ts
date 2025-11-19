import mongoose from "mongoose";

export function connectDB() {
    return new Promise(async (resolve, reject) => {
        var options = {
            connectTimeoutMS: 30000,
        };

        try {
            // @ts-ignore
            await mongoose.connect(process.env.MONGODB_URI, options);
            console.log("Database Connection Established");
        }
        catch(error){
            console.log(error)
        }

    })
}

export function closeDB() {
    mongoose.disconnect();
}
