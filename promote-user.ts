import { db } from './src/lib/db';
import { users } from './src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function promoteToSuperAdmin() {
  try {
    const allUsers = await db.select().from(users);
    if (allUsers.length === 0) {
      console.log('No users found in database.');
      process.exit(0);
    }
    
    console.log('Existing users:', allUsers.map(u => ({ email: u.email, role: u.role })));
    
    // Promote the first user or all users to SUPERADMIN for testing
    for (const user of allUsers) {
      await db.update(users).set({ role: 'SUPERADMIN' }).where(eq(users.id, user.id));
      console.log(`Promoted ${user.email} to SUPERADMIN.`);
    }
    
    console.log('Done!');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

promoteToSuperAdmin();
