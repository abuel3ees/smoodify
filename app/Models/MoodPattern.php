<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MoodPattern extends Model
{
    // app/Models/MoodPattern.php
protected $fillable = [
  'user_id',
  'pattern_key',
  'title',
  'summary',
  'meta',
];

protected $casts = [
  'meta' => 'array',
];
}
