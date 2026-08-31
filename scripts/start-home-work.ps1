#Requires -Version 5.1
<#
.SYNOPSIS
    회사 홈페이지 작업 시작 — 홈페이지(3200)와 로그인 포털(3100)을 함께 편다.

.DESCRIPTION
    dss-auth의 start-sso-work.ps1, 계측기의 start-meters-work.ps1과 같은 철학이다.
    엔진 → 설정 → DB → 주소 → 저장소 순으로 하나씩 확인하며 올라간 뒤 서버를 띄운다.
    서버부터 띄우면 DB가 아직 없어 화면이 에러로 뜨고, 사람은 그게 코드 문제인지
    DB 문제인지 구분하지 못한 채 디버깅을 시작한다.

    ── 왜 포털을 함께 켜는가 ────────────────────────────────────────────────
    홈페이지 머리말 오른쪽 위 [사내 시스템] 버튼이 포털(3100)로 간다. 포털이
    꺼져 있으면 버튼은 그대로 보이는데 누르면 아무 데도 닿지 않는다. 손님이 보는
    화면은 멀쩡하고 직원용 문만 막힌 상태라, 홈페이지만 보고 있으면 알아채기 어렵다.

    창이 셋으로 나뉜다. 한 창에 다 넣으면 두 서버의 로그가 뒤섞인다.

      이 창              회사 홈페이지 개발 서버 (3200)
      두 번째 창          로그인 포털 (3100)
      세 번째 창          Claude Code — 회사 홈페이지

    ── A/S 시스템은 부르지 않는다 ──────────────────────────────────────────
    손님이 낸 수리 의뢰를 사내가 당겨가는 길(nas-sync)은 **언제나 A/S 쪽이 먼저
    건다.** 여기서 저쪽을 켤 이유가 없고, 홈페이지만 볼 때 3000번까지 뜨면 무거워진다.
    당겨오기까지 확인하려면 바탕화면 '작업 시작'의 **0. 전부 한 번에**를 쓴다.

    ── 마이그레이션을 자동 적용하지 않는 이유 ──────────────────────────────
    다른 세 시스템과 같다. 적용 대기가 있으면 알려만 준다. 아침에 창 하나 열었을
    뿐인데 표가 바뀌어 있으면 안 된다.

.PARAMETER WithClaude
    Claude Code를 별도 창으로 띄운다. 바탕화면 단축어는 이걸 켜서 부른다.

.PARAMETER NoServer
    서버는 띄우지 않고 상태 확인까지만 한다.

.PARAMETER SkipPortal
    로그인 포털은 띄우지 않는다. 이미 켜 두었거나, 부르는 쪽이 따로 켤 때 쓴다.

.EXAMPLE
    npm run work:start
    .\scripts\start-home-work.ps1 -WithClaude
    .\scripts\start-home-work.ps1 -NoServer
#>
[CmdletBinding()]
param(
    [switch]$WithClaude,
    [switch]$NoServer,
    [switch]$SkipPortal
)

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}

$RepoRoot      = Split-Path -Parent $PSScriptRoot
$DevRoot       = Split-Path -Parent $RepoRoot
$SsoRepo       = Join-Path $DevRoot 'dss-auth'
$SsoStart      = Join-Path $SsoRepo 'scripts\start-sso-work.ps1'
$Container     = 'dss-home-postgres-dev'
$DevPort       = 3200
$DevUrl        = "http://localhost:$DevPort"
$PortalPort    = 3100
$EnvFile       = Join-Path $RepoRoot '.env.local'
$DockerDesktop = Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\Docker Desktop.exe'

# 네이티브 명령은 cmd를 거쳐 부른다. Windows PowerShell 5.1은 exe의 stderr를
# ErrorRecord로 감싸면서 성공한 명령도 실패로 보이게 만들기 때문이다.
function Invoke-Native([string]$CommandLine) {
    $out = & cmd.exe /c "$CommandLine 2>&1"
    [pscustomobject]@{ Output = ($out -join "`n").Trim(); ExitCode = $LASTEXITCODE }
}

function Write-Step([string]$Text)  { Write-Host ""; Write-Host "▶ $Text" -ForegroundColor Cyan }
function Write-Ok([string]$Text)    { Write-Host "  ✔ $Text" -ForegroundColor Green }
function Write-Warn2([string]$Text) { Write-Host "  ⚠ $Text" -ForegroundColor Yellow }
function Write-Info([string]$Text)  { Write-Host "    $Text" -ForegroundColor DarkGray }

Set-Location $RepoRoot
Write-Host ""
Write-Host "════ 회사 홈페이지 작업 시작 ════" -ForegroundColor White
Write-Host "  $RepoRoot" -ForegroundColor DarkGray

# ── 1. Docker 엔진 ────────────────────────────────────────────────────────
Write-Step "Docker 엔진 확인"
if ((Invoke-Native 'docker info --format "{{.ServerVersion}}"').ExitCode -ne 0) {
    if (Test-Path $DockerDesktop) {
        Write-Info "Docker Desktop을 켜는 중… (처음이면 1분 정도)"
        Start-Process $DockerDesktop | Out-Null
        $ready = $false
        foreach ($i in 1..90) {
            Start-Sleep -Seconds 2
            if ((Invoke-Native 'docker info --format "{{.ServerVersion}}"').ExitCode -eq 0) { $ready = $true; break }
            if ($i % 10 -eq 0) { Write-Info "아직 준비 중… ($($i*2)초)" }
        }
        if (-not $ready) {
            Write-Warn2 "Docker가 아직 준비되지 않았습니다. 켜진 뒤 다시 실행하세요."
            exit 1
        }
    } else {
        Write-Warn2 "Docker Desktop을 찾을 수 없습니다: $DockerDesktop"
        Write-Info "직접 실행한 뒤 이 스크립트를 다시 돌려 주세요."
        exit 1
    }
}
Write-Ok "실행 중"

# ── 2. 설정 파일 ──────────────────────────────────────────────────────────
# DB보다 먼저 본다. DEV_POSTGRES_PASSWORD가 비어 있으면 컨테이너가 재시작
# 루프에 빠지는데, 그때 화면에 나오는 것은 "비밀번호가 없다"가 아니라 그냥
# 죽는 컨테이너다. 원인을 여기서 미리 알려 준다.
Write-Step "설정 확인"
$envValues = @{}
if (-not (Test-Path $EnvFile)) {
    Write-Warn2 ".env.local이 없습니다. .env.example을 복사해 채우세요."
    Write-Info "copy .env.example .env.local"
    exit 1
}
foreach ($line in (Get-Content $EnvFile)) {
    if ($line -match '^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$') { $envValues[$Matches[1]] = $Matches[2].Trim() }
}
Write-Ok ".env.local 있음"

if (-not $envValues['DEV_POSTGRES_PASSWORD']) {
    Write-Warn2 "DEV_POSTGRES_PASSWORD가 비어 있습니다. DB 컨테이너가 재시작 루프에 빠집니다."
    Write-Info "DATABASE_URL 안의 비밀번호와 같은 값을 넣으세요."
    exit 1
}

# 값은 절대 찍지 않는다 — 길이만 본다. 이 열쇠로 손님의 수리 의뢰를 읽을 수 있다.
$syncSecret = $envValues['NAS_SYNC_SECRET']
if (-not $syncSecret) {
    Write-Warn2 "NAS_SYNC_SECRET이 비어 있습니다 — A/S 시스템이 의뢰를 당겨가지 못합니다(401)."
    Write-Info "A/S 쪽 .env.local의 DSS_HOME_SYNC_SECRET과 같은 값이어야 합니다."
} elseif ($syncSecret.Length -lt 32) {
    Write-Warn2 "NAS_SYNC_SECRET이 $($syncSecret.Length)자로 짧습니다 (32자 이상)."
} else {
    Write-Ok "사내와 주고받는 공유 비밀 설정됨 ($($syncSecret.Length)자)"
}

# ── 3. 홈페이지 DB ────────────────────────────────────────────────────────
Write-Step "홈페이지 DB 확인"
# docker compose를 직접 부르지 않는다. compose는 .env만 자동으로 읽고
# .env.local은 읽지 않아, 비밀번호가 빈 값으로 들어가 재시작 루프에 빠진다.
# db:up 스크립트가 --env-file을 붙여 준다.
$up = Invoke-Native 'npm run --silent db:up'
if ($up.ExitCode -ne 0) {
    Write-Warn2 "DB를 띄우지 못했습니다."
    $up.Output -split "`n" | ForEach-Object { Write-Info $_ }
    exit 1
}

$healthy = $false
foreach ($i in 1..30) {
    $state = (Invoke-Native "docker inspect --format ""{{.State.Health.Status}}"" $Container").Output
    if ($state -eq 'healthy') { $healthy = $true; break }
    Start-Sleep -Seconds 2
}
if ($healthy) {
    Write-Ok "준비됨 (127.0.0.1:5436)"
} else {
    Write-Warn2 "DB가 아직 준비되지 않았습니다. 잠시 뒤 다시 확인하세요."
    Write-Info "docker logs $Container --tail 30 으로 원인을 볼 수 있습니다."
}

# ── 4. [사내 시스템] 버튼이 향하는 주소 ───────────────────────────────────
# Wi-Fi가 바뀌면 이 주소가 어제 것으로 남는다. 홈페이지는 멀쩡히 뜨고 버튼만
# 죽으므로, 눌러 보기 전에는 아무도 모른다.
Write-Step "포털 주소 점검"
$portal = $envValues['PORTAL_URL']
$portalHost = $null
if ($portal -and $portal -match '://([^:/]+)') { $portalHost = $Matches[1] }

$wifi = $null
try {
    $wifi = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
            Where-Object { $_.InterfaceAlias -like 'Wi-Fi*' -and $_.PrefixOrigin -eq 'Dhcp' } |
            Select-Object -First 1 -ExpandProperty IPAddress
} catch {}

if (-not $portal) {
    Write-Warn2 ".env.local에 PORTAL_URL이 없습니다. [사내 시스템] 버튼이 갈 곳을 잃습니다."
} else {
    Write-Info "포털 주소     $portal"
    if ($wifi) { Write-Info "현재 Wi-Fi    $wifi" }

    if ($portalHost -eq 'localhost' -or $portalHost -eq '127.0.0.1') {
        Write-Ok "이 PC에서만 쓰는 설정입니다"
        Write-Info "폰이나 동료 PC에서 열려면 Wi-Fi 주소로 바꿔야 합니다."
    } elseif ($portalHost -match '^\d+\.\d+\.\d+\.\d+$' -and $wifi -and $portalHost -ne $wifi) {
        Write-Host ""
        Write-Warn2 "Wi-Fi 주소가 바뀌었습니다. [사내 시스템] 버튼이 죽은 주소로 갑니다."
        Write-Host ""
        Write-Info "고칠 곳:"
        Write-Info "  1. dss-home\.env.local  PORTAL_URL=http://$wifi`:$PortalPort"
        Write-Info "  2. 포털 자신의 주소(dss-auth\.env.local, 카카오 콘솔)도 함께 —"
        Write-Info "     포털 창이 뜨면서 무엇을 고쳐야 하는지 그 자리에 적어 줍니다."
        Write-Host ""
    } elseif ($wifi -and $portalHost -eq $wifi) {
        Write-Ok "현재 Wi-Fi 주소와 일치합니다"
    } elseif (-not $wifi) {
        Write-Warn2 "Wi-Fi 주소를 읽지 못했습니다. 직접 확인하세요."
    }
}

# ── 5. 저장소 상태 ────────────────────────────────────────────────────────
Write-Step "저장소 상태"
$commit = (Invoke-Native 'git log -1 --format="%h  %ad  %s" --date=format:"%Y-%m-%d %H:%M"').Output
if ($commit) { Write-Info "마지막 커밋  $commit" }
$branch = (Invoke-Native 'git rev-parse --abbrev-ref HEAD').Output
$dirty  = @((Invoke-Native 'git status --porcelain').Output -split "`n" | Where-Object { $_ -ne '' }).Count
Write-Info "브랜치       $branch"
if ($dirty -gt 0) { Write-Warn2 "커밋 안 된 파일 $($dirty)개" } else { Write-Ok "정리된 상태" }

$remotes = @((Invoke-Native 'git remote').Output -split "`n" | Where-Object { $_ -ne '' })
if ($remotes.Count -eq 0) { Write-Warn2 "원격 저장소가 없습니다 — 커밋이 전부 이 PC에만 있습니다" }

# 적용은 자동으로 하지 않는다. 다른 세 시스템과 같은 이유다.
$migrations = @(Get-ChildItem -Path (Join-Path $RepoRoot 'drizzle') -Filter '*.sql' -ErrorAction SilentlyContinue)
if ($migrations.Count -gt 0) { Write-Info "마이그레이션 파일 $($migrations.Count)개 — 적용은 npm run db:migrate" }

if ($NoServer) {
    Write-Host ""
    Write-Host "준비 완료 (서버는 띄우지 않음). 띄우려면: npm run dev" -ForegroundColor White
    exit 0
}

# ── 6. 로그인 포털 (별도 창) ──────────────────────────────────────────────
# 포털 쪽 스크립트가 자기 Docker·DB·서명키 점검을 이미 잘 하고 있으므로 그대로
# 부른다. -SkipAsSystem은 A/S 시스템까지 딸려 오지 않게 한다 — [사내 시스템]
# 버튼이 닿아야 할 곳은 포털뿐이다.
if (-not $SkipPortal) {
    Write-Step "로그인 포털 시작"
    if (Test-Path $SsoStart) {
        $listening = Get-NetTCPConnection -LocalPort $PortalPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($listening) {
            Write-Ok "이미 켜져 있음 (http://localhost:$PortalPort)"
        } else {
            Start-Process cmd -ArgumentList '/c', "title DSS 통합 로그인 - 서버 && cd /d `"$SsoRepo`" && powershell -NoProfile -ExecutionPolicy Bypass -File `"$SsoStart`" -SkipAsSystem" | Out-Null
            Write-Ok "별도 창에서 실행 중 (http://localhost:$PortalPort)"
            Write-Info "그 창이 Docker·DB·서명키를 점검한 뒤 서버를 띄웁니다."
        }
    } else {
        Write-Warn2 "포털 시작 스크립트를 찾을 수 없습니다: $SsoStart"
        Write-Info "포털 없이는 [사내 시스템] 버튼이 닿을 곳이 없습니다."
    }
}

# ── 7. Claude Code (선택) ─────────────────────────────────────────────────
if ($WithClaude) {
    Write-Step "Claude Code 실행"
    $claude = (Get-Command claude -ErrorAction SilentlyContinue)
    if (-not $claude) {
        Write-Warn2 "claude 명령을 찾을 수 없어 건너뜁니다."
        Write-Info "설치: npm install -g @anthropic-ai/claude-code"
    } else {
        # 개발 서버가 이 창을 계속 쓰므로 Claude는 별도 창으로 띄운다.
        # Claude는 켜진 폴더를 작업 폴더로 삼는다 — 그래서 저장소 안에서 띄운다.
        Start-Process cmd -ArgumentList '/c', "title Claude - 회사 홈페이지 && cd /d `"$RepoRoot`" && claude" | Out-Null
        Write-Ok "별도 창에서 실행 중 (작업 폴더: dss-home)"
    }
}

# ── 8. 홈페이지 개발 서버 ─────────────────────────────────────────────────
Write-Step "회사 홈페이지 서버 시작"
Write-Info "$DevUrl — 이 창을 닫으면 서버도 꺼집니다."
Write-Host ""

# 서버가 실제로 응답하면 그때 브라우저를 연다. 컴파일 전에 열면 빈 화면을 본다.
$waiter = @"
foreach (`$i in 1..120) {
    Start-Sleep -Seconds 1
    try {
        Invoke-WebRequest -Uri '$DevUrl' -UseBasicParsing -TimeoutSec 2 | Out-Null
        Start-Process '$DevUrl'
        break
    } catch {}
}
"@
Start-Process powershell -WindowStyle Hidden -ArgumentList '-NoProfile', '-Command', $waiter | Out-Null

& npm run dev
