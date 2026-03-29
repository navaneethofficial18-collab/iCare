$apps = @("patient", "admin", "hospital")

foreach ($app in $apps) {
    $tsconfig = Get-Content -Path "apps\$app\tsconfig.json" -Raw | ConvertFrom-Json
    if (-not $tsconfig.compilerOptions) { $tsconfig | Add-Member -Type NoteProperty -Name "compilerOptions" -Value @{} }
    if (-not $tsconfig.compilerOptions.paths) { $tsconfig.compilerOptions | Add-Member -Type NoteProperty -Name "paths" -Value @{} }
    
    # Map @/db to packages/db/src
    $tsconfig.compilerOptions.paths | Add-Member -Type NoteProperty -Name "@/db/*" -Value @("../../packages/db/src/*") -Force
    $tsconfig.compilerOptions.paths | Add-Member -Type NoteProperty -Name "@/db" -Value @("../../packages/db/src/index") -Force
    
    $tsconfig | ConvertTo-Json -Depth 10 | Set-Content -Path "apps\$app\tsconfig.json"

    # Update next.config.ts
    $nextConfigPath = "apps\$app\next.config.ts"
    if (Test-Path $nextConfigPath) {
        $content = Get-Content -Path $nextConfigPath -Raw
        if ($content -notmatch "transpilePackages") {
            $content = $content -replace "turbopack: \{\},", "turbopack: {},`n  transpilePackages: ['@caresync/db'],"
            Set-Content -Path $nextConfigPath -Value $content
        }
    }
}
Write-Host "TSConfig and Next.js Config linked successfully."
