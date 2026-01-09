<?php
namespace App\Jobs;
use App\Models\ListeningEvent;
use App\Models\MoodDaily;
use App\Models\MoodPattern;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class AnalyzeMoodJob implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  public function __construct(public int $userId) {}

  public function handle(): void
  {
    // 1) Aggregate daily
    $events = ListeningEvent::where('user_id', $this->userId)
      ->where('played_at', '>=', now()->subDays(60))
      ->orderBy('played_at')
      ->get(['played_at','valence','energy']);

    if ($events->isEmpty()) return;

    $daily = [];
    $buckets = []; // dow:bucket

    foreach ($events as $e) {
      $dt = Carbon::parse($e->played_at);
      $day = $dt->toDateString();

      $daily[$day]['valence_sum'] = ($daily[$day]['valence_sum'] ?? 0) + (float)$e->valence;
      $daily[$day]['energy_sum']  = ($daily[$day]['energy_sum'] ?? 0) + (float)$e->energy;
      $daily[$day]['count']       = ($daily[$day]['count'] ?? 0) + 1;

      $hour = (int)$dt->format('H');
      $bucket = $hour < 12 ? 'morning' : ($hour < 18 ? 'afternoon' : 'evening');
      $dow = strtolower($dt->format('l'));
      $k = "$dow:$bucket";

      $buckets[$k]['valence_sum'] = ($buckets[$k]['valence_sum'] ?? 0) + (float)$e->valence;
      $buckets[$k]['energy_sum']  = ($buckets[$k]['energy_sum'] ?? 0) + (float)$e->energy;
      $buckets[$k]['count']       = ($buckets[$k]['count'] ?? 0) + 1;
    }

    foreach ($daily as $day => $agg) {
      $count = $agg['count'];
      MoodDaily::updateOrCreate(
        ['user_id' => $this->userId, 'day' => $day],
        [
          'avg_valence' => $agg['valence_sum'] / $count,
          'avg_energy'  => $agg['energy_sum'] / $count,
          'events_count' => $count,
        ]
      );
    }

    // 2) Pattern detection (fast + explainable)
    $scored = [];
    foreach ($buckets as $key => $b) {
      if (($b['count'] ?? 0) < 20) continue; // avoid noise in demo
      $avgV = $b['valence_sum'] / $b['count'];
      $avgE = $b['energy_sum'] / $b['count'];

      $scored[] = ['key' => $key, 'avgV' => $avgV, 'avgE' => $avgE];
    }

    // Pick top energy bucket & lowest valence bucket
    if ($scored) {
      usort($scored, fn($a,$b) => $b['avgE'] <=> $a['avgE']);
      $topE = $scored[0];

      usort($scored, fn($a,$b) => $a['avgV'] <=> $b['avgV']);
      $lowV = $scored[0];

      $this->savePattern('high_energy', $topE, 'High Energy');
      $this->savePattern('low_valence', $lowV, 'Low Valence');
    }
  }

  private function savePattern(string $suffix, array $item, string $label): void
  {
    [$dow, $bucket] = explode(':', $item['key']);
    $patternKey = "{$dow}_{$bucket}_{$suffix}";

    MoodPattern::updateOrCreate(
      ['user_id' => $this->userId, 'pattern_key' => $patternKey],
      [
        'title' => ucfirst($dow) . ' ' . ucfirst($bucket) . " $label",
        'summary' => "Detected a recurring $label trend during {$dow} {$bucket}s based on your listening behavior.",
        'meta' => ['avg_energy' => $item['avgE'], 'avg_valence' => $item['avgV']],
      ]
    );
  }
}