import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const exampleRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string().optional() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text ?? 'World'}!`,
        timestamp: new Date().toISOString(),
        message: 'This is a simple tRPC hello world response'
      };
    }),
    
  getAll: publicProcedure.query(() => {
    return [
      { id: 1, name: 'Sample Organization 1' },
      { id: 2, name: 'Sample Organization 2' },
      { id: 3, name: 'Sample Organization 3' }
    ];
  }),
});