import {z} from "zod";


export const updateUserSchema = z.object({
    name: z.string().min(1).max(200),
    phone: z.string().min(10).max(15),
    email: z.email(),
})
