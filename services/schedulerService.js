const cron = require('node-cron');
const moment = require('moment-timezone');
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
   * Convert time to cron expression
   * @param {string} time - Time in HH:MM format (24-hour)
   * @returns {string} - Cron expression
   */
  getCronExpression(time) {
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
    // Use moment-timezone to get current date in IST
    const timezone = config.scheduler.timezone || 'Asia/Kolkata';
    return moment().tz(timezone).format('YYYY-MM-DD');
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
    const timezone = config.scheduler.timezone || 'Asia/Kolkata';

    // Get current time in IST for logging
    const currentTimeIST = moment().tz(timezone).format('YYYY-MM-DD HH:mm:ss');
    console.log(`[Scheduler] Starting daily report for ${date} at ${currentTimeIST} ${timezone}`);

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
      const timezone = config.scheduler.timezone || 'Asia/Kolkata';
      const time = config.scheduler.time || '20:00';
      const cronExpression = this.getCronExpression(time);

      console.log(`[Scheduler] Starting daily scheduler...`);
      console.log(`[Scheduler] Schedule: Daily at ${time} ${timezone}`);
      console.log(`[Scheduler] Channel ID: ${config.scheduler.channelId}`);
      console.log(`[Scheduler] Cron expression: ${cronExpression}`);

      // Convert IST time to UTC for cron (since node-cron timezone support may not work in all environments)
      // If scheduled time is 20:00 IST, we need to calculate what time that is in UTC
      const today = moment().tz(timezone).format('YYYY-MM-DD');
      const scheduledTimeIST = moment.tz(`${today} ${time}`, 'YYYY-MM-DD HH:mm', timezone);
      const scheduledTimeUTC = scheduledTimeIST.utc();
      
      const utcHours = scheduledTimeUTC.hours();
      const utcMinutes = scheduledTimeUTC.minutes();
      const utcCronExpression = `${utcMinutes} ${utcHours} * * *`;

      console.log(`[Scheduler] IST Time: ${time} ${timezone}`);
      console.log(`[Scheduler] UTC Time: ${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')} UTC`);
      console.log(`[Scheduler] Using UTC cron expression: ${utcCronExpression}`);

      // Create cron job using UTC time (more reliable across deployments)
      this.job = cron.schedule(utcCronExpression, async () => {
        await this.executeDailyReport();
      }, {
        scheduled: true,
        timezone: 'UTC' // Use UTC explicitly
      });

      console.log('[Scheduler] Scheduler started successfully!');
      
      // Log next execution time in IST
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
      const timezone = config.scheduler.timezone || 'Asia/Kolkata';
      const time = config.scheduler.time || '20:00';
      
      // Parse the scheduled time
      const [hours, minutes] = time.split(':').map(Number);
      
      // Get current time in IST
      const nowIST = moment().tz(timezone);
      
      // Create next execution time in IST
      let nextExecutionIST = moment.tz(timezone).hour(hours).minute(minutes).second(0).millisecond(0);
      
      // If time has passed today, schedule for tomorrow
      if (nextExecutionIST.isBefore(nowIST) || nextExecutionIST.isSame(nowIST)) {
        nextExecutionIST.add(1, 'day');
      }

      // Format in IST for display
      const formattedTime = nextExecutionIST.format('DD/M/YYYY, h:mm:ss a');
      
      console.log(`[Scheduler] Next execution scheduled for: ${formattedTime} (${timezone})`);
    } catch (error) {
      console.error('[Scheduler] Error calculating next execution:', error.message);
    }
  }
}

module.exports = new SchedulerService();
