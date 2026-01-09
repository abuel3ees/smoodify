<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DashboardController;
use Laravel\Fortify\Features;
use App\Http\Controllers\DemoDataController;
Route::get('/', function () {
    return Inertia::render('pages', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'dashboard'])->name('dashboard');

    Route::middleware(['auth', 'verified'])->post('/demo-data/generate', [DemoDataController::class, 'generate']);
});

require __DIR__.'/settings.php';
