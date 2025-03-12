import { PrismaClient } from '@prisma/client';

// const debugLogConfig = {
//     log: [
//         {
//             emit: 'event',
//             level: 'query',
//         },
//         {
//             emit: 'stdout',
//             level: 'error',
//         },
//         {
//             emit: 'stdout',
//             level: 'info',
//         },
//         {
//             emit: 'stdout',
//             level: 'warn',
//         },
//     ],
// };
const prisma = new PrismaClient();

// prisma.$on('query', (e) => {
//     console.log('Query: ' + e.query)
//     console.log('Params: ' + e.params)
//     console.log('Duration: ' + e.duration + 'ms')
// })

export default prisma;
