# How to Add This Codebase to GitHub

This guide will walk you through adding your IAM Blog codebase to GitHub as a new repository.

## Prerequisites

- A GitHub account ([sign up here](https://github.com/signup) if you don't have one)
- Git installed on your computer (check with `git --version`)

## Step-by-Step Instructions

### Step 1: Create a New Repository on GitHub

1. **Go to GitHub** and sign in
2. **Click the "+" icon** in the top right corner
3. **Select "New repository"**
4. **Fill in the repository details**:
   - **Repository name**: `iam_blog` (or any name you prefer)
   - **Description**: "IAM and Cybersecurity Blog with CQRS and Event-Driven Architecture"
   - **Visibility**: Choose **Public** or **Private**
   - **DO NOT** check "Initialize this repository with a README" (we already have files)
   - **DO NOT** add .gitignore or license (we already have them)
5. **Click "Create repository"**

### Step 2: Initialize Git in Your Project (if not already done)

Open your terminal/command prompt in the project directory and run:

```bash
# Navigate to your project directory (if not already there)
cd C:\Users\drilo\Documents\projects\iam_blog

# Check if Git is already initialized
git status
```

**If you see "fatal: not a git repository"**, initialize Git:

```bash
git init
```

**If Git is already initialized but tracking the wrong directory**, you may need to reinitialize:

```bash
# Remove existing Git tracking (if needed)
# WARNING: Only do this if Git is tracking the wrong directory
# rm -rf .git  # On Linux/Mac
# Remove-Item -Recurse -Force .git  # On Windows PowerShell

# Then reinitialize
git init
```

### Step 3: Add All Files to Git

```bash
# Add all files (respecting .gitignore)
git add .

# Check what will be committed
git status
```

You should see your project files listed. Files in `.gitignore` (like `node_modules`, `.env`, etc.) will NOT be added.

### Step 4: Create Your First Commit

```bash
# Create the initial commit
git commit -m "Initial commit: IAM Blog with CQRS architecture"
```

### Step 5: Connect to GitHub Repository

After creating the repository on GitHub, you'll see a page with setup instructions. Use the **"push an existing repository"** option:

```bash
# Add GitHub as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/iam_blog.git

# Or if you prefer SSH (requires SSH keys set up):
# git remote add origin git@github.com:YOUR_USERNAME/iam_blog.git

# Verify the remote was added
git remote -v
```

### Step 6: Push Your Code to GitHub

```bash
# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

You'll be prompted for your GitHub username and password (or personal access token).

### Step 7: Verify on GitHub

1. Go to your GitHub repository page
2. You should see all your files
3. Check that the `.github/workflows` folder is there (for CI/CD)

## Troubleshooting

### Issue: "Permission denied" or authentication errors

**Solution**: Use a Personal Access Token instead of password:

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token"
3. Select scopes: `repo` (full control of private repositories)
4. Copy the token
5. Use the token as your password when pushing

### Issue: Git is tracking wrong directory

**Solution**: Make sure you're in the project directory:

```bash
# Check current directory
pwd  # or Get-Location on PowerShell

# Should be: C:\Users\drilo\Documents\projects\iam_blog

# If not, navigate there
cd C:\Users\drilo\Documents\projects\iam_blog
```

### Issue: Large files or node_modules being tracked

**Solution**: Check your `.gitignore` file is working:

```bash
# Check what files Git is tracking
git ls-files | Select-String "node_modules"

# If node_modules is listed, remove it:
git rm -r --cached node_modules
git commit -m "Remove node_modules from tracking"
```

### Issue: "Remote origin already exists"

**Solution**: Remove and re-add the remote:

```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/iam_blog.git
```

## Next Steps After Pushing to GitHub

1. **Set up GitHub Secrets** (for CI/CD):
   - Go to Settings → Secrets and variables → Actions
   - Add `POSTGRESQL_URI_STAGING` and `POSTGRESQL_URI_PRODUCTION`

2. **Enable GitHub Actions**:
   - Go to Settings → Actions → General
   - Enable "Allow all actions and reusable workflows"

3. **Test CI/CD Pipeline**:
   - Create a test branch
   - Make a small change
   - Create a Pull Request
   - Watch the CI pipeline run automatically

4. **Set up Branch Protection** (recommended):
   - Go to Settings → Branches
   - Add rule for `main` branch
   - Require CI checks to pass before merging

## Quick Reference Commands

```bash
# Check Git status
git status

# Add all files
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main

# View commit history
git log --oneline

# Check remote repository
git remote -v
```

## Important Notes

- **Never commit sensitive files**: `.env`, `.env.local`, etc. are in `.gitignore` for a reason
- **Never commit large files**: Database backups, `node_modules`, etc. should not be in Git
- **Use meaningful commit messages**: Describe what changed and why
- **Push regularly**: Don't wait too long between pushes

## Need Help?

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Help](https://docs.github.com)
- [GitHub CLI](https://cli.github.com/) (alternative to web interface)

