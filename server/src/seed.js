import bcrypt from 'bcryptjs';
import { connectDatabase } from './config/db.js';
import { User } from './models/User.js';
import { Item } from './models/Item.js';

await connectDatabase();
const passwordHash = await bcrypt.hash('CampusFindDemo8!', 12);
const [user] = await User.findOneAndUpdate({ email: 'demo@campusfind.local' }, { name: 'Demo Student', email: 'demo@campusfind.local', passwordHash }, { upsert: true, new: true });
await Item.deleteMany({ owner: user._id });
await Item.create([{ title: 'Black wireless earbuds', description: 'Black Bluetooth earbuds with a small scratch on the charging case.', type: 'LOST', category: 'Electronics', color: 'Black', location: 'Central Library', date: new Date(), owner: user._id }, { title: 'Black Bluetooth earbuds', description: 'Found black earbuds near the library. The charging case has a small damaged mark.', type: 'FOUND', category: 'Electronics', color: 'Black', location: 'Central Library', date: new Date(), owner: user._id }]);
console.log('Seeded demo account: demo@campusfind.local / CampusFindDemo8!');
process.exit(0);
