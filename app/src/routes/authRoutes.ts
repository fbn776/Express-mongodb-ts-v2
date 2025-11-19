import {setAccessControl} from "../utils/utils";

import express from 'express';
import * as authController from '../controllers/auth-controller';

const authRouter = express.Router();


authRouter.post('/login', setAccessControl('*'), authController.login);
authRouter.post('/register', setAccessControl('*'), authController.register);
authRouter.post('/logout', setAccessControl('1,2,3'), authController.logout);
authRouter.post('/forgot-password', setAccessControl('*'), authController.forgotPassword);
authRouter.post('/reset-password', setAccessControl('*'), authController.resetPassword);


export default authRouter;