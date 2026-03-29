$ErrorActionPreference = "Stop"

Write-Host "Starting Monorepo Migration..."

# 1. Create Directories
New-Item -ItemType Directory -Force -Path "apps\patient"
New-Item -ItemType Directory -Force -Path "apps\admin"
New-Item -ItemType Directory -Force -Path "apps\hospital"
New-Item -ItemType Directory -Force -Path "packages\db\src"
New-Item -ItemType Directory -Force -Path "packages\shared\src"

# 2. Extract DB Package
Write-Host "Extracting DB Package..."
Move-Item -Path "src\db\*" -Destination "packages\db\src\" -Force
Move-Item -Path "drizzle.config.ts" -Destination "packages\db\" -Force

# Create packages/db/package.json
$dbPackageJson = @"
{
  "name": "@caresync/db",
  "version": "1.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "drizzle-orm": "^0.45.1",
    "mysql2": "^3.20.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.9"
  }
}
"@
Set-Content -Path "packages\db\package.json" -Value $dbPackageJson

# 3. Move Patient App Files
Write-Host "Moving files to apps/patient..."
$itemsToMove = @("src", "public", "next.config.ts", "postcss.config.mjs", "tsconfig.json", "eslint.config.mjs", "next-env.d.ts", "package.json")
foreach ($item in $itemsToMove) {
    if (Test-Path $item) {
        Move-Item -Path $item -Destination "apps\patient\" -Force
    }
}

# Update apps/patient/package.json
$patientPkg = Get-Content -Path "apps\patient\package.json" | ConvertFrom-Json
$patientPkg.name = "patient-app"
$patientPkg.scripts.dev = "next dev -p 3000"
$patientPkg.dependencies | Add-Member -Type NoteProperty -Name "@caresync/db" -Value "*"
$patientPkg | ConvertTo-Json -Depth 10 | Set-Content -Path "apps\patient\package.json"

# 4. Clone to Hospital App
Write-Host "Cloning to apps/hospital..."
Copy-Item -Path "apps\patient\*" -Destination "apps\hospital\" -Recurse -Force
$hospitalPkg = Get-Content -Path "apps\hospital\package.json" | ConvertFrom-Json
$hospitalPkg.name = "hospital-app"
$hospitalPkg.scripts.dev = "next dev -p 5000"
$hospitalPkg | ConvertTo-Json -Depth 10 | Set-Content -Path "apps\hospital\package.json"

# 5. Clone to Admin App
Write-Host "Cloning to apps/admin..."
Copy-Item -Path "apps\patient\*" -Destination "apps\admin\" -Recurse -Force
$adminPkg = Get-Content -Path "apps\admin\package.json" | ConvertFrom-Json
$adminPkg.name = "admin-app"
$adminPkg.scripts.dev = "next dev -p 4000"
$adminPkg | ConvertTo-Json -Depth 10 | Set-Content -Path "apps\admin\package.json"

# 6. Create Root files
Write-Host "Creating Root files..."
$rootPackageJson = @"
{
  "name": "caresync-monorepo",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "^1.11.0"
  }
}
"@
Set-Content -Path "package.json" -Value $rootPackageJson

$turboJson = @"
{
  "`$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "lint": {},
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
"@
Set-Content -Path "turbo.json" -Value $turboJson

Write-Host "Migration script completed."
