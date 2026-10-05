export interface BranchFailure {
  branch: string; // hours.library.ubc.ca id, e.g. `koerner`
  target: string; // the venue/building name in UBSeats
  reason: string;
}

export function formatAlert(failures: BranchFailure[], runStartedAt: Date): { subject: string; text: string } {
  const lines = failures.map((f) => `- ${f.target} (${f.branch}): ${f.reason}`);
  return {
    subject: `UBSeats: ${failures.length} library branch${failures.length === 1 ? '' : 'es'} kept stale hours`,
    text: [
      `The weekly library hours sync started at ${runStartedAt.toISOString()} could not update:`,
      '',
      ...lines,
      '',
      "These branches still show last week's hours, which may include a holiday that has passed.",
      'Source: https://hours.library.ubc.ca/',
    ].join('\n'),
  };
}

/**
 * Sends the stale-branch alert through Resend. Missing configuration is logged, not
 * thrown: the hours that did sync are already saved, and the run should still report them.
 */
export async function sendAlertEmail(failures: BranchFailure[], runStartedAt: Date): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const to = Deno.env.get('ALERT_EMAIL_TO');
  if (!apiKey || !to) {
    console.error('RESEND_API_KEY / ALERT_EMAIL_TO not set; stale branches:', failures);
    return;
  }

  const { subject, text } = formatAlert(failures, runStartedAt);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: Deno.env.get('ALERT_EMAIL_FROM') ?? 'UBSeats <onboarding@resend.dev>',
      to: [to],
      subject,
      text,
    }),
  });
  if (!response.ok) {
    console.error(`alert email failed: ${response.status} ${await response.text()}`);
  }
}
