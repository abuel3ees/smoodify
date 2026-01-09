<?php

namespace App\Http\Controllers;

use App\Jobs\AnalyzeMoodJob;
use App\Models\ListeningEvent;
use App\Models\MoodDaily;
use App\Models\MoodPattern;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use App\Http\Controllers\Controller;

class DemoDataController extends Controller
{
  public function generate(Request $request)
  {
    $userId = $request->user()->id;

    // wipe old demo data for clean runs
    ListeningEvent::where('user_id', $userId)->delete();
    MoodDaily::where('user_id', $userId)->delete();
    MoodPattern::where('user_id', $userId)->delete();

    $start = Carbon::now()->subDays(30)->startOfDay();
    $events = [];

    for ($d = 0; $d < 30; $d++) {
      $day = $start->copy()->addDays($d);

      // create 10-30 events/day
      $n = rand(10, 30);

      for ($i = 0; $i < $n; $i++) {
        $hour = rand(7, 23);
        $minute = rand(0, 59);
        $playedAt = $day->copy()->setTime($hour, $minute);

        // Inject a pattern: Sunday evening lower valence
        $dow = strtolower($playedAt->format('l'));
        $isEvening = $hour >= 18;

        $baseValence = $isEvening && $dow === 'sunday'
          ? rand(10, 35) / 100
          : rand(35, 85) / 100;

        // Inject a pattern: Monday morning higher energy
        $isMorning = $hour < 12;
        $baseEnergy = $isMorning && $dow === 'monday'
          ? rand(70, 95) / 100
          : rand(35, 85) / 100;

        $events[] = [
          'user_id' => $userId,
          'played_at' => $playedAt,
          'valence' => $baseValence,
          'energy' => $baseEnergy,
          'track_name' => 'Demo Track ' . rand(1, 200),
          'artist_name' => 'Demo Artist ' . rand(1, 50),
          'created_at' => now(),
          'updated_at' => now(),
        ];
      }
    }

    ListeningEvent::insert($events);

    // ✅ Run analysis immediately (NO QUEUE)
    AnalyzeMoodJob::dispatchSync($userId);

    return back()->with('success', 'Demo data generated and analyzed.');
  }
}