<?php

namespace App\Http\Middleware;

use Illuminate\Http\Middleware\TrustProxies as Middleware;
use Illuminate\Http\Request;

class TrustProxies extends Middleware
{
    // In AWS ALB/ECS you usually want this:
    protected $proxies = '*';

    // Important:
    protected $headers = Request::HEADER_X_FORWARDED_ALL;
}