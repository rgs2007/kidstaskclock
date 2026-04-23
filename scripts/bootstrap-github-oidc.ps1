param(
    [Parameter(Mandatory = $true)]
    [string]$AwsAccountId,

    [Parameter(Mandatory = $true)]
    [string]$GitHubOwner,

    [Parameter(Mandatory = $true)]
    [string]$GitHubRepo,

    [string]$Branch = "main",

    [string]$RoleName = "kidstaskclock-github-actions-role",

    [string]$AwsRegion = "us-east-1",
    
    [Parameter(Mandatory = $true)]
    [string]$SiteBucketName
)

$ErrorActionPreference = "Stop"

function Invoke-AwsCli {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Arguments
    )

    & aws @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "AWS CLI command failed: aws $($Arguments -join ' ')"
    }
}

$providerUrl = "https://token.actions.githubusercontent.com"
$providerArn = "arn:aws:iam::$AwsAccountId`:oidc-provider/token.actions.githubusercontent.com"
$repoSubject = "repo:$GitHubOwner/$GitHubRepo`:ref:refs/heads/$Branch"

Write-Host "Checking for GitHub OIDC provider..."
$providerExists = $false
try {
    Invoke-AwsCli iam get-open-id-connect-provider --open-id-connect-provider-arn $providerArn | Out-Null
    $providerExists = $true
} catch {
    $providerExists = $false
}

if (-not $providerExists) {
    Write-Host "Creating GitHub OIDC provider..."
    Invoke-AwsCli iam create-open-id-connect-provider `
        --url $providerUrl `
        --client-id-list sts.amazonaws.com `
        --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 | Out-Null
}

Write-Host "Ensuring site bucket exists..."
$siteBucketExists = $true
try {
    Invoke-AwsCli s3api head-bucket --bucket $SiteBucketName 2>$null | Out-Null
} catch {
    $siteBucketExists = $false
}

if (-not $siteBucketExists) {
    if ($AwsRegion -eq "us-east-1") {
        Invoke-AwsCli s3api create-bucket --bucket $SiteBucketName | Out-Null
    } else {
        Invoke-AwsCli s3api create-bucket `
            --bucket $SiteBucketName `
            --region $AwsRegion `
            --create-bucket-configuration LocationConstraint=$AwsRegion | Out-Null
    }
}

Write-Host "Configuring static website hosting..."
Invoke-AwsCli s3 website "s3://$SiteBucketName/" --index-document index.html | Out-Null

$bucketPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$SiteBucketName/*"
    }
  ]
}
"@

$publicAccessBlockConfiguration = @"
{
  "BlockPublicAcls": false,
  "IgnorePublicAcls": false,
  "BlockPublicPolicy": false,
  "RestrictPublicBuckets": false
}
"@

$trustPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "$providerArn"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "$repoSubject"
        }
      }
    }
  ]
}
"@

$permissionsPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3SiteBucketDeploy",
      "Effect": "Allow",
      "Action": [
        "s3:DeleteObject",
        "s3:GetBucketLocation",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:PutObject"
      ],
      "Resource": [
        "arn:aws:s3:::$SiteBucketName",
        "arn:aws:s3:::$SiteBucketName/*"
      ]
    }
  ]
}
"@

$trustFile = Join-Path $env:TEMP "$RoleName-trust-policy.json"
$policyFile = Join-Path $env:TEMP "$RoleName-permissions-policy.json"
$bucketPolicyFile = Join-Path $env:TEMP "$SiteBucketName-bucket-policy.json"
$publicAccessBlockFile = Join-Path $env:TEMP "$SiteBucketName-public-access-block.json"

Set-Content -LiteralPath $trustFile -Value $trustPolicy -Encoding ascii
Set-Content -LiteralPath $policyFile -Value $permissionsPolicy -Encoding ascii
Set-Content -LiteralPath $bucketPolicyFile -Value $bucketPolicy -Encoding ascii
Set-Content -LiteralPath $publicAccessBlockFile -Value $publicAccessBlockConfiguration -Encoding ascii

Write-Host "Allowing public read access for website files..."
Invoke-AwsCli s3api put-public-access-block `
    --bucket $SiteBucketName `
    --public-access-block-configuration "file://$publicAccessBlockFile" | Out-Null

Invoke-AwsCli s3api put-bucket-policy `
    --bucket $SiteBucketName `
    --policy "file://$bucketPolicyFile" | Out-Null

$roleExists = $false
try {
    Invoke-AwsCli iam get-role --role-name $RoleName | Out-Null
    $roleExists = $true
} catch {
    $roleExists = $false
}

if (-not $roleExists) {
    Write-Host "Creating IAM role $RoleName..."
    Invoke-AwsCli iam create-role `
        --role-name $RoleName `
        --assume-role-policy-document "file://$trustFile" `
        --description "GitHub Actions deploy role for $GitHubOwner/$GitHubRepo" | Out-Null
} else {
    Write-Host "Updating trust policy for IAM role $RoleName..."
    Invoke-AwsCli iam update-assume-role-policy `
        --role-name $RoleName `
        --policy-document "file://$trustFile" | Out-Null
}

Write-Host "Attaching inline permissions policy..."
Invoke-AwsCli iam put-role-policy `
    --role-name $RoleName `
    --policy-name "$RoleName-inline-policy" `
    --policy-document "file://$policyFile" | Out-Null

$roleArn = Invoke-AwsCli iam get-role --role-name $RoleName --query "Role.Arn" --output text

Write-Host ""
Write-Host "Bootstrap complete."
Write-Host "Website URL:"
Write-Host "  http://$SiteBucketName.s3-website-$AwsRegion.amazonaws.com"
Write-Host ""
Write-Host "Set this GitHub secret:"
Write-Host "  AWS_ROLE_ARN = $roleArn"
Write-Host ""
Write-Host "Set these GitHub repository variables:"
Write-Host "  AWS_REGION = $AwsRegion"
Write-Host "  SITE_BUCKET_NAME = $SiteBucketName"
