<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MoodDaily extends Model
{
    protected $fillable = [
  'user_id',
  'day',
  'avg_valence',
  'avg_energy',
  'events_count',
];

    protected $guarded = [];
}
