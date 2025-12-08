# Docker PostgreSQL Setup Guide

## Quick Start

### 1. Start PostgreSQL Container

**Option A: Start only PostgreSQL**
```bash
docker-compose up -d postgresql
```

**Option B: Start all services (including PostgreSQL)**
```bash
docker-compose up -d
```

### 2. Verify PostgreSQL is Running

```bash
# Check if container is running
docker ps | findstr postgresql

# Check logs
docker-compose logs postgresql

# Test connection (if you have psql installed)
psql -h localhost -U postgres -d iam_blog_db
# Password: postgres
```

### 3. Update Your .env File

Add this line to your `.env` file:
```env
POSTGRESQL_URI=postgresql://postgres:postgres@localhost:5432/iam_blog_db
```

### 4. Connection Details

- **Host**: `localhost` (or `postgresql` from within Docker network)
- **Port**: `5432`
- **Database**: `iam_blog_db`
- **Username**: `postgres`
- **Password**: `postgres` (change in production!)

## Useful Commands

### Start/Stop PostgreSQL
```bash
# Start
docker-compose up -d postgresql

# Stop
docker-compose stop postgresql

# Stop and remove container (keeps data)
docker-compose down postgresql

# Stop and remove container + data
docker-compose down -v postgresql
```

### Access PostgreSQL

**Option 1: Using Docker exec**
```bash
docker-compose exec postgresql psql -U postgres -d iam_blog_db
```

**Option 2: Using pgAdmin (GUI)**
- Install pgAdmin: https://www.pgadmin.org/download/
- Connect with:
  - Host: `localhost`
  - Port: `5432`
  - Database: `iam_blog_db`
  - Username: `postgres`
  - Password: `postgres`

**Option 3: Using DBeaver (Free GUI)**
- Download: https://dbeaver.io/download/
- Create new PostgreSQL connection with same credentials

### View Logs
```bash
docker-compose logs -f postgresql
```

### Backup Database
```bash
docker-compose exec postgresql pg_dump -U postgres iam_blog_db > backup.sql
```

### Restore Database
```bash
docker-compose exec -T postgresql psql -U postgres iam_blog_db < backup.sql
```

### Reset Database (Delete all data)
```bash
# Stop and remove container + volumes
docker-compose down -v postgresql

# Start again (creates fresh database)
docker-compose up -d postgresql
```

## Connection String Formats

### From Your Application (localhost)
```
postgresql://postgres:postgres@localhost:5432/iam_blog_db
```

### From Docker Containers (same network)
```
postgresql://postgres:postgres@postgresql:5432/iam_blog_db
```

### With SSL (for production)
```
postgresql://postgres:postgres@localhost:5432/iam_blog_db?sslmode=require
```

## Security Notes

⚠️ **Important for Production:**
1. Change the default password in `docker-compose.yml`
2. Use environment variables for passwords
3. Enable SSL/TLS
4. Restrict network access
5. Use strong passwords

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs postgresql

# Check if port 5432 is already in use
netstat -an | findstr 5432
```

### Can't connect from application
- Verify `.env` has correct `POSTGRESQL_URI`
- Check if container is running: `docker ps`
- Verify port mapping: `docker-compose ps`

### Permission errors
```bash
# Fix volume permissions (Linux/Mac)
sudo chown -R 999:999 ./postgresql-data
```

## Next Steps

1. ✅ PostgreSQL is running in Docker
2. ⏭️ Install PostgreSQL client library: `npm install pg sequelize`
3. ⏭️ Create database schema (tables, indexes)
4. ⏭️ Update your code to use PostgreSQL instead of MongoDB
5. ⏭️ Test all functionality
6. ⏭️ Remove MongoDB once migration is complete

## Migration Path

1. **Phase 1**: Run both MongoDB and PostgreSQL (current setup)
2. **Phase 2**: Migrate code to use PostgreSQL
3. **Phase 3**: Test thoroughly
4. **Phase 4**: Remove MongoDB from docker-compose.yml
5. **Phase 5**: (Optional) Move to cloud PostgreSQL later




