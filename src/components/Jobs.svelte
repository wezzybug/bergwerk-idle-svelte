<script>
  import { gold, totalGold, totalGoldAllTime, gps, prestigeMultiplier } from '../stores/game.js';
  import { JOBS } from '../data/gameData.js';
  import { server } from '../services/server.js';
  import { fmt, fmtTime } from '../utils/format.js';

  let activeJobs = $state({});
  let jobCooldowns = $state({});

  function jobReward(job) {
    if (job.multReward) return Math.floor(job.reward * ($gps || 1) * $prestigeMultiplier * (job.duration / 10));
    return job.reward;
  }

  function jobCooldownLeft(id) {
    if (!jobCooldowns[id]) return 0;
    return Math.max(0, (jobCooldowns[id] - Date.now()) / 1000);
  }
  function jobTimeLeft(id) {
    if (!activeJobs[id]) return 0;
    return Math.max(0, (activeJobs[id].end - Date.now()) / 1000);
  }

  // Sync active jobs from server
  export function syncJobs(serverJobs) {
    if (!serverJobs) return;
    serverJobs.forEach(j => {
      const job = JOBS[j.job_index];
      if (!job) return;
      const id = job.id;
      if (j.active) {
        const endTime = (j.start_time || Date.now() / 1000) * 1000 + job.duration * 1000;
        activeJobs[id] = { start: (j.start_time || Date.now() / 1000) * 1000, end: endTime, duration: job.duration, done: endTime <= Date.now() };
      } else {
        if (j.cooldown_end) {
          jobCooldowns[id] = j.cooldown_end * 1000;
        }
        delete activeJobs[id];
      }
    });
    activeJobs = { ...activeJobs };
    jobCooldowns = { ...jobCooldowns };
  }

  // Timer to mark jobs as done when timer expires
  import { onMount } from 'svelte';
  onMount(() => {
    const timer = setInterval(() => {
      let changed = false;
      for (const id in activeJobs) {
        if (!activeJobs[id].done && activeJobs[id].end <= Date.now()) {
          activeJobs[id] = { ...activeJobs[id], done: true };
          changed = true;
        }
      }
      if (changed) activeJobs = { ...activeJobs };
    }, 1000);
    return () => clearInterval(timer);
  });

  async function startJob(id) {
    const r = await server.action('start_job', { job_id: id });
    if (r && r.success) {
      activeJobs[id] = { start: Date.now(), end: Date.now() + r.duration * 1000, duration: r.duration, done: false };
      activeJobs = { ...activeJobs };
    }
  }

  async function claimJob(id) {
    const r = await server.action('claim_job', { job_id: id });
    if (r && r.success) {
      $gold = r.gold;
      $totalGold = r.total_gold ?? $totalGold;
      $totalGoldAllTime = r.total_gold_all_time ?? $totalGoldAllTime;
      const job = JOBS.find(j => j.id === id);
      if (job) job.count++;
      if (r.cooldown_end) jobCooldowns[id] = r.cooldown_end * 1000;
      delete activeJobs[id];
      activeJobs = { ...activeJobs };
      jobCooldowns = { ...jobCooldowns };
    }
  }
</script>

<h2>Jobs</h2>
{#each JOBS as job}
  {@const id = job.id}
  {@const reward = jobReward(job)}
  {@const cdLeft = jobCooldownLeft(id)}
  {@const timeLeft = jobTimeLeft(id)}
  {@const isActive = !!activeJobs[id]}
  {@const isDone = activeJobs[id]?.done}

  <div class="job">
    <div class="job-top">
      <span class="job-name">{job.name}</span>
      <span class="job-pay">{fmt(reward)} 🪙</span>
    </div>
    <div class="job-desc">{job.desc}</div>
    {#if cdLeft > 0}
      <button class="job-btn" disabled>⏳ Abkühlung ({fmtTime(cdLeft)})</button>
    {:else if isActive && !isDone}
      <button class="job-btn" disabled>⏳ {fmtTime(timeLeft)}</button>
    {:else if isDone}
      <button class="job-btn claim" onclick={()=>claimJob(id)}>💰 Belohnung holen!</button>
    {:else}
      <button class="job-btn" onclick={()=>startJob(id)}>🔨 Starten ({fmtTime(job.duration)})</button>
    {/if}
  </div>
{/each}