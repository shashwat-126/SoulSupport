param(
  [string]$BaseUrl = "http://localhost:5000/api",
  [switch]$EmailDisable
)

$ErrorActionPreference = 'Stop'

if ($EmailDisable) {
  Write-Host "EMAIL_DISABLE=true (set in env before running server)" -ForegroundColor Yellow
}

$headersJson = @{ 'Content-Type' = 'application/json' }
function Call($method, $url, $body, $headers) {
  try {
    if ($body) {
      return Invoke-RestMethod -Method $method -Uri $url -Headers $headers -Body ($body | ConvertTo-Json -Depth 6)
    } else {
      return Invoke-RestMethod -Method $method -Uri $url -Headers $headers
    }
  } catch {
    Write-Host "ERR $method $url" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
      $resp = $_.Exception.Response.GetResponseStream()
      $reader = New-Object System.IO.StreamReader($resp)
      $reader.ReadToEnd() | Write-Host
    }
    throw
  }
}

$rand = Get-Random -Maximum 999999
$theraEmail = "thera$rand@example.com"
$userEmail  = "user$rand@example.com"

Write-Host "Using base $BaseUrl" -ForegroundColor Cyan
Write-Host "Therapist: $theraEmail" -ForegroundColor Cyan
Write-Host "User: $userEmail" -ForegroundColor Cyan

$t = Call Post "$BaseUrl/auth/register" @{ email=$theraEmail; password='Passw0rd!'; fullName='Thera One'; userType='therapist'; bio='bio' } $headersJson
$theraToken = $t.data.token; $theraId = $t.data.user._id
Write-Host "therapistId=$theraId" -ForegroundColor Green

$u = Call Post "$BaseUrl/auth/register" @{ email=$userEmail; password='Passw0rd!'; fullName='User One'; userType='user' } $headersJson
$userToken = $u.data.token; $userId = $u.data.user._id
Write-Host "userId=$userId" -ForegroundColor Green

$hT = @{ Authorization = "Bearer $theraToken" }
$hU = @{ Authorization = "Bearer $userToken" }

$p = Call Post "$BaseUrl/forum/posts" @{ content='Hello forum'; category='general'; isAnonymous=$false } ($headersJson + $hU)
$postId = $p.data.post._id
Write-Host "postId=$postId" -ForegroundColor Green
Call Post "$BaseUrl/forum/posts/$postId/like" $null $hT | Out-Null
$c = Call Post "$BaseUrl/forum/posts/$postId/comments" @{ content='Nice'; isAnonymous=$false } ($headersJson + $hT)
$commentId = $c.data.comment._id
if (-not $commentId) { throw "Missing comment id" }
Call Delete "$BaseUrl/forum/posts/$postId/comments/$commentId" $null $hT | Out-Null
Call Put "$BaseUrl/forum/posts/$postId" @{ content='Updated' } ($headersJson + $hU) | Out-Null

$r = Call Post "$BaseUrl/resources" @{ title='Guide'; description='desc'; type='guide'; category='general'; url='https://example.com' } ($headersJson + $hT)
$resourceId = $r.data.resource._id
Write-Host "resourceId=$resourceId" -ForegroundColor Green
Call Get "$BaseUrl/resources" $null $null | Out-Host

$s = Call Post "$BaseUrl/sessions" @{ therapistId=$theraId; sessionDate=(Get-Date).AddHours(2).ToString('o'); durationMinutes=60 } ($headersJson + $hU)
$sessionId = $s.data.session._id
Write-Host "sessionId=$sessionId" -ForegroundColor Green
Call Put "$BaseUrl/sessions/$sessionId/status" @{ status='confirmed'; meetingLink='https://meet.example.com/abc' } ($headersJson + $hT) | Out-Null
Call Put "$BaseUrl/sessions/$sessionId/status" @{ status='completed' } ($headersJson + $hT) | Out-Null

Call Post "$BaseUrl/reviews" @{ sessionId=$sessionId; rating=5; reviewText='Great' } ($headersJson + $hU) | Out-Host
Call Get  "$BaseUrl/reviews/therapist/$theraId" $null $null | Select-Object -First 1 | Out-Host
Call Get  "$BaseUrl/notifications" $null $hT | Out-Host

Write-Host "Smoke test finished" -ForegroundColor Green
