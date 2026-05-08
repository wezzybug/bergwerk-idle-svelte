<script>
  import { gold, totalGold, totalGoldAllTime, gps, prestigeMultiplier } from '../stores/game.js';
  import { JOBS } from '../data/gameData.js';
  import { server } from '../services/server.js';
  import { fmt, fmtTime, cost } from '../utils/format.js';

  let activeJobs = {};  // { jobId: { start, duration, done } }
  let jobCooldowns = {}; // { jobId: endTime }

  setInterval(() => {
    // Check completed jobs
    for (const [id, job] of Object.entries(activeJobs)) {
      if (!job.done && Date.now() - job.start >= job.duration * 1000) {
        job.done = true;
      }
    }
  }, 1000);

  function jobReward(job) {
    if (job.multReward) {
      return Math.floor(job.reward * ($gps || 1) * $prestigeMultiplier * (job.duration / 10));
    }
    return job.reward;
  }

  function jobCooldownLeft(id) {
    if (!jobCooldowns[id]) return 0;
    return Math.max(0, (jobCooldowns[id] - Date.now()) / 1000);
  }

  function jobTimeLeft(id) {
    if (!activeJobs[id]) return 0;
    return Math.max(0, (activeJobs[id].start + activeJobs[id].duration * 1000 - Date.now()) / 1000);
  }

  async function startJob(id) {
    const r = await server.action('start_job', { job_id: id });
    if (r && r.success) {
      activeJobs[id] = { start: Date.now(), duration: r.duration, done: false };
    }
  }

  async function claimJob(id) {
    const r = await server.action('claim_job', { job_id: id });
    if (r && r.success) {
      $gold = r.gold;
      $totalGold += r.reward;
      $totalGoldAllTime += r.reward;
      const job = JOBS.find(j => j.id === id);
      if (job) job.count++;
      jobCooldowns[id] = Date.now() + (job.cooldown || 0) * 1000;
      delete activeJobs[id];
    }
  }
</script>

<div class="jobs-panel">
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
        <button class="job-btn claim" on:click={()=>claimJob(id)}>💰 Belohnung holen!</button>
      {:else}
        <button class="job-btn" on:click={()=>startJob(id)}>🔨 Schicht starten ({fmtTime(job.duration)})</button>
      {/if}
    </div>
  {/each}
</div>