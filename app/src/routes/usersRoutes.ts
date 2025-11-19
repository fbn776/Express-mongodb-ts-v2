import express from 'express';
import * as usersController from '../controllers/users-controller';
import {setAccessControl} from "../utils/utils";

const userRouter = express.Router();

userRouter.get('/users/profile', setAccessControl('1,2,3'), usersController.fetchProfile);
userRouter.get('/users/types', setAccessControl('*'), usersController.fetchTypes);
userRouter.get('/users/types/:id', setAccessControl('*'), usersController.fetchType);
userRouter.get('/users/:id', setAccessControl('1,2,3'), usersController.fetchUser);

userRouter.post('/users/change-password', setAccessControl('1,2,3'), usersController.changePassword);
userRouter.put('/users/profile', setAccessControl('1,2,3'), usersController.updateProfile);
userRouter.post('/users/send-otp', setAccessControl('1,2,3'), usersController.sendOtp);
userRouter.post('/users/verify-otp', setAccessControl('1,2,3'), usersController.verifyOtp);


export default userRouter;