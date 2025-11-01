import { PrismaClient } from '@prisma/client';
import process from 'node:process';

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

// Graceful shutdown
process.on('SIGINT', async () => {
	console.log('Received SIGINT, closing Prisma connection...');
	await prisma.$disconnect();
	process.exit(0);
});

process.on('SIGTERM', async () => {
	console.log('Received SIGTERM, closing Prisma connection...');
	await prisma.$disconnect();
	process.exit(0);
});

export default prisma;
