// Create a login, or reset the password of an existing one.
// Usage: npm run create-user -- you@example.com "a-strong-password"
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';

const [emailArg, password] = process.argv.slice(2);
const email = (emailArg ?? '').trim().toLowerCase();

if (!email || !email.includes('@') || !password) {
  console.error('Usage: npm run create-user -- <email> <password>');
  process.exit(1);
}
if (password.length < 8) {
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set. Add it to .env or .env.local.');
  process.exit(1);
}

const client = new MongoClient(process.env.MONGODB_URI);
try {
  await client.connect();
  const users = client.db(process.env.MONGODB_DB || 'lead-studio').collection('users');
  await users.createIndex({ email: 1 }, { unique: true });

  const password_hash = await bcrypt.hash(password, 12);
  const result = await users.updateOne(
    { email },
    { $set: { password_hash }, $setOnInsert: { _id: randomUUID(), email, created_at: new Date() } },
    { upsert: true }
  );
  console.log(result.upsertedCount ? `Created user ${email}.` : `Updated password for ${email}.`);
} finally {
  await client.close();
}
