/* FiredBunny accounts on the website (Supabase): the project's address and its publishable key.
 *
 * Both values are public by design: they ship inside every page. What keeps each person's data private is the
 * row-level security in supabase/schema.sql. Leave them empty and the website works as it always has (everything saved
 * in the browser, no sign-in). NEVER put the service_role / secret key or the database password here.
 *
 * url:  Supabase → Project Settings → Data API → Project URL, e.g. 'https://abcdxyz.supabase.co'
 * key:  the publishable key ('sb_publishable_...'), or the "anon public" key on older projects
 * live: true shows accounts to every visitor. Until then they appear only in a browser that opened
 *       /signin/?preview=accounts (or an emailed sign-in link), so they can be tried on the real site first.
 *       Switch it on only once custom email sending (SMTP) is set up in Supabase: its built-in email reaches only the
 *       project's own team.
 */
window.SML.SUPABASE = { url: 'https://cwvgvzsrmcvpiqsbelyb.supabase.co', key: 'sb_publishable_6jcvTuP-ezIzUr7-ds-ySA_SM8kAiJu', live: true };
