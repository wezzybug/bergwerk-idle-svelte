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
    const now = Date.now();
    serverJobs.forEach(j => {
      const job = JOBS[j.job_index];
      if (!job) return;
      const id = job.id;

      if (j.status === 'running' && j.start_time) {
        const startTime = new Date(j.start_time).getTime();
        const duration = j.duration_ms || job.duration * 1000;
        const endTime = startTime + duration;
        activeJobs[id] = { start: startTime, end: endTime, duration: duration / 1000, done: endTime <= now };
      } else if (j.status === 'cooldown' && j.cooldown_end) {
        jobCooldowns[id] = new Date(j.cooldown_end).getTime();
        delete activeJobs[id];
      } else {
        // Default: job available
        delete activeJobs[id];
        if (j.cooldown_end) {
          const cooldownEnd = new Date(j.cooldown_end).getTime();
          if (cooldownEnd > now) {
            jobCooldowns[id] = cooldownEnd;
          } else {
            delete jobCooldowns[id];
          }
        }
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
      // Clean up expired cooldowns
      for (const id in jobCooldowns) {
        if (jobCooldowns[id] <= Date.now()) {
          delete jobCooldowns[id];
          changed = true;
        }
      }
      if (changed) {
        activeJobs = { ...activeJobs };
        jobCooldowns = { ...jobCooldowns };
      }
    }, 1000);
    return () => clearInterval(timer);
  });

  async function startJob(id) {
    const r = await server.action('start_job', { job_id: id });
    if (r && r.success) {
      const duration = r.duration * 1000;
      activeJobs[id] = { start: r.start_time || Date.now(), end: (r.start_time || Date.now()) + duration, duration: r.duration, done: false };
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
      if (r.cooldown_end) {
        jobCooldowns[id] = new Date(r.cooldown_end).getTime();
      }
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