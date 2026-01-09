<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('mood_dailies', function (Blueprint $table) {
  $table->id();
  $table->foreignId('user_id')->constrained()->cascadeOnDelete();
  $table->date('day')->index();
  $table->decimal('avg_valence', 5, 4)->nullable();
  $table->decimal('avg_energy', 5, 4)->nullable();
  $table->unsignedInteger('events_count')->default(0);
  $table->timestamps();
  $table->unique(['user_id', 'day']);
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mood_dailies');
    }
};
