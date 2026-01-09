<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SpotifyAccount extends Model
{
    protected $fillable = [
        'user_id',
        'spotify_user_id',
        'access_token',
        'refresh_token',
    ];
}
