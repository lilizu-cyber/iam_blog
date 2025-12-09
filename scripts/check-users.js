require('dotenv').config();
const { Sequelize } = require('sequelize');

async function checkUsers() {
  const postgresUri = process.env.POSTGRESQL_URI || process.env.DATABASE_URL;
  
  const sequelize = new Sequelize(postgresUri, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
  
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');
    
    // Check users
    const [users] = await sequelize.query(`
      SELECT user_id, username, email, role, is_active, created_at 
      FROM users 
      ORDER BY created_at DESC;
    `);
    
    console.log(`📊 Total Users: ${users.length}\n`);
    
    if (users.length === 0) {
      console.log('⚠️  No users found in database!');
      console.log('\n💡 To create an admin user, run:');
      console.log('   npm run create:admin');
      return;
    }
    
    console.log('👥 Users in database:');
    users.forEach((u, i) => {
      console.log(`\n${i + 1}. Username: ${u.username}`);
      console.log(`   Email: ${u.email || 'N/A'}`);
      console.log(`   Role: ${u.role}`);
      console.log(`   Active: ${u.is_active ? '✅ Yes' : '❌ No'}`);
      console.log(`   Created: ${u.created_at}`);
    });
    
    // Check for admin users
    const adminUsers = users.filter(u => u.role === 'admin' && u.is_active);
    console.log(`\n🔐 Active Admin Users: ${adminUsers.length}`);
    
    if (adminUsers.length === 0) {
      console.log('\n⚠️  No active admin users found!');
      console.log('💡 To create an admin user, run:');
      console.log('   npm run create:admin');
    } else {
      console.log('\n✅ You can login with these admin accounts:');
      adminUsers.forEach(u => {
        console.log(`   - Username: ${u.username}`);
      });
      console.log('\n💡 Default password: Schlurfend.?.123 (if using default setup)');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

checkUsers();

