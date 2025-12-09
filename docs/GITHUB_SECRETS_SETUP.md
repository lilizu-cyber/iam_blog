# GitHub Secrets Setup Guide

This guide explains how to add secrets to your GitHub repository for CI/CD workflows.

## Overview

GitHub Secrets are encrypted environment variables that can be used in GitHub Actions workflows. They are never exposed in logs or to unauthorized users.

## Step-by-Step Instructions

### Step 1: Navigate to Repository Settings

1. Go to your GitHub repository: `https://github.com/YOUR_USERNAME/iam_blog`
2. Click on the **Settings** tab (top navigation bar)
3. In the left sidebar, click on **Secrets and variables**
4. Click on **Actions** (under "Secrets and variables")

### Step 2: Add Secrets

For each secret you need to add:

1. Click the **New repository secret** button (top right)
2. Fill in the form:
   - **Name**: Enter the secret name (e.g., `POSTGRESQL_URI_STAGING`)
   - **Secret**: Paste the secret value (e.g., `postgresql://user:password@host:port/database`)
3. Click **Add secret**

### Step 3: Add Required Secrets

Add the following secrets:

#### 1. POSTGRESQL_URI_STAGING

- **Name**: `POSTGRESQL_URI_STAGING`
- **Value**: Your staging PostgreSQL connection string
  ```
  postgresql://username:password@staging-host:5432/staging_database
  ```
- **Example**:
  ```
  postgresql://postgres:mySecurePassword@staging-db.example.com:5432/iam_blog_staging
  ```

#### 2. POSTGRESQL_URI_PRODUCTION

- **Name**: `POSTGRESQL_URI_PRODUCTION`
- **Value**: Your production PostgreSQL connection string
  ```
  postgresql://username:password@production-host:5432/production_database
  ```
- **Example**:
  ```
  postgresql://postgres:mySecurePassword@prod-db.example.com:5432/iam_blog_production
  ```

### Step 4: Verify Secrets Are Added

After adding secrets, you should see them listed in the "Repository secrets" section:
- ✅ `POSTGRESQL_URI_STAGING`
- ✅ `POSTGRESQL_URI_PRODUCTION`

**Note**: You won't be able to see the secret values after adding them (for security). You can only update or delete them.

## How Secrets Are Used in Workflows

The secrets are automatically available in GitHub Actions workflows. Here's how they're used:

### In `deploy.yml`:

```yaml
env:
  POSTGRESQL_URI: ${{ secrets[format('POSTGRESQL_URI_{0}', inputs.environment)] }}
```

This dynamically selects:
- `POSTGRESQL_URI_STAGING` when `environment` is `staging`
- `POSTGRESQL_URI_PRODUCTION` when `environment` is `production`

### In `migrations.yml`:

```yaml
env:
  POSTGRESQL_URI: ${{ secrets[format('POSTGRESQL_URI_{0}', inputs.environment)] }}
```

## Security Best Practices

1. **Never commit secrets to code**: Secrets should only be stored in GitHub Secrets
2. **Use different secrets for each environment**: Staging and production should have separate credentials
3. **Rotate secrets regularly**: Change database passwords periodically
4. **Use strong passwords**: Ensure database passwords are strong and unique
5. **Limit access**: Only repository administrators should be able to view/edit secrets
6. **Use environment-specific secrets**: Don't reuse the same credentials across environments

## Optional: Additional Secrets

If you're using other services, you might also want to add:

### For Deployment (if using SSH):

- `SSH_HOST`: Server hostname or IP
- `SSH_USERNAME`: SSH username
- `SSH_PRIVATE_KEY`: SSH private key (entire key, including `-----BEGIN` and `-----END` lines)

### For Docker Registry (if pushing images):

- `DOCKER_REGISTRY`: Docker registry URL (e.g., `ghcr.io` or `docker.io`)
- `DOCKER_USERNAME`: Docker registry username
- `DOCKER_PASSWORD`: Docker registry password or token

### For Other Services:

- `JWT_SECRET`: JWT signing secret (if needed in CI)
- `REDIS_URL`: Redis connection string (if needed)
- `EVENTSTORE_CONNECTION_STRING`: EventStore connection string (if needed)

## Testing Secrets

After adding secrets, you can test them by:

1. **Running the deploy workflow manually**:
   - Go to **Actions** tab
   - Select **Deploy** workflow
   - Click **Run workflow**
   - Select environment (staging or production)
   - The workflow will use the secrets automatically

2. **Running the migrations workflow**:
   - Go to **Actions** tab
   - Select **Database Migrations** workflow
   - Click **Run workflow**
   - Select environment
   - The workflow will use the secrets automatically

## Troubleshooting

### Secret Not Found Error

If you see an error like `Secret not found: POSTGRESQL_URI_STAGING`:

1. Check the secret name matches exactly (case-sensitive)
2. Verify the secret exists in **Settings** → **Secrets and variables** → **Actions**
3. Ensure you're using the correct environment name in the workflow

### Connection Failed Error

If the workflow fails to connect to the database:

1. Verify the connection string format is correct
2. Check that the database is accessible from GitHub Actions runners
3. Ensure firewall rules allow connections from GitHub IPs
4. Verify username and password are correct

### Permission Denied

If you can't add secrets:

1. Ensure you have **Admin** access to the repository
2. Check that repository secrets are enabled (Settings → Actions → General)

## Next Steps

After adding secrets:

1. ✅ Test the CI pipeline with a PR
2. ✅ Set up branch protection rules
3. ✅ Test deployment workflow manually
4. ✅ Document your deployment process

## Related Documentation

- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [CI_CD_SETUP.md](../CI_CD_SETUP.md) - Complete CI/CD setup guide
- [PRODUCTION_READINESS_CHECKLIST.md](../PRODUCTION_READINESS_CHECKLIST.md) - Production readiness checklist

