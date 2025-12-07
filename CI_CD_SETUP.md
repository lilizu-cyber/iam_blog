# CI/CD Pipeline Setup Guide

This guide explains how to set up and use the CI/CD pipeline for the IAM Blog application.

## Overview

The CI/CD pipeline includes:
- **Automated Testing**: Unit, integration, E2E, and security tests
- **Database Migrations**: Automated migration execution
- **Deployment**: Manual deployment workflows

## GitHub Actions Workflows

### 1. CI - Automated Testing (`ci.yml`)

**Triggers**: 
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs**:
1. **Lint & Code Quality**: Code linting checks
2. **Unit Tests**: Runs all unit tests
3. **Integration Tests**: Runs integration tests with PostgreSQL service
4. **Security Tests**: Runs sanitization and security header tests
5. **E2E Tests**: Runs Playwright end-to-end tests
6. **Build Check**: Verifies the application builds successfully

### 2. Database Migrations (`migrations.yml`)

**Trigger**: Manual workflow dispatch

**Purpose**: Run database migrations on staging or production

**Usage**:
1. Go to GitHub Actions → "Database Migrations" workflow
2. Click "Run workflow"
3. Select environment (staging/production)
4. Type "yes" to confirm
5. Click "Run workflow"

### 3. Deploy (`deploy.yml`)

**Trigger**: Manual workflow dispatch

**Purpose**: Deploy the application to staging or production

**Usage**:
1. Go to GitHub Actions → "Deploy" workflow
2. Click "Run workflow"
3. Select environment
4. Choose whether to run migrations
5. Click "Run workflow"

## Setup Instructions

### Step 1: Enable GitHub Actions

1. Go to your GitHub repository
2. Navigate to **Settings** → **Actions** → **General**
3. Enable "Allow all actions and reusable workflows"
4. Save changes

### Step 2: Configure Secrets

Go to **Settings** → **Secrets and variables** → **Actions** and add:

#### Required Secrets

**For Staging:**
- `POSTGRESQL_URI_STAGING`: PostgreSQL connection string for staging
  ```
  postgresql://user:password@host:port/database
  ```

**For Production:**
- `POSTGRESQL_URI_PRODUCTION`: PostgreSQL connection string for production
  ```
  postgresql://user:password@host:port/database
  ```

#### Optional Secrets (for deployment)

If you're using SSH deployment:
- `SSH_HOST`: Server hostname or IP
- `SSH_USERNAME`: SSH username
- `SSH_PRIVATE_KEY`: SSH private key

If you're using Docker:
- `DOCKER_REGISTRY`: Docker registry URL
- `DOCKER_USERNAME`: Docker registry username
- `DOCKER_PASSWORD`: Docker registry password

### Step 3: Test the CI Pipeline

1. **Create a test branch**:
   ```bash
   git checkout -b test-ci-pipeline
   ```

2. **Make a small change** (e.g., update README):
   ```bash
   echo "# Test CI" >> README.md
   git add README.md
   git commit -m "Test CI pipeline"
   git push origin test-ci-pipeline
   ```

3. **Create a Pull Request** to `main` or `develop`

4. **Check GitHub Actions**:
   - Go to **Actions** tab in GitHub
   - You should see the CI workflow running
   - All tests should pass

### Step 4: Test Database Migrations

1. Go to **Actions** → **Database Migrations**
2. Click **Run workflow**
3. Select **staging** (or create a test environment)
4. Type **yes** in the confirmation field
5. Click **Run workflow**
6. Monitor the workflow execution

### Step 5: Configure Deployment

Edit `.github/workflows/deploy.yml` and uncomment/configure the deployment method you're using:

#### Option A: SSH Deployment

```yaml
- name: Deploy via SSH
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.SSH_HOST }}
    username: ${{ secrets.SSH_USERNAME }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    script: |
      cd /path/to/app
      git pull
      npm install --production
      npm run migrate:up
      pm2 restart iam-blog
```

#### Option B: Docker Deployment

```yaml
- name: Build and push Docker image
  run: |
    docker build -t iam-blog:${{ github.sha }} .
    docker push iam-blog:${{ github.sha }}

- name: Deploy to container platform
  # Add your container platform deployment steps
```

#### Option C: Cloud Platform (Vercel, Netlify, etc.)

Use platform-specific actions:
- Vercel: `amondnet/vercel-action`
- Netlify: `netlify/actions/cli`
- AWS: `aws-actions/configure-aws-credentials`

## Workflow Details

### CI Workflow

The CI workflow runs automatically on every push and pull request. It:

1. **Lints code** (if linting is configured)
2. **Runs unit tests** with coverage
3. **Runs integration tests** with a PostgreSQL service container
4. **Runs security tests** (sanitization, security headers)
5. **Runs E2E tests** with Playwright
6. **Builds the application** to verify it compiles

### Migration Workflow

The migration workflow:

1. **Checks confirmation** (requires typing "yes")
2. **Checks migration status** before running
3. **Runs pending migrations** on the selected environment
4. **Verifies migration status** after completion
5. **Notifies on success/failure**

### Deployment Workflow

The deployment workflow:

1. **Runs migrations** (if selected)
2. **Builds the application**
3. **Deploys to the selected environment**

## Environment Variables

### Test Environment

The CI workflow uses these test environment variables:
- `POSTGRESQL_URI`: `postgresql://postgres:postgres@localhost:5432/iam_blog_db_test`
- `NODE_ENV`: `test`
- `JWT_SECRET`: `test-jwt-secret-for-ci`

### Staging/Production

Configure these in GitHub Secrets:
- `POSTGRESQL_URI_STAGING`
- `POSTGRESQL_URI_PRODUCTION`
- `JWT_SECRET` (if different from database connection)
- Other environment-specific variables

## Troubleshooting

### CI Tests Failing

1. **Check test logs** in GitHub Actions
2. **Run tests locally**:
   ```bash
   npm run test:unit
   npm run test:integration
   npm run test:e2e
   ```

3. **Check environment variables** are set correctly

### Migration Failures

1. **Check database connection**:
   - Verify `POSTGRESQL_URI` secret is correct
   - Ensure database is accessible from GitHub Actions

2. **Check migration files**:
   - Ensure all migration files are committed
   - Verify migration order (timestamp-based)

3. **Manual migration check**:
   ```bash
   npm run migrate:status
   ```

### Deployment Failures

1. **Check deployment method** is configured correctly
2. **Verify secrets** are set
3. **Check server access** (SSH keys, permissions)
4. **Review deployment logs** in GitHub Actions

## Best Practices

1. **Always test locally** before pushing
2. **Run migrations manually first** on staging before production
3. **Monitor CI/CD runs** for failures
4. **Keep secrets secure** - never commit them
5. **Use branch protection** rules to require CI passing
6. **Review deployment logs** after each deployment

## Branch Protection

Recommended branch protection rules:

1. Go to **Settings** → **Branches**
2. Add rule for `main` branch:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
     - Select: "CI - Automated Testing"
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators

## Next Steps

1. ✅ Set up GitHub Secrets
2. ✅ Test CI pipeline with a PR
3. ✅ Configure deployment method
4. ✅ Set up branch protection
5. ✅ Document your deployment process

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Sequelize Migrations](https://sequelize.org/docs/v6/other-topics/migrations/)
- [Playwright CI/CD](https://playwright.dev/docs/ci)

