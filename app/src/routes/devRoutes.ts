import {Router} from "express";
import devOnlyMiddleware from "../utils/middlewares/dev-only-middleware";
import UserTypes from "../db/models/user-types";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Users from "../db/models/users";

const devRouter = Router();

const USER_TYPES = [
    {
        "_id": "63592f9e29fa6431e563fe01",
        "title": "admin",
        "type_id": 1
    },
    {
        "_id": "63592f9e29fa6431e563fe02",
        "title": "agent",
        "type_id": 2
    },
    {
        "_id": "63592f9e29fa6431e563fe03",
        "title": "customer",
        "type_id": 3
    }
]

devRouter.post("/dev/seed/admin-user", devOnlyMiddleware, async (req, res) => {
    try {
        const {email = "admin@demo.com", password = "admin@123", name = "admin"} = req.body;


        let hashedPassword = bcrypt.hashSync(password, 10);
        let newUser = new Users({
            email: email,
            name: name,
            secrets: {
                password: hashedPassword
            },
            type: USER_TYPES[0]._id
        });

        await newUser.save();

        res.status(200).send({
            "success": true, "status": 200, "message": "Admin user created", "data": {
                email: email,
                password: password
            }
        });
    } catch (error) {
        res.status(500).send({"success": false, "status": 500, "message": "Seeding failed", "data": null});
    }
});

devRouter.post('/dev/seed/user-types', devOnlyMiddleware, async (req, res) => {
    try {
        // Types of users
        await UserTypes.insertMany([
            {
                "_id": "63592f9e29fa6431e563fe01",
                "title": "admin",
                "type_id": 1
            },
            {
                "_id": "63592f9e29fa6431e563fe02",
                "title": "agent",
                "type_id": 2
            },
            {
                "_id": "63592f9e29fa6431e563fe03",
                "title": "customer",
                "type_id": 3
            }
        ])

        res.status(200).send({"success": true, "status": 200, "message": "Seeding completed", "data": null});
    } catch (error) {
        res.status(500).send({"success": false, "status": 500, "message": "Seeding failed", "data": null});
    }
});

// Get all environment variables (for development only)
devRouter.post("/dev/all-env", devOnlyMiddleware, async (req, res) => {
    try {
        res.json({
            success: true,
            message: "Environment variables fetched successfully!",
            data: process.env
        });
    } catch (error: any) {
        console.error("Fetch env error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching environment variables",
            error: error.message
        });
    }
});

devRouter.get('/dev/mongo-shell/models', devOnlyMiddleware, (req, res) => {
    const modelNames = mongoose.modelNames();

    res.json({
        success: true,
        models: modelNames
    });
});

/**
 * Execute arbitrary mongoose model commands.
 * For example, to find all users:
 * POST /dev/mongo-shell
 * {
 *   "model": "users",
 *   "command": "find",
 *   "args": [{}]
 * }
 *
 * You can also run raw collection commands like:
 * {
 *   "model": "subscription_types",
 *   "command": "collection.drop",
 *   "args": []
 * }
 */
devRouter.post("/dev/mongo-shell", devOnlyMiddleware, async (req, res) => {
    const {model, command, args} = req.body;

    try {
        if (!model || !command) {
            return res.status(400).json({
                success: false,
                message: "Model and command are required"
            });
        }

        const Model = mongoose.model(model);

        const allowedCommands = [
            'find', 'findOne', 'findById',
            'create', 'insertMany',
            'updateOne', 'updateMany', 'findOneAndUpdate',
            'deleteOne', 'deleteMany', 'findOneAndDelete',
            'countDocuments', 'estimatedDocumentCount',
            'distinct', 'aggregate',
            'syncIndexes', 'createIndexes', 'dropIndexes'
        ];

        // Allow all collection.* methods automatically
        const isCollectionCommand = command.startsWith("collection.");

        if (!allowedCommands.includes(command) && !isCollectionCommand) {
            return res.status(403).json({
                success: false,
                message: `Command '${command}' is not allowed`
            });
        }

        let result;

        if (isCollectionCommand) {
            const subCommand = command.split(".")[1];
            // @ts-ignore
            if (typeof Model.collection[subCommand] !== "function") {
                throw new Error(`Collection command '${subCommand}' not found`);
            }
            // @ts-ignore
            result = await Model.collection[subCommand](...(args || []));
        } else {
            // @ts-ignore
            if (typeof Model[command] !== "function") {
                throw new Error(`Model command '${command}' not found`);
            }

            result = args && args.length > 0
                // @ts-ignore
                ? await Model[command](...args)
                // @ts-ignore
                : await Model[command]();
        }

        // Normalize output
        let responseData;
        if (result && typeof result.toObject === 'function') {
            responseData = result.toObject();
        } else if (Array.isArray(result)) {
            responseData = result.map(doc =>
                doc && typeof doc.toObject === 'function' ? doc.toObject() : doc
            );
        } else {
            responseData = result;
        }

        res.json({
            success: true,
            command: `${model}.${command}`,
            data: responseData,
            count: Array.isArray(responseData) ? responseData.length : (responseData ? 1 : 0)
        });

    } catch (error) {
        console.error("Mongo shell error:", error);

        let errorMessage = "Error executing command";
        let statusCode = 500;

        // @ts-ignore
        if (error.name === 'ValidationError') {
            // @ts-ignore
            errorMessage = "Validation error: " + error.message;
            statusCode = 400;
        } else { // @ts-ignore
            if (error.name === 'CastError') {
                // @ts-ignore
                errorMessage = "Invalid data type: " + error.message;
                statusCode = 400;
            } else { // @ts-ignore
                if (error.message.includes('model')) {
                    errorMessage = "Model not found or invalid";
                    statusCode = 404;
                }
            }
        }

        res.status(statusCode).json({
            success: false,
            message: errorMessage,
            // @ts-ignore
            error: error.message,
            command: model && command ? `${model}.${command}` : 'unknown'
        });
    }
});

export default devRouter;
