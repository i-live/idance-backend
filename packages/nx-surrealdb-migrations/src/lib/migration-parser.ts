// import { Migration } from './types';
// import * as crypto from 'crypto';

// export class MigrationParser {
//   static parseUp(content: string, filename: string): Migration {
//     const match = filename.match(/^(\d{4})_(.+)_up\.surql$/);
//     if (!match) {
//       throw new Error(`Invalid migration filename: ${filename}`);
//     }

//     const [, id, name] = match;
//     const up = content.trim();
//     const checksum = crypto.createHash('sha256').update(up).digest('hex');

//     return { id, name, filename, up, checksum };
//   }

//   static parseDown(content: string, filename: string): Migration {
//     const match = filename.match(/^(\d{4})_(.+)_down\.surql$/);
//     if (!match) {
//       throw new Error(`Invalid migration filename: ${filename}`);
//     }

//     const [, id, name] = match;
//     const down = content.trim();
//     const checksum = crypto.createHash('sha256').update(down).digest('hex');

//     return { id, name, filename, up: down, checksum };
//   }
// }