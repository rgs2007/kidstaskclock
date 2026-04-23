Kids Task Clock

This is an attempt to build a clock based on tasks so kids can start to grasp the idea of time passing by sensing how long it takes to finish a task while following an indicator on screen.

Current GitHub Pages version:
https://rgs2007.github.io/kidstaskclock/

## AWS deployment pipeline

This repo now includes an AWS deployment pipeline for the static site:

- GitHub Actions workflow: `.github/workflows/deploy-aws.yml`
- One-time OIDC bootstrap helper: `scripts/bootstrap-github-oidc.ps1`

The pipeline deploys this site to:

- An S3 bucket configured for static website hosting
- A GitHub Actions workflow that uploads everything inside `src/` on every push to `main`

## One-time setup

1. Make sure you can run AWS CLI commands with credentials that have permission to create IAM and S3 resources.
2. Run the bootstrap script from the repo root:

```powershell
.\scripts\bootstrap-github-oidc.ps1 `
  -AwsAccountId 123456789012 `
  -GitHubOwner rgs2007 `
  -GitHubRepo kidstaskclock `
  -SiteBucketName your-unique-site-bucket-name
```

3. In GitHub, add this repository secret:

```text
AWS_ROLE_ARN
```

4. In GitHub, add these repository variables:

```text
AWS_REGION=us-east-1
SITE_BUCKET_NAME=<globally-unique-bucket-name>
```

Notes:

- `SITE_BUCKET_NAME` must be globally unique across AWS.
- This setup uses S3 website hosting directly, so the site URL will be `http`, not `https`.
- The IAM trust policy created by the script is scoped to the `main` branch of this repo.

## How deployment works

When you push to `main` or run the workflow manually:

1. GitHub Actions assumes the AWS IAM role using OIDC.
2. The workflow syncs the contents of `src/` to the S3 website bucket.
3. The updated files are immediately available on the S3 website endpoint.

## First deployment

After the GitHub secret and variables are configured, either:

- push a commit to `main`, or
- run the `Deploy to AWS` workflow manually from the Actions tab.

After the bootstrap script completes, it prints the website URL. Each deploy workflow run also prints that URL in the job summary.
