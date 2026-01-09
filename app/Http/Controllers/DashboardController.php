<?php

namespace App\Http\Controllers;

use App\Models\MoodDaily;
use App\Models\MoodPattern;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function dashboard()
    {
        $userId = Auth::id();

        $daily = MoodDaily::where('user_id', $userId)
            ->orderBy('day')
            ->get();

        $patterns = MoodPattern::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('dashboard', [
            'dailySeries' => $daily->map(fn ($d) => [
                'day' => (string) $d->day,
                'avg_valence' => (float) $d->avg_valence,
                'avg_energy' => (float) $d->avg_energy,
                'events_count' => (int) $d->events_count,
            ])->values(),

            'stats' => [
                'daysCount' => $daily->count(),
                'eventsCount' => (int) $daily->sum('events_count'),
                'avgValence' => round((float) $daily->avg('avg_valence'), 3),
                'avgEnergy' => round((float) $daily->avg('avg_energy'), 3),
            ],

            'patterns' => $patterns,
            'user' => ['name' => Auth::user()?->name], // optional but your TSX uses it
        ]);
    }
}