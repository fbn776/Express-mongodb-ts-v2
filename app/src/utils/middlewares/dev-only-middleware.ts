import type {Request, Response, NextFunction} from "express";


export default function devOnlyMiddleware(req: Request, res: Response, next: NextFunction) {
    if (process.env.ENVIRONMENT !== 'development') {
        return res.status(403).json({ message: 'This route is only accessible in development mode.' });
    }

    next();
}