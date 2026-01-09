<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ListeningEvent extends Model
{
    protected $fillable = [
        'user_id',
        'played_at',
        'valence',
        'energy',
        'track_name',
        'artist_name',
    ];
}
