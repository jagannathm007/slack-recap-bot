const cron = require('node-cron');
const config = require('../config/env');
const slackService = require('./slackService');
const geminiService = require('./geminiService');
const emailService = require('./emailService');

/**
 * Scheduler Service
 * Handles automated daily email reports using cron jobs
 */
class SchedulerService {
  constructor() {
    this.job = null;
    this.isRunning = false;
  }

  /**
   * Convert IST time to cron expression
   * @param {string} time - Time in HH:MM format (24-hour)
   * @param {string} timezone - Timezone (default: Asia/Kolkata)
   * @returns {string} - Cron expression
   */
  getCronExpression(time, timezone = 'Asia/Kolkata') {
    // Parse time string (HH:MM)
    const [hours, minutes] = time.split(':').map(Number);
    
    // Validate time
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error(`Invalid time format: ${time}. Use HH:MM format (24-hour).`);
    }

    // node-cron uses minutes hours day month weekday
    // For daily at specific time: minute hour * * *
    return `${minutes} ${hours} * * *`;
  }

  /**
   * Get today's date in YYYY-MM-DD format (IST)
   * @returns {string} - Date string
   */
  getTodayDateIST() {
    // Get current date in IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istTime = new Date(now.getTime() + istOffset);
    
    // Format as YYYY-MM-DD
    const year = istTime.getUTCFullYear();
    const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istTime.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  /**
   * Execute the daily report task
   */
  async executeDailyReport() {
    if (this.isRunning) {
      console.log('[Scheduler] Previous job still running, skipping this execution.');
      return;
    }

    this.isRunning = true;
    const date = this.getTodayDateIST();
    const channelId = config.scheduler.channelId;

    console.log(`[Scheduler] Starting daily report for ${date} at ${new Date().toISOString()}`);

    try {
      // Validate configuration
      if (!config.slack.botToken) {
        throw new Error('SLACK_BOT_OAUTH_TOKEN is required for scheduled reports');
      }

      if (!channelId) {
        throw new Error('SCHEDULER_CHANNEL_ID is required for scheduled reports');
      }

      // Fetch messages from Slack
      console.log(`[Scheduler] Fetching messages from channel ${channelId} for date ${date}`);
      const messages = await slackService.getMessagesByDate(
        config.slack.botToken,
        channelId,
        date
      );

      console.log(`[Scheduler] Found ${messages.length} messages`);

      // Generate summary
      let summary = null;
      try {
        if (messages.length > 0) {
          summary = await geminiService.summarizeMessages(messages, date, channelId);
          console.log('[Scheduler] Summary generated successfully');
        } else {
          summary = 'No messages found for today.';
          console.log('[Scheduler] No messages found, using default summary');
        }
      } catch (error) {
        console.error('[Scheduler] Error generating summary:', error.message);
        // Continue even if summary fails
        summary = messages.length > 0 
          ? `Summary generation failed. Found ${messages.length} messages today.`
          : 'No messages found for today.';
      }

      // Send email
      if (summary) {
        try {
          const emailResult = await emailService.sendSummary(
            summary,
            date,
            channelId,
            messages.length
          );
          console.log(`[Scheduler] Email sent successfully. Message ID: ${emailResult.messageId}`);
        } catch (error) {
          console.error('[Scheduler] Error sending email:', error.message);
          throw error; // Re-throw to mark job as failed
        }
      }

      console.log(`[Scheduler] Daily report completed successfully for ${date}`);
    } catch (error) {
      console.error(`[Scheduler] Error executing daily report:`, error.message);
      console.error(error.stack);
      // Don't throw - allow scheduler to continue for next day
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start the scheduler
   */
  start() {
    if (!config.scheduler.enabled) {
      console.log('[Scheduler] Scheduler is disabled. Set SCHEDULER_ENABLED=true to enable.');
      return;
    }

    if (!config.scheduler.channelId) {
      console.log('[Scheduler] SCHEDULER_CHANNEL_ID not configured. Scheduler not started.');
      return;
    }

    if (!config.slack.botToken) {
      console.log('[Scheduler] SLACK_BOT_OAUTH_TOKEN not configured. Scheduler not started.');
      return;
    }

    try {
      const cronExpression = this.getCronExpression(
        config.scheduler.time,
        config.scheduler.timezone
      );

      console.log(`[Scheduler] Starting daily scheduler...`);
      console.log(`[Scheduler] Schedule: Daily at ${config.scheduler.time} ${config.scheduler.timezone}`);
      console.log(`[Scheduler] Channel ID: ${config.scheduler.channelId}`);
      console.log(`[Scheduler] Cron expression: ${cronExpression}`);

      // Create cron job
      this.job = cron.schedule(cronExpression, async () => {
        await this.executeDailyReport();
      }, {
        scheduled: true,
        timezone: config.scheduler.timezone
      });

      console.log('[Scheduler] Scheduler started successfully!');
      console.log(`[Scheduler] Next execution will be at ${config.scheduler.time} ${config.scheduler.timezone} tomorrow.`);

      // Optional: Log next execution time
      this.logNextExecution();

    } catch (error) {
      console.error('[Scheduler] Error starting scheduler:', error.message);
      throw error;
    }
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.job) {
      this.job.stop();
      this.job = null;
      console.log('[Scheduler] Scheduler stopped.');
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      enabled: config.scheduler.enabled,
      running: this.job !== null,
      channelId: config.scheduler.channelId,
      time: config.scheduler.time,
      timezone: config.scheduler.timezone,
      isExecuting: this.isRunning
    };
  }

  /**
   * Log next execution time (for debugging)
   */
  logNextExecution() {
    try {
      const [hours, minutes] = config.scheduler.time.split(':').map(Number);
      const now = new Date();
      const nextExecution = new Date();
      nextExecution.setHours(hours, minutes, 0, 0);
      
      // If time has passed today, schedule for tomorrow
      if (nextExecution <= now) {
        nextExecution.setDate(nextExecution.getDate() + 1);
      }

      console.log(`[Scheduler] Next execution scheduled for: ${nextExecution.toLocaleString('en-IN', { timeZone: config.scheduler.timezone })}`);
    } catch (error) {
      // Ignore errors in logging
    }
  }
}

module.exports = new SchedulerService();
